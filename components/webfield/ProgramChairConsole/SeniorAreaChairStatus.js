import { useContext, useEffect, useState } from 'react'
import { sortBy } from 'lodash'
import { getProfileLink } from '../../../lib/webfield-utils'
import { prettyField } from '../../../lib/utils'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import SeniorAreaChairStatusMenuBar from './SeniorAreaChairStatusMenuBar'
import WebFieldContext from '../../WebFieldContext'
import { getNoteContentValues } from '../../../lib/forum-utils'

const BasicProfileSummary = ({ profile, profileId }) => {
  const { id, preferredName, preferredEmail } = profile ?? {}
  return (
    <div className="note">
      {preferredName ? (
        <>
          <h4>
            <a href={getProfileLink(id ?? profileId)} target="_blank" rel="noreferrer">
              {preferredName}
            </a>
          </h4>
          <p className="text-muted">({preferredEmail})</p>
        </>
      ) : (
        <h4>{profileId}</h4>
      )}
    </div>
  )
}

const SeniorAreaChairStatusRow = ({ rowData }) => (
  <tr>
    <td>
      <strong className="note-number">{rowData.number}</strong>
    </td>
    <td>
      <BasicProfileSummary
        profile={rowData.sacProfile ?? {}}
        profileId={rowData.sacProfileId}
      />
    </td>
    <td>
      {rowData.acs.map((ac) => (
        <BasicProfileSummary key={ac.id} profile={ac.profile ?? {}} profileId={ac.id} />
      ))}
    </td>
  </tr>
)

const SeniorAreaChairStatusRowForDirectPaperAssignment = ({
  rowData,
  referrerUrl,
  metaReviewRecommendationName,
}) => {
  const { id, preferredName, preferredEmail } = rowData.sacProfile ?? {}
  const numCompletedReviews = rowData.numCompletedReviews // eslint-disable-line prefer-destructuring
  const numCompletedMetaReviews = rowData.numCompletedMetaReviews // eslint-disable-line prefer-destructuring
  const numPapers = rowData.notes.length

  return (
    <tr>
      <td>
        <strong>{rowData.number}</strong>
      </td>
      <td>
        <div>
          {preferredName ? (
            <>
              <h4>
                <a
                  href={getProfileLink(id ?? rowData.sacProfileId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {preferredName}
                </a>
              </h4>
              <p className="text-muted">({preferredEmail})</p>
            </>
          ) : (
            <h4>{rowData.sacProfileId}</h4>
          )}
        </div>
      </td>
      <td>
        <div className="reviewer-progress">
          <h4>
            {numCompletedReviews} of {numPapers} Papers Reviews Completed
          </h4>
          {rowData.notes.length !== 0 && <strong>Papers:</strong>}
          <div className="review-progress">
            {rowData.notes.map((p) => {
              if (!p) return null
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
      </td>
      <td>
        <div className="areachair-progress">
          <h4>
            {numCompletedMetaReviews} of {numPapers} Papers Meta Review Completed
          </h4>
          {rowData.notes.length !== 0 && <strong>Papers:</strong>}
          <div>
            {rowData.notes.map((p) => {
              if (!p) return null
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
      </td>
    </tr>
  )
}

const SeniorAreaChairStatus = ({ pcConsoleData, loadSacAcInfo, loadReviewMetaReviewData }) => {
  const [seniorAreaChairStatusTabData, setSeniorAreaChairStatusTabData] = useState({})
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.areaChairs?.length ?? 0)
  const pageSize = 25
  const {
    venueId,
    metaReviewRecommendationName = 'recommendation',
    sacDirectPaperAssignment,
    seniorAreaChairName,
    areaChairName
  } = useContext(WebFieldContext)

  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#seniorareachair-status)`
  )

  const loadSacStatusTabData = async () => {
    if (!pcConsoleData.sacAcInfo) {
      loadSacAcInfo()
    } else if (sacDirectPaperAssignment && !pcConsoleData.noteNumberReviewMetaReviewMap) {
      loadReviewMetaReviewData()
    } else {
      const tableRows = pcConsoleData.seniorAreaChairs.map((sacProfileId, index) => {
        let notes = []
        let acs = []

        if (sacDirectPaperAssignment) {
          notes =
            pcConsoleData.sacAcInfo.acBySacMap.get(sacProfileId)?.map((noteId) => {
              const note = pcConsoleData.notes.find((p) => p.id === noteId)
              if (!note) return null
              const noteNumber = note?.number

              const reviewMetaReviewInfo =
                pcConsoleData.noteNumberReviewMetaReviewMap.get(noteNumber) ?? {}
              return { note, noteNumber, ...reviewMetaReviewInfo }
            }) ?? []
        } else {
          acs =
            pcConsoleData.sacAcInfo.acBySacMap.get(sacProfileId)?.map((acProfileId) => {
              const acProfile = pcConsoleData.sacAcInfo.areaChairWithoutAssignmentIds.includes(
                acProfileId
              )
                ? pcConsoleData.sacAcInfo.acSacProfileWithoutAssignmentMap.get(acProfileId)
                : pcConsoleData.allProfilesMap.get(acProfileId)
              return {
                id: acProfileId,
                profile: acProfile,
              }
            }) ?? []
        }
        const sacProfile =
          pcConsoleData.sacAcInfo.seniorAreaChairWithoutAssignmentIds.includes(sacProfileId)
            ? pcConsoleData.sacAcInfo.acSacProfileWithoutAssignmentMap.get(sacProfileId)
            : pcConsoleData.allProfilesMap.get(sacProfileId)
        return {
          number: index + 1,
          sacProfileId,
          sacProfile,
          acs,
          numCompletedReviews: notes.filter(
            (p) => p?.reviewers?.length && p.reviewers?.length === p.officialReviews?.length
          ).length,
          numCompletedMetaReviews:
            notes.filter(
              (p) =>
                p?.metaReviewData?.areaChairs?.length ===
                p?.metaReviewData?.metaReviews?.length
            ).length ?? 0,
          notes: sortBy(notes, 'noteNumber'),
        }
      })
      setSeniorAreaChairStatusTabData({
        tableRowsAll: tableRows,
        tableRows: [...tableRows],
      })
    }
  }

  useEffect(() => {
    if (!pcConsoleData?.paperGroups?.seniorAreaChairGroups) return
    loadSacStatusTabData()
  }, [
    pcConsoleData?.paperGroups?.seniorAreaChairGroups,
    pcConsoleData.sacAcInfo,
    pcConsoleData.noteNumberReviewMetaReviewMap,
  ])

  useEffect(() => {
    setSeniorAreaChairStatusTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    setTotalCount(seniorAreaChairStatusTabData.tableRows?.length ?? 0)
  }, [
    pageNumber,
    pcConsoleData.paperGroups?.areaChairGroups,
    seniorAreaChairStatusTabData.tableRows,
  ])

  if (!seniorAreaChairStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (seniorAreaChairStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        There are no {prettyField(seniorAreaChairName)}.Check back later or contact info@openreview.net if you
        believe this to be an error.
      </p>
    )
  if (seniorAreaChairStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <SeniorAreaChairStatusMenuBar
          tableRowsAll={seniorAreaChairStatusTabData.tableRowsAll}
          tableRows={seniorAreaChairStatusTabData.tableRows}
          setSeniorAreaChairStatusTabData={setSeniorAreaChairStatusTabData}
          sacDirectPaperAssignment={sacDirectPaperAssignment}
        />
        <p className="empty-message">No {prettyField(seniorAreaChairName)} matching search criteria.</p>
      </div>
    )
  return (
    <div className="table-container">
      <SeniorAreaChairStatusMenuBar
        tableRowsAll={seniorAreaChairStatusTabData.tableRowsAll}
        tableRows={seniorAreaChairStatusTabData.tableRows}
        setSeniorAreaChairStatusTabData={setSeniorAreaChairStatusTabData}
        sacDirectPaperAssignment={sacDirectPaperAssignment}
      />
      <Table
        className="console-table table-striped pc-console-ac-status"
        headings={
          sacDirectPaperAssignment
            ? [
                { id: 'number', content: '#', width: '55px' },
                { id: 'seniorAreaChair', content: 'Senior Area Chair', width: '10%' },
                { id: 'reviewProgress', content: 'Review Progress' },
                { id: 'metaReviewstatus', content: 'Meta Review Status' },
              ]
            : [
                { id: 'number', content: '#', width: '55px' },
                { id: 'seniorAreaChair', content: `${prettyField(seniorAreaChairName)}` },
                { id: 'areachair', content: `${prettyField(areaChairName)}` },
              ]
        }
      >
        {seniorAreaChairStatusTabData.tableRowsDisplayed?.map((row) =>
          sacDirectPaperAssignment ? (
            <SeniorAreaChairStatusRowForDirectPaperAssignment
              key={row.sacProfileId}
              rowData={row}
              referrerUrl={referrerUrl}
              metaReviewRecommendationName={metaReviewRecommendationName}
            />
          ) : (
            <SeniorAreaChairStatusRow key={row.sacProfileId} rowData={row} />
          )
        )}
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

export default SeniorAreaChairStatus
