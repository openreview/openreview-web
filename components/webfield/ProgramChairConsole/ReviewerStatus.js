/* globals promptError, promptMessage: false */
import { sortBy } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import copy from 'copy-to-clipboard'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import {
  getProfileName,
  inflect,
  pluralizeString,
  prettyField,
  getRoleHashFragment,
} from '../../../lib/utils'
import { buildEdgeBrowserUrl, getProfileLink } from '../../../lib/webfield-utils'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import ReviewerStatusMenuBar from './ReviewerStatusMenuBar'
import { NoteContentV2 } from '../../NoteContent'
import { formatProfileContent } from '../../../lib/edge-utils'

const ReviewerSummary = ({ rowData, bidEnabled, invitations }) => {
  const { id, preferredName, registrationNotes, title } = rowData.reviewerProfile ?? {}
  const { completedBids, reviewerProfileId } = rowData
  const { reviewersId, bidName, preferredEmailInvitationId } = useContext(WebFieldContext)
  const edgeBrowserBidsUrl = buildEdgeBrowserUrl(
    `tail:${id}`,
    invitations,
    reviewersId,
    bidName,
    null
  )
  const getReviewerEmail = async (name, profileId) => {
    if (!preferredEmailInvitationId) {
      promptError('Email is not available.')
      return
    }
    try {
      const result = await api.get(`/edges`, {
        invitation: preferredEmailInvitationId,
        head: profileId,
      })
      const email = result.edges?.[0]?.tail
      if (!email) throw new Error('Email is not available.')
      copy(`${name} <${email}>`)
      promptMessage(`${email} copied to clipboard`)
    } catch (error) {
      promptError(error.message)
    }
  }
  return (
    <div className="reviewer-summary">
      {preferredName ? (
        <div className="reviewer-info">
          <h4>
            <a href={getProfileLink(id ?? reviewerProfileId)} target="_blank" rel="noreferrer">
              {preferredName}
            </a>
          </h4>
          <div className="profile-title">{title}</div>
          {preferredEmailInvitationId && (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a
              href="#"
              className="copy-email-link"
              onClick={(e) => {
                e.preventDefault()
                getReviewerEmail(preferredName, id ?? reviewerProfileId)
              }}
            >
              Copy Email
            </a>
          )}
        </div>
      ) : (
        <h4>
          <a href={getProfileLink(id ?? reviewerProfileId)} target="_blank" rel="noreferrer">
            {reviewerProfileId}
          </a>
        </h4>
      )}
      <div>
        {bidEnabled && (
          <>
            <span>{`Completed Bids: ${completedBids}`}</span>{' '}
            {completedBids > 0 && (
              <div>
                <a
                  href={edgeBrowserBidsUrl}
                  className="show-reviewer-bids"
                  target="_blank"
                  rel="noreferrer"
                >
                  view all
                </a>
              </div>
            )}
          </>
        )}
      </div>
      {registrationNotes?.length > 0 && (
        <>
          <br />
          <strong className="paper-label">Registration Notes:</strong>
          {registrationNotes.map((note) => (
            <NoteContentV2
              key={note.id}
              id={note.id}
              content={note.content}
              noteReaders={note.readers}
            />
          ))}
        </>
      )}
    </div>
  )
}

// modified from notesReviewerProgress.hbs
const ReviewerProgress = ({
  rowData,
  referrerUrl,
  reviewRatingName,
  officialReviewName,
  submissionName,
}) => {
  const numPapers = rowData.notesInfo.length
  const { numCompletedReviews, notesInfo } = rowData

  return (
    <div className="review-progress">
      <h4>
        {numCompletedReviews} of {numPapers}{' '}
        {inflect(
          numPapers,
          prettyField(officialReviewName),
          pluralizeString(prettyField(officialReviewName))
        )}{' '}
        Submitted
      </h4>
      <strong className="paper-label">{pluralizeString(submissionName)}:</strong>
      <div className="paper-progress">
        {notesInfo.map((noteReviewInfo) => {
          const { noteNumber, note, officialReview } = noteReviewInfo
          return (
            <div key={noteNumber} className="paper-info">
              <strong className="paper-number">{noteNumber}.</strong>
              <div className="paper-title-review">
                <a
                  href={`/forum?id=${note?.forum}&referrer=${referrerUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {note?.content?.title?.value}
                </a>

                {officialReview && (
                  <>
                    {officialReview?.status ? (
                      <>
                        {officialReview.status.map((status) => (
                          <span key={status.name}> {`${status.name}:${status.value}`}</span>
                        ))}
                      </>
                    ) : (
                      <span>
                        {/* Rating: {officialReview.rating} / Confidence:{' '} */}
                        {(Array.isArray(reviewRatingName)
                          ? reviewRatingName
                          : [reviewRatingName]
                        ).map((ratingName, index) => {
                          let ratingValue
                          let ratingDisplayName
                          if (typeof ratingName === 'object') {
                            ratingDisplayName = Object.keys(ratingName)[0]
                            ratingValue = Object.values(ratingName)[0]
                              .map((p) => officialReview[p])
                              .find((q) => q !== undefined)
                          } else {
                            ratingDisplayName = ratingName
                            ratingValue = officialReview[ratingName]
                          }
                          if (ratingValue === undefined) return null
                          return (
                            <span key={ratingName}>
                              {prettyField(ratingDisplayName)}: {ratingValue}{' '}
                              {index < reviewRatingName.length - 1 && '/'}{' '}
                            </span>
                          )
                        })}
                        Confidence: {officialReview.confidence} / Review length:{' '}
                        {officialReview.reviewLength}
                      </span>
                    )}
                    <a
                      href={`/forum?id=${officialReview.forum}&noteId=${officialReview.id}&referrer=${referrerUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read {prettyField(officialReviewName)}
                    </a>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// modified from notesReviewerStatus.hbs
const ReviewerStatus = ({ rowData, officialReviewName, submissionName }) => {
  const { numOfPapersWhichCompletedReviews, notesInfo } = rowData
  const numPapers = notesInfo.length

  return (
    <div className="status-column">
      <h4>
        {numOfPapersWhichCompletedReviews} of {numPapers}{' '}
        {inflect(
          numPapers,
          prettyField(officialReviewName),
          pluralizeString(prettyField(officialReviewName))
        )}{' '}
        Completed
      </h4>
      <strong className="paper-label">{pluralizeString(submissionName)}:</strong>
      <div>
        {notesInfo.map((noteReviewInfo) => {
          const { noteNumber, numOfReviews, numOfReviewers, ratingAvg, ratingMax, ratingMin } =
            noteReviewInfo
          return (
            <div key={noteNumber} className="paper-info">
              <strong className="paper-number">{noteNumber}.</strong>
              <div className="review-rating-info">
                <strong>
                  {numOfReviews} of {numOfReviewers} Reviews Submitted{' '}
                </strong>
                {ratingAvg && (
                  <>
                    <span>Average Rating: {ratingAvg}</span>
                    <span>{`(Min: ${ratingMin}, Max: ${ratingMax})`}</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ReviewerStatusRow = ({
  rowData,
  referrerUrl,
  bidEnabled,
  invitations,
  reviewRatingName,
  officialReviewName,
  submissionName,
}) => (
  <tr>
    <td>
      <strong>{rowData.number}</strong>
    </td>
    <td>
      <ReviewerSummary rowData={rowData} bidEnabled={bidEnabled} invitations={invitations} />
    </td>
    <td>
      <ReviewerProgress
        rowData={rowData}
        referrerUrl={referrerUrl}
        reviewRatingName={reviewRatingName}
        officialReviewName={officialReviewName}
        submissionName={submissionName}
      />
    </td>
    <td>
      <ReviewerStatus
        rowData={rowData}
        officialReviewName={officialReviewName}
        submissionName={submissionName}
      />
    </td>
  </tr>
)

const ReviewerStatusTab = ({
  pcConsoleData,
  loadReviewMetaReviewData,
  loadRegistrationNoteMap,
  showContent,
}) => {
  const [reviewerStatusTabData, setReviewerStatusTabData] = useState({})
  const {
    venueId,
    bidName,
    reviewersId,
    reviewerName,
    shortPhrase,
    reviewerStatusExportColumns,
    reviewRatingName,
    officialReviewName,
    submissionName,
  } = useContext(WebFieldContext)
  const { accessToken } = useUser()
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.reviewers?.length ?? 0)
  const pageSize = 25
  const reviewerUrlFormat = getRoleHashFragment(reviewerName)
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#${reviewerUrlFormat}-status)`
  )
  const bidEnabled = bidName
    ? pcConsoleData.invitations?.find((p) => p.id === `${reviewersId}/-/${bidName}`)
    : false

  const loadReviewerData = async () => {
    if (reviewerStatusTabData.tableRowsAll) return
    if (!pcConsoleData.noteNumberReviewMetaReviewMap) {
      setTimeout(() => {
        loadReviewMetaReviewData()
      }, 500)
    } else {
      try {
        const reviewerWithoutAssignmentIds = pcConsoleData.reviewers.filter(
          (reviewerProfileId) => !pcConsoleData.allProfilesMap.get(reviewerProfileId)
        )
        const ids = reviewerWithoutAssignmentIds.filter((p) => p.startsWith('~'))
        const emails = reviewerWithoutAssignmentIds.filter((p) => p.match(/.+@.+/))
        const getProfilesByIdsP = ids.length
          ? api.post(
              '/profiles/search',
              {
                ids,
              },
              { accessToken }
            )
          : Promise.resolve([])
        const getProfilesByEmailsP = emails.length
          ? api.post(
              '/profiles/search',
              {
                emails,
              },
              { accessToken }
            )
          : Promise.resolve([])
        const reviewerProfileResults = await Promise.all([
          getProfilesByIdsP,
          getProfilesByEmailsP,
        ])
        const reviewerProfilesWithoutAssignment = (reviewerProfileResults[0].profiles ?? [])
          .concat(reviewerProfileResults[1].profiles ?? [])
          .map((profile) => ({
            ...profile,
            preferredName: getProfileName(profile),
          }))
        const reviewerProfileWithoutAssignmentMap = new Map()
        reviewerProfilesWithoutAssignment.forEach((profile) => {
          const usernames = profile.content.names.flatMap((p) => p.username ?? [])

          let userRegNotes = []
          usernames.forEach((username) => {
            if (
              pcConsoleData.registrationNoteMap &&
              pcConsoleData.registrationNoteMap[username]
            ) {
              userRegNotes = userRegNotes.concat(pcConsoleData.registrationNoteMap[username])
            }
          })
          // eslint-disable-next-line no-param-reassign
          profile.registrationNotes = userRegNotes
          // eslint-disable-next-line no-param-reassign
          profile.title = formatProfileContent(profile.content).title

          usernames.concat(profile.email ?? []).forEach((key) => {
            reviewerProfileWithoutAssignmentMap.set(key, profile)
          })
        })

        // #region calc reviewer to notes map
        const reviewerNotesMap = new Map()
        const allNoteNumbers = pcConsoleData.notes.map((p) => p.number)
        pcConsoleData.paperGroups.reviewerGroups.forEach((reviewerGroup) => {
          reviewerGroup.members.forEach((member) => {
            const noteNumber = reviewerGroup.noteNumber // eslint-disable-line prefer-destructuring
            if (!allNoteNumbers.includes(noteNumber)) return // paper could have been desk rejected
            const reviewMetaReviewInfo =
              pcConsoleData.noteNumberReviewMetaReviewMap.get(noteNumber) ?? {}
            const reviewerAnonIdOfNote = reviewMetaReviewInfo.reviewers.find(
              (p) => p.reviewerProfileId === member.reviewerProfileId
            )?.anonymousId
            if (reviewerNotesMap.get(member.reviewerProfileId)) {
              reviewerNotesMap.get(member.reviewerProfileId).push({
                noteNumber,
                note: reviewMetaReviewInfo.note,
                officialReview: reviewMetaReviewInfo.officialReviews?.find(
                  (p) => p.anonymousId === reviewerAnonIdOfNote
                ),
                anonymousId: reviewerAnonIdOfNote,
                numOfReviews: reviewMetaReviewInfo.officialReviews?.length ?? 0,
                numOfReviewers: reviewMetaReviewInfo.reviewers?.length ?? 0,
                ratingAvg: reviewMetaReviewInfo.reviewProgressData?.ratingAvg,
                ratingMin: reviewMetaReviewInfo.reviewProgressData?.ratingMin,
                ratingMax: reviewMetaReviewInfo.reviewProgressData?.ratingMax,
              })
            } else {
              reviewerNotesMap.set(member.reviewerProfileId, [
                {
                  noteNumber,
                  note: reviewMetaReviewInfo.note,
                  officialReview: reviewMetaReviewInfo.officialReviews?.find(
                    (p) => p.anonymousId === reviewerAnonIdOfNote
                  ),
                  anonymousId: reviewerAnonIdOfNote,
                  numOfReviews: reviewMetaReviewInfo.officialReviews?.length ?? 0,
                  numOfReviewers: reviewMetaReviewInfo.reviewers?.length ?? 0,
                  ratingAvg: reviewMetaReviewInfo.reviewProgressData?.ratingAvg,
                  ratingMin: reviewMetaReviewInfo.reviewProgressData?.ratingMin,
                  ratingMax: reviewMetaReviewInfo.reviewProgressData?.ratingMax,
                },
              ])
            }
          })
        })
        // #endregion

        // #region get bid count
        const reviewerBidCountMap = new Map()
        pcConsoleData.bidCounts.reviewers.forEach((bidCount) => {
          reviewerBidCountMap.set(bidCount.id.tail, bidCount.count)
        })
        // #endregion

        // TODO: Use pcConsoleData to add registration forms to tableRow
        const tableRows = pcConsoleData.reviewers.map((reviewerProfileId, index) => {
          const notesInfo = sortBy(reviewerNotesMap.get(reviewerProfileId) ?? [], 'noteNumber')
          return {
            number: index + 1,
            reviewerProfileId,
            reviewerProfile: reviewerWithoutAssignmentIds.includes(reviewerProfileId)
              ? reviewerProfileWithoutAssignmentMap.get(reviewerProfileId)
              : pcConsoleData.allProfilesMap.get(reviewerProfileId),
            notesInfo,
            numCompletedReviews: notesInfo.filter((p) => p.officialReview).length ?? 0,
            numOfPapersWhichCompletedReviews:
              notesInfo.filter((p) => p.numOfReviews === p.numOfReviewers).length ?? 0,
            completedBids: reviewerBidCountMap.get(reviewerProfileId) ?? 0,
          }
        })
        setReviewerStatusTabData({ tableRowsAll: tableRows, tableRows: [...tableRows] })
      } catch (error) {
        promptError(`loading ${prettyField(reviewerName)} status: ${error.message}`)
      }
    }
  }

  useEffect(() => {
    if (!pcConsoleData.reviewers || !showContent) return
    if (!pcConsoleData.registrationNoteMap) {
      loadRegistrationNoteMap()
    } else {
      loadReviewerData()
    }
  }, [
    pcConsoleData.reviewers,
    pcConsoleData.noteNumberReviewMetaReviewMap,
    pcConsoleData.registrationNoteMap,
    showContent,
  ])

  useEffect(() => {
    setReviewerStatusTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    setTotalCount(reviewerStatusTabData.tableRows?.length ?? 0)
  }, [pageNumber, reviewerStatusTabData.tableRows])

  useEffect(() => {
    if (!reviewerStatusTabData.tableRows?.length) return
    setTotalCount(reviewerStatusTabData.tableRows.length)
    setPageNumber(1)
  }, [reviewerStatusTabData.tableRows])

  if (!reviewerStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (reviewerStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        There are no {prettyField(reviewerName)}.Check back later or contact
        info@openreview.net if you believe this to be an error.
      </p>
    )
  if (reviewerStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <ReviewerStatusMenuBar
          tableRowsAll={reviewerStatusTabData.tableRowsAll}
          tableRows={reviewerStatusTabData.tableRows}
          setReviewerStatusTabData={setReviewerStatusTabData}
          shortPhrase={shortPhrase}
          exportColumns={reviewerStatusExportColumns}
          bidEnabled={bidEnabled}
          messageParentGroup={reviewersId}
          messageSignature={venueId}
        />
        <p className="empty-message">
          No {prettyField(reviewerName)} matching search criteria.
        </p>
      </div>
    )
  return (
    <div className="table-container">
      <ReviewerStatusMenuBar
        tableRowsAll={reviewerStatusTabData.tableRowsAll}
        tableRows={reviewerStatusTabData.tableRows}
        setReviewerStatusTabData={setReviewerStatusTabData}
        shortPhrase={shortPhrase}
        exportColumns={reviewerStatusExportColumns}
        bidEnabled={bidEnabled}
        messageParentGroup={reviewersId}
        messageSignature={venueId}
      />
      <Table
        className="console-table table-striped pc-console-reviewer-status"
        headings={[
          { id: 'number', content: '#', width: '55px' },
          { id: 'reviewer', content: prettyField(reviewerName), width: '15%' },
          {
            id: 'reviewProgress',
            content: `${prettyField(officialReviewName)} Progress`,
            width: '40%',
          },
          { id: 'status', content: 'Status' },
        ]}
      >
        {reviewerStatusTabData.tableRowsDisplayed?.map((row) => (
          <ReviewerStatusRow
            key={row.number}
            rowData={row}
            referrerUrl={referrerUrl}
            bidEnabled={bidEnabled}
            invitations={pcConsoleData.invitations}
            officialReviewName={officialReviewName}
            reviewRatingName={reviewRatingName}
            submissionName={submissionName}
          />
        ))}
      </Table>
      <PaginationLinks
        currentPage={pageNumber}
        itemsPerPage={pageSize}
        totalCount={totalCount}
        setCurrentPage={setPageNumber}
        options={{ noScroll: true, showCount: true }}
      />
    </div>
  )
}

export default ReviewerStatusTab
