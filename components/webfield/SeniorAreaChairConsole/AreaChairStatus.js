/* globals promptError: false */
import { sortBy } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import AreaChairStatusMenuBar from '../ProgramChairConsole/AreaChairStatusMenuBar'
import { getProfileLink } from '../../../lib/webfield-utils'
import { getNoteContentValues } from '../../../lib/forum-utils'

const CommitteeSummary = ({ rowData }) => {
  const { id, preferredName, preferredEmail } = rowData.areaChairProfile ?? {}
  const { edgeBrowserDeployedUrl } = useContext(WebFieldContext)
  const edgeBrowserUrl = edgeBrowserDeployedUrl?.replaceAll('{ac.profile.id}', id)

  return (
    <>
      <div className="note">
        {preferredName ? (
          <>
            <h4>
              <a
                href={getProfileLink(id ?? rowData.areaChairProfileId)}
                target="_blank"
                rel="noreferrer"
              >
                {preferredName}
              </a>
            </h4>
            <p className="text-muted">({preferredEmail})</p>
            {edgeBrowserUrl && (
              <a target="_blank" rel="noreferrer" href={edgeBrowserUrl}>
                Modify Reviewer Assignments
              </a>
            )}
          </>
        ) : (
          <h4>{rowData.areaChairProfileId}</h4>
        )}
      </div>
    </>
  )
}

// modified based on notesAreaChairProgress.hbs
const NoteAreaChairProgress = ({ rowData, referrerUrl }) => {
  const numCompletedReviews = rowData.numCompletedReviews // eslint-disable-line prefer-destructuring
  const numPapers = rowData.notes.length

  return (
    <div className="reviewer-progress">
      <h4>
        {numCompletedReviews} of {numPapers} Papers Reviews Completed
      </h4>
      {rowData.notes.length !== 0 && <strong className="paper-label">Papers:</strong>}
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
const NoteAreaChairStatus = ({ rowData, referrerUrl, metaReviewRecommendationName }) => {
  const numCompletedMetaReviews = rowData.numCompletedMetaReviews // eslint-disable-line prefer-destructuring
  const numPapers = rowData.notes.length
  return (
    <div className="areachair-progress">
      <h4>
        {numCompletedMetaReviews} of {numPapers} Papers Meta Review Completed
      </h4>
      {rowData.notes.length !== 0 && <strong className="paper-label">Papers:</strong>}
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

const AreaChairStatusRow = ({ rowData, metaReviewRecommendationName, referrerUrl }) => (
  <tr>
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
        metaReviewRecommendationName={metaReviewRecommendationName}
      />
    </td>
  </tr>
)

const AreaChairStatus = ({ sacConsoleData, loadSacConsoleData }) => {
  const [areaChairStatusTabData, setAreaChairStatusTabData] = useState({})
  const { seniorAreaChairName, areaChairName, venueId, metaReviewRecommendationName } =
    useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(
    sacConsoleData.assignedAreaChairIds?.length ?? 0
  )
  const pageSize = 25
  const referrerUrl = encodeURIComponent(
    `[Senior Area Chair Console](/group?id=${venueId}/${seniorAreaChairName}#areachair-status)`
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
        There are no area chairs. Check back later or contact info@openreview.net if you
        believe this to be an error.
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
        />
        <p className="empty-message">No area chair matching search criteria.</p>
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
      />
      <Table
        className="console-table table-striped pc-console-ac-status"
        headings={[
          { id: 'number', content: '#', width: '55px' },
          { id: 'areachair', content: 'Area Chair', width: '10%' },
          { id: 'reviewProgress', content: 'Review Progress' },
          { id: 'status', content: 'Status' },
        ]}
      >
        {areaChairStatusTabData.tableRowsDisplayed?.map((row) => (
          <AreaChairStatusRow
            key={row.areaChairProfileId}
            rowData={row}
            metaReviewRecommendationName={metaReviewRecommendationName}
            referrerUrl={referrerUrl}
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
