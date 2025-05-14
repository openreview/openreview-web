/* globals promptError, promptMessage: false */
import { sortBy } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import copy from 'copy-to-clipboard'
import Link from 'next/link'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import AreaChairStatusMenuBar from './AreaChairStatusMenuBar'
import { NoteContentV2 } from '../../NoteContent'
import { buildEdgeBrowserUrl, getProfileLink } from '../../../lib/webfield-utils'
import { getNoteContentValues } from '../../../lib/forum-utils'
import api from '../../../lib/api-client'
import { prettyField, pluralizeString, getRoleHashFragment } from '../../../lib/utils'

const CommitteeSummary = ({ rowData, bidEnabled, recommendationEnabled, invitations }) => {
  const { id, preferredName, registrationNotes, title } = rowData.areaChairProfile ?? {}
  const { sacProfile, seniorAreaChairId } = rowData.seniorAreaChair ?? {}
  const {
    seniorAreaChairName = 'Senior_Area_Chairs',
    areaChairsId,
    reviewersId,
    reviewerName,
    bidName,
    scoresName,
    recommendationName,
    preferredEmailInvitationId,
  } = useContext(WebFieldContext)
  const completedBids = rowData.completedBids // eslint-disable-line prefer-destructuring
  const completedRecs = rowData.completedRecommendations
  const edgeBrowserBidsUrl = buildEdgeBrowserUrl(
    `tail:${id}`,
    invitations,
    areaChairsId,
    bidName,
    scoresName
  )
  const edgeBrowserRecsUrl = buildEdgeBrowserUrl(
    `signatory:${id}`,
    invitations,
    reviewersId,
    recommendationName,
    scoresName
  )

  const getACSACEmail = async (name, profileId) => {
    if (!preferredEmailInvitationId) {
      promptError('Email is not available.', { scrollToTop: false })
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
      promptMessage(`${email} copied to clipboard`, { scrollToTop: false })
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
  }

  return (
    <>
      <div className="ac-sac-summary">
        {preferredName ? (
          <div className="ac-sac-info">
            <h4>
              <a
                href={getProfileLink(id ?? rowData.areaChairProfileId)}
                target="_blank"
                rel="noreferrer"
              >
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
                  getACSACEmail(preferredName, id ?? rowData.areaChairProfileId)
                }}
              >
                Copy Email
              </a>
            )}
          </div>
        ) : (
          <h4>{rowData.areaChairProfileId}</h4>
        )}
        <p>
          {bidEnabled && (
            <>
              {`Completed Bids: ${completedBids}`}{' '}
              {completedBids > 0 && (
                <a
                  href={edgeBrowserBidsUrl}
                  className="show-reviewer-bids"
                  target="_blank"
                  rel="noreferrer"
                >
                  view all
                </a>
              )}
            </>
          )}
          {recommendationEnabled && (
            <>
              {`${prettyField(reviewerName)} Recommended: ${completedRecs}`}{' '}
              {completedBids > 0 && (
                <a
                  href={edgeBrowserRecsUrl}
                  className="show-reviewer-bids"
                  target="_blank"
                  rel="noreferrer"
                >
                  view all
                </a>
              )}
            </>
          )}
        </p>
      </div>
      {sacProfile && (
        <div className="ac-sac-summary">
          <h4>{prettyField(seniorAreaChairName)}: </h4>

          {sacProfile?.preferredName && (
            <div className="ac-sac-info">
              <h4>
                <a
                  href={getProfileLink(sacProfile?.id ?? seniorAreaChairId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {sacProfile.preferredName}
                </a>
              </h4>
              <div className="profile-title">{sacProfile.title}</div>
              {preferredEmailInvitationId && (
                // eslint-disable-next-line jsx-a11y/anchor-is-valid
                <a
                  href="#"
                  className="copy-email-link"
                  onClick={(e) => {
                    e.preventDefault()
                    getACSACEmail(
                      sacProfile.preferredName,
                      sacProfile?.id ?? seniorAreaChairId
                    )
                  }}
                >
                  Copy Email
                </a>
              )}
            </div>
          )}
        </div>
      )}
      {registrationNotes?.length > 0 && (
        <>
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
    </>
  )
}

// modified based on notesAreaChairProgress.hbs
const NoteAreaChairProgress = ({
  rowData,
  referrerUrl,
  officialReviewName,
  submissionName,
}) => {
  const numCompletedReviews = rowData.numCompletedReviews // eslint-disable-line prefer-destructuring
  const numPapers = rowData.notes.length
  return (
    <div className="reviewer-progress">
      <h4>
        {numCompletedReviews} of {numPapers} {pluralizeString(submissionName)} with{' '}
        {pluralizeString(prettyField(officialReviewName))} Completed
      </h4>
      {rowData.notes.length !== 0 && <strong>{pluralizeString(submissionName)}:</strong>}
      <div className="review-progress">
        {rowData.notes.map((p) => {
          const { numReviewsDone, numReviewersAssigned, ratingAvg, ratingMin, ratingMax } =
            p.reviewProgressData
          const noteTitle = p.note?.content?.title?.value
          return (
            <div key={p.noteNumber}>
              <div className="note-info">
                <strong className="note-number">{p.noteNumber}</strong>
                <div className="review-info">
                  <a
                    href={`/forum?id=${p.note.forum}&referrer=${referrerUrl}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {noteTitle}
                  </a>
                  <div>
                    <strong>
                      {numReviewsDone} of {numReviewersAssigned} Reviews Submitted{' '}
                    </strong>
                    {ratingAvg &&
                      `/ Average Rating:${ratingAvg} (Min: ${ratingMin}, Max: ${ratingMax})`}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// modified based on notesAreaChairStatus.hbs
const NoteAreaChairStatus = ({
  rowData,
  referrerUrl,
  metaReviewRecommendationName,
  officialMetaReviewName,
  submissionName,
}) => {
  const numCompletedMetaReviews = rowData.numCompletedMetaReviews // eslint-disable-line prefer-destructuring
  const numPapers = rowData.notes.length
  return (
    <div className="areachair-progress">
      <h4>
        {numCompletedMetaReviews} of {numPapers} {pluralizeString(submissionName)} with{' '}
        {pluralizeString(prettyField(officialMetaReviewName))} Completed
      </h4>
      {rowData.notes.length !== 0 && <strong>{pluralizeString(submissionName)}:</strong>}
      <div>
        {rowData.notes.map((p) => {
          const noteContent = getNoteContentValues(p.note?.content)
          const noteVenue = noteContent?.venue
          const metaReviews = p.metaReviewData?.metaReviews
          const hasMetaReview = metaReviews?.length
          return (
            <div key={p.noteNumber} className="meta-review-info">
              <strong className="note-number">{p.noteNumber}</strong>
              {hasMetaReview ? (
                <>
                  {metaReviews.map((metaReview) => {
                    const metaReviewContent = getNoteContentValues(metaReview?.content)
                    return (
                      <div key={metaReview.id} className="meta-review">
                        <span>{`${
                          metaReviewContent.venue ? `${metaReviewContent.venue} - ` : ''
                        }${metaReviewContent[metaReviewRecommendationName] ?? ''}`}</span>
                        {metaReviewContent.format && (
                          <span>Format: {metaReviewContent.format}</span>
                        )}
                        <a
                          href={`/forum?id=${metaReview.forum}&noteId=${metaReview.id}&referrer=${referrerUrl}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Read {prettyField(officialMetaReviewName)}
                        </a>
                      </div>
                    )
                  })}
                </>
              ) : (
                <span>{`${noteVenue ? `${noteVenue} - ` : ''} No ${prettyField(
                  officialMetaReviewName
                )}`}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const AreaChairStatusRow = ({
  rowData,
  bidEnabled,
  recommendationEnabled,
  invitations,
  officialReviewName,
  officialMetaReviewName,
  metaReviewRecommendationName,
  referrerUrl,
  submissionName,
}) => (
  <tr>
    <td>
      <strong>{rowData.number}</strong>
    </td>
    <td>
      <CommitteeSummary
        rowData={rowData}
        bidEnabled={bidEnabled}
        recommendationEnabled={recommendationEnabled}
        invitations={invitations}
      />
    </td>
    <td>
      <NoteAreaChairProgress
        rowData={rowData}
        referrerUrl={referrerUrl}
        officialReviewName={officialReviewName}
        submissionName={submissionName}
      />
    </td>
    <td>
      <NoteAreaChairStatus
        rowData={rowData}
        referrerUrl={referrerUrl}
        metaReviewRecommendationName={metaReviewRecommendationName}
        officialMetaReviewName={officialMetaReviewName}
        submissionName={submissionName}
      />
    </td>
  </tr>
)

const AreaChairStatus = ({
  pcConsoleData,
  loadSacAcInfo,
  loadReviewMetaReviewData,
  loadRegistrationNoteMap,
}) => {
  const [areaChairStatusTabData, setAreaChairStatusTabData] = useState({})
  const {
    shortPhrase,
    seniorAreaChairsId,
    areaChairsId,
    areaChairName,
    reviewersId,
    bidName,
    recommendationName,
    officialReviewName,
    officialMetaReviewName,
    metaReviewRecommendationName = 'recommendation',
    venueId,
    submissionName,
  } = useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.areaChairs?.length ?? 0)
  const pageSize = 25
  const bidEnabled = bidName
    ? pcConsoleData.invitations?.find((p) => p.id === `${areaChairsId}/-/${bidName}`)
    : false
  const recommendationEnabled = pcConsoleData.invitations?.some(
    (p) => p.id === `${reviewersId}/-/${recommendationName}`
  )
  const areaChairUrlFormat = getRoleHashFragment(areaChairName)
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#${areaChairUrlFormat}-status)`
  )

  const loadACStatusTabData = async () => {
    if (!pcConsoleData.registrationNoteMap) {
      loadRegistrationNoteMap()
    } else if (!pcConsoleData.sacAcInfo) {
      loadSacAcInfo()
    } else if (!pcConsoleData.noteNumberReviewMetaReviewMap) {
      loadReviewMetaReviewData()
    } else {
      try {
        // #region calc ac to notes map
        const acNotesMap = new Map()
        const allNoteNumbers = pcConsoleData.notes.map((p) => p.number)
        pcConsoleData.paperGroups.areaChairGroups.forEach((acGroup) => {
          // const members = acGroup.members
          acGroup.members.forEach((member) => {
            const noteNumber = acGroup.noteNumber // eslint-disable-line prefer-destructuring
            if (!allNoteNumbers.includes(noteNumber)) return // paper could have been desk rejected
            const reviewMetaReviewInfo =
              pcConsoleData.noteNumberReviewMetaReviewMap.get(noteNumber) ?? {}
            if (acNotesMap.get(member.areaChairProfileId)) {
              acNotesMap
                .get(member.areaChairProfileId)
                .push({ noteNumber, ...reviewMetaReviewInfo })
            } else {
              acNotesMap.set(member.areaChairProfileId, [
                { noteNumber, ...reviewMetaReviewInfo },
              ])
            }
          })
        })
        // #endregion
        // TODO: Use pcConsoleData to add registration forms to tableRow
        const tableRows = pcConsoleData.areaChairs.map((areaChairProfileId, index) => {
          let sacId = null
          let sacProfile = null
          if (seniorAreaChairsId) {
            sacId = pcConsoleData.sacAcInfo.sacByAcMap.get(areaChairProfileId)
            if (pcConsoleData.sacAcInfo.seniorAreaChairWithoutAssignmentIds.includes(sacId)) {
              sacProfile = pcConsoleData.sacAcInfo.acSacProfileWithoutAssignmentMap.get(sacId)
            } else {
              sacProfile = pcConsoleData.allProfilesMap.get(sacId)
            }
          }
          let acProfile = null
          if (
            pcConsoleData.sacAcInfo.areaChairWithoutAssignmentIds.includes(areaChairProfileId)
          ) {
            acProfile =
              pcConsoleData.sacAcInfo.acSacProfileWithoutAssignmentMap.get(areaChairProfileId)
          } else {
            acProfile = pcConsoleData.allProfilesMap.get(areaChairProfileId)
          }
          const notes = sortBy(acNotesMap.get(areaChairProfileId) ?? [], 'noteNumber')
          return {
            areaChairProfileId,
            areaChairProfile: acProfile,
            number: index + 1,
            completedRecommendations:
              pcConsoleData.acRecommendationsCount?.[areaChairProfileId] ?? 0,
            completedBids:
              pcConsoleData.bidCounts?.areaChairs?.find(
                (p) => p.id?.tail === areaChairProfileId
              )?.count ?? 0,
            numCompletedReviews: notes.filter(
              (p) => p.reviewers?.length && p.reviewers?.length === p.officialReviews?.length
            ).length,
            numCompletedMetaReviews:
              notes.filter((p) => {
                const anonIdOfAC = p.metaReviewData.areaChairs.find(
                  (q) => q.areaChairProfileId === areaChairProfileId
                )?.anonymousId
                return (
                  anonIdOfAC &&
                  p.metaReviewData.metaReviews.find((q) => q.anonId === anonIdOfAC)
                )
              }).length ?? 0,
            notes,
            ...(seniorAreaChairsId && {
              seniorAreaChair: {
                seniorAreaChairId: sacId,
                sacProfile,
              },
            }),
          }
        })
        setAreaChairStatusTabData({
          tableRowsAll: tableRows,
          tableRows: [...tableRows],
        })
      } catch (error) {
        promptError(`loading ${prettyField(areaChairName)} status: ${error.message}`)
      }
    }
  }

  useEffect(() => {
    if (!pcConsoleData.paperGroups?.areaChairGroups) return
    loadACStatusTabData()
  }, [
    pcConsoleData.paperGroups?.areaChairGroups,
    pcConsoleData.sacAcInfo,
    pcConsoleData.noteNumberReviewMetaReviewMap,
    pcConsoleData.registrationNoteMap,
  ])

  useEffect(() => {
    setAreaChairStatusTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    setTotalCount(areaChairStatusTabData.tableRows?.length ?? 0)
  }, [
    pageNumber,
    pcConsoleData.paperGroups?.areaChairGroups,
    areaChairStatusTabData.tableRows,
  ])

  useEffect(() => {
    if (!areaChairStatusTabData.tableRows?.length) return
    setTotalCount(areaChairStatusTabData.tableRows.length)
    setPageNumber(1)
  }, [areaChairStatusTabData.tableRows])

  if (!areaChairStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (areaChairStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        There are no {prettyField(areaChairName)}. Check back later or{' '}
        <Link href={`/contact`}>contact us</Link> if you believe this to be an error.
      </p>
    )
  if (areaChairStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <AreaChairStatusMenuBar
          tableRowsAll={areaChairStatusTabData.tableRowsAll}
          tableRows={areaChairStatusTabData.tableRows}
          setAreaChairStatusTabData={setAreaChairStatusTabData}
          shortPhrase={shortPhrase}
          bidEnabled={bidEnabled}
          recommendationEnabled={recommendationEnabled}
          messageParentGroup={areaChairsId}
          messageSignature={venueId}
        />
        <p className="empty-message">
          No {prettyField(areaChairName)} matching search criteria.
        </p>
      </div>
    )
  return (
    <div className="table-container">
      <AreaChairStatusMenuBar
        tableRowsAll={areaChairStatusTabData.tableRowsAll}
        tableRows={areaChairStatusTabData.tableRows}
        setAreaChairStatusTabData={setAreaChairStatusTabData}
        bidEnabled={bidEnabled}
        recommendationEnabled={recommendationEnabled}
        messageParentGroup={areaChairsId}
        messageSignature={venueId}
      />
      <Table
        className="console-table table-striped pc-console-ac-sac-status"
        headings={[
          { id: 'number', content: '#', width: '55px' },
          { id: 'areachair', content: `${prettyField(areaChairName)}`, width: '10%' },
          { id: 'reviewProgress', content: `${prettyField(officialReviewName)} Progress` },
          { id: 'status', content: 'Status' },
        ]}
      >
        {areaChairStatusTabData.tableRowsDisplayed?.map((row) => (
          <AreaChairStatusRow
            key={row.areaChairProfileId}
            rowData={row}
            bidEnabled={bidEnabled}
            recommendationEnabled={recommendationEnabled}
            invitations={pcConsoleData.invitations}
            officialReviewName={officialReviewName}
            officialMetaReviewName={officialMetaReviewName}
            metaReviewRecommendationName={metaReviewRecommendationName}
            referrerUrl={referrerUrl}
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

export default AreaChairStatus
