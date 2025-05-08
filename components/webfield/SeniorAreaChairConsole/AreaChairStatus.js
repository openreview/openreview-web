/* globals promptError, promptMessage: false */
import { sortBy } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import copy from 'copy-to-clipboard'
import Link from 'next/link'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import AreaChairStatusMenuBar from '../ProgramChairConsole/AreaChairStatusMenuBar'
import { getProfileLink } from '../../../lib/webfield-utils'
import { getNoteContentValues } from '../../../lib/forum-utils'
import { pluralizeString, prettyField, getRoleHashFragment } from '../../../lib/utils'
import api from '../../../lib/api-client'
import SelectAllCheckBox from '../SelectAllCheckbox'

const CommitteeSummary = ({ rowData }) => {
  const { id, preferredName, title } = rowData.areaChairProfile ?? {}
  const { edgeBrowserDeployedUrl, reviewerName, preferredEmailInvitationId } =
    useContext(WebFieldContext)
  const edgeBrowserUrl = edgeBrowserDeployedUrl?.replaceAll('{ac.profile.id}', id)

  const getACEmail = async () => {
    if (!preferredEmailInvitationId) {
      promptError('Email is not available.', { scrollToTop: false })
      return
    }
    try {
      const result = await api.get(`/edges`, {
        invitation: preferredEmailInvitationId,
        head: id ?? rowData.areaChairProfileId,
      })
      const email = result.edges?.[0]?.tail
      if (!email) throw new Error('Email is not available.')
      copy(`${preferredName} <${email}>`)
      promptMessage(`${email} copied to clipboard`, { scrollToTop: false })
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
  }

  return (
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
                getACEmail()
              }}
            >
              Copy Email
            </a>
          )}
        </div>
      ) : (
        <h4>{rowData.areaChairProfileId}</h4>
      )}

      {edgeBrowserUrl && (
        <a target="_blank" rel="noreferrer" href={edgeBrowserUrl}>
          Modify {prettyField(reviewerName)} Assignments
        </a>
      )}
    </div>
  )
}

// modified based on notesAreaChairProgress.hbs
const NoteAreaChairProgress = ({ rowData, referrerUrl }) => {
  const numCompletedReviews = rowData.numCompletedReviews // eslint-disable-line prefer-destructuring
  const numPapers = rowData.notes.length
  const { submissionName, officialReviewName } = useContext(WebFieldContext)

  return (
    <div className="reviewer-progress">
      <h4>
        {numCompletedReviews} of {numPapers} {pluralizeString(submissionName)}{' '}
        {prettyField(officialReviewName)} Completed
      </h4>
      {rowData.notes.length !== 0 && (
        <strong className="paper-label">{pluralizeString(submissionName)}:</strong>
      )}
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
                      {numReviewsDone} of {numReviewersAssigned}{' '}
                      {pluralizeString(prettyField(officialReviewName))} Submitted{' '}
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
  submissionName,
  officialMetaReviewName,
}) => {
  const numCompletedMetaReviews = rowData.numCompletedMetaReviews // eslint-disable-line prefer-destructuring
  const numPapers = rowData.notes.length
  const { metaReviewRecommendationName = 'recommendation' } = useContext(WebFieldContext)

  return (
    <div className="areachair-progress">
      <h4>
        {numCompletedMetaReviews} of {numPapers} {pluralizeString(submissionName)} with{' '}
        {prettyField(officialMetaReviewName)} Completed
      </h4>
      {rowData.notes.length !== 0 && (
        <strong className="paper-label">{pluralizeString(submissionName)}:</strong>
      )}
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
                          Read Meta Review
                        </a>
                      </div>
                    )
                  })}
                </>
              ) : (
                <span>{`${noteVenue ? `${noteVenue} - ` : ''} No Meta Review`}</span>
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
  referrerUrl,
  submissionName,
  officialMetaReviewName,
  selectedAreaChairIds,
  setSelectedAreaChairIds,
}) => (
  <tr>
    <td>
      <input
        type="checkbox"
        checked={selectedAreaChairIds.includes(rowData.areaChairProfileId)}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedAreaChairIds((areaChairIds) => [
              ...areaChairIds,
              rowData.areaChairProfileId,
            ])
            return
          }
          setSelectedAreaChairIds((areaChairIds) =>
            areaChairIds.filter((p) => p !== rowData.areaChairProfileId)
          )
        }}
      />
    </td>
    <td>
      <strong>{rowData.number}</strong>
    </td>
    <td>
      <CommitteeSummary rowData={rowData} />
    </td>
    <td>
      <NoteAreaChairProgress rowData={rowData} referrerUrl={referrerUrl} />
    </td>
    <td>
      <NoteAreaChairStatus
        rowData={rowData}
        referrerUrl={referrerUrl}
        submissionName={submissionName}
        officialMetaReviewName={officialMetaReviewName}
      />
    </td>
  </tr>
)

const AreaChairStatus = ({ sacConsoleData, loadSacConsoleData, user }) => {
  const [areaChairStatusTabData, setAreaChairStatusTabData] = useState({})
  const {
    seniorAreaChairName,
    areaChairName,
    venueId,
    officialReviewName,
    submissionName,
    officialMetaReviewName,
  } = useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(
    sacConsoleData.assignedAreaChairIds?.length ?? 0
  )
  const [selectedAreaChairIds, setSelectedAreaChairIds] = useState([])
  const pageSize = 25
  const areaChairUrlFormat = getRoleHashFragment(areaChairName)
  const referrerUrl = encodeURIComponent(
    `[${prettyField(
      seniorAreaChairName
    )} Console](/group?id=${venueId}/${seniorAreaChairName}#${areaChairUrlFormat}-status)`
  )

  const calcACStatusTabData = () => {
    const acNotesMap = new Map()
    const allNoteNumbers = sacConsoleData.notes.map((p) => p.note.number)
    sacConsoleData.areaChairGroups.forEach((acGroup) => {
      acGroup.members.forEach((member) => {
        const noteNumber = acGroup.noteNumber // eslint-disable-line prefer-destructuring
        if (!allNoteNumbers.includes(noteNumber)) return // paper could have been desk rejected
        const reviewMetaReviewInfo =
          sacConsoleData.notes.find((p) => p.noteNumber === noteNumber) ?? {}
        if (acNotesMap.get(member.areaChairProfileId)) {
          acNotesMap
            .get(member.areaChairProfileId)
            .push({ noteNumber, ...reviewMetaReviewInfo })
        } else {
          acNotesMap.set(member.areaChairProfileId, [{ noteNumber, ...reviewMetaReviewInfo }])
        }
      })
    })
    const tableRows = sacConsoleData.assignedAreaChairIds.map((areaChairProfileId, index) => {
      const acProfile = sacConsoleData.allProfilesMap.get(areaChairProfileId)
      const notes = sortBy(acNotesMap.get(areaChairProfileId) ?? [], 'noteNumber')
      return {
        areaChairProfileId,
        areaChairProfile: acProfile,
        number: index + 1,
        completedRecommendations: 0,
        completedBids: 0,
        numCompletedReviews: notes.filter(
          (p) => p.reviewers?.length && p.reviewers?.length === p.officialReviews?.length
        ).length,
        numCompletedMetaReviews:
          notes.filter((p) => {
            const anonIdOfAC = p.metaReviewData.areaChairs.find(
              (q) => q.areaChairProfileId === areaChairProfileId
            )?.anonymousId
            return (
              anonIdOfAC && p.metaReviewData.metaReviews.find((q) => q.anonId === anonIdOfAC)
            )
          }).length ?? 0,
        notes,
      }
    })
    setAreaChairStatusTabData({
      tableRowsAll: tableRows,
      tableRows: [...tableRows],
    })
  }

  useEffect(() => {
    if (!sacConsoleData.notes) {
      loadSacConsoleData()
      return
    }
    if (!areaChairStatusTabData.tableRows) calcACStatusTabData()
  }, [sacConsoleData])

  useEffect(() => {
    setAreaChairStatusTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    setTotalCount(areaChairStatusTabData.tableRows?.length ?? 0)
  }, [pageNumber, areaChairStatusTabData.tableRows])

  useEffect(() => {
    if (!areaChairStatusTabData.tableRows?.length) return
    setTotalCount(areaChairStatusTabData.tableRows.length)
    setPageNumber(1)
  }, [areaChairStatusTabData.tableRows])

  if (!areaChairStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (areaChairStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        There are no {prettyField(areaChairName).toLowerCase()}. Check back later or{' '}
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
          bidEnabled={false}
          recommendationEnabled={false}
          messageParentGroup={`${venueId}/${areaChairName}`}
          messageSignature={user?.profile?.id}
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
        bidEnabled={false}
        recommendationEnabled={false}
        messageParentGroup={`${venueId}/${areaChairName}`}
        messageSignature={user?.profile?.id}
        selectedAreaChairIds={selectedAreaChairIds}
        setSelectedAreaChairIds={setSelectedAreaChairIds}
      />
      <Table
        className="console-table table-striped pc-console-ac-sac-status"
        headings={[
          {
            id: 'select-all',
            content: (
              <SelectAllCheckBox
                selectedIds={selectedAreaChairIds}
                setSelectedIds={setSelectedAreaChairIds}
                allIds={areaChairStatusTabData.tableRows?.map((row) => row.areaChairProfileId)}
              />
            ),
            width: '35px',
          },
          { id: 'number', content: '#', width: '55px' },
          { id: 'areachair', content: prettyField(areaChairName), width: '10%' },
          { id: 'reviewProgress', content: `${prettyField(officialReviewName)} Progress` },
          { id: 'status', content: 'Status' },
        ]}
      >
        {areaChairStatusTabData.tableRowsDisplayed?.map((row) => (
          <AreaChairStatusRow
            key={row.areaChairProfileId}
            rowData={row}
            referrerUrl={referrerUrl}
            submissionName={submissionName}
            officialMetaReviewName={officialMetaReviewName}
            selectedAreaChairIds={selectedAreaChairIds}
            setSelectedAreaChairIds={setSelectedAreaChairIds}
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
