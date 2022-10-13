/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import {
  buildEdgeBrowserUrl,
  getNoteContent,
  getProfileLink,
} from '../../../lib/webfield-utils'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import AreaChairStatusMenuBar from './AreaChairStatusMenuBar'

const CommitteeSummary = ({ rowData, bidEnabled, recommendationEnabled, invitations }) => {
  const { id, preferredName, preferredEmail } = rowData.areaChairProfile ?? {}
  const { sacProfile, seniorAreaChairId } = rowData.seniorAreaChair ?? {}
  const {
    seniorAreaChairsId,
    areaChairsId,
    reviewersId,
    bidName,
    scoresName,
    recommendationName,
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

  return (
    <>
      <div className="note">
        {preferredName ? (
          <>
            <h4>
              <a
                href={getProfileLink(id, rowData.areaChairProfileId)}
                target="_blank"
                rel="noreferrer"
              >
                {preferredName}
              </a>
            </h4>
            <p className="text-muted">({preferredEmail})</p>
          </>
        ) : (
          <h4>{rowData.areaChairProfileId}</h4>
        )}
        <p>
          {bidEnabled && (
            <>
              Completed Bids:{completedBids}
              {completedBids && (
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
              Reviewers Recommended:{completedRecs}
              {completedBids && (
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
        <>
          <h4>Senior Area Chair: </h4>
          <div className="note">
            {sacProfile?.preferredName && (
              <>
                <h4>
                  <a
                    href={getProfileLink(sacProfile?.id, seniorAreaChairId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {sacProfile.preferredName}
                  </a>
                </h4>
                <p className="text-muted">({sacProfile.preferredEmail})</p>
              </>
            )}
          </div>
        </>
      )}
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
      {rowData.notes.length !== 0 && <strong>Papers:</strong>}
      <div className="review-progress">
        {rowData.notes.map((p) => {
          const { numReviewsDone, numReviewersAssigned, ratingAvg, ratingMin, ratingMax } =
            p.reviewProgressData
          const noteTitle =
            p.note.version === 2 ? p.note?.content?.title?.value : p.note?.content?.title
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
const NoteAreaChairStatus = ({ rowData, referrerUrl, isV2Console }) => {
  const numCompletedMetaReviews = rowData.numCompletedMetaReviews // eslint-disable-line prefer-destructuring
  const numPapers = rowData.notes.length
  return (
    <div className="areachair-progress">
      <h4>
        {numCompletedMetaReviews} of {numPapers} Papers Meta Review Completed
      </h4>
      {rowData.notes.length !== 0 && <strong>Papers:</strong>}
      <div>
        {rowData.notes.map((p) => {
          const noteContent = getNoteContent(p.note, isV2Console)
          const noteVenue = noteContent?.venue
          const metaReviews = p.metaReviewData?.metaReviews
          const hasMetaReview = metaReviews?.length
          return (
            <div key={p.noteNumber} className="meta-review-info">
              <strong className="note-number">{p.noteNumber}</strong>
              {hasMetaReview ? (
                <>
                  {metaReviews.map((metaReview) => {
                    const metaReviewContent = getNoteContent(metaReview, isV2Console)
                    return (
                      <div key={metaReview.id} className="meta-review">
                        <span>{`${
                          metaReviewContent.venue ? `${metaReviewContent.venue} - ` : ''
                        }${metaReviewContent.recommendation ?? ''}`}</span>
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
  bidEnabled,
  recommendationEnabled,
  acBids,
  invitations,
  referrerUrl,
  isV2Console,
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
        acBids={acBids}
        invitations={invitations}
      />
    </td>
    <td>
      <NoteAreaChairProgress rowData={rowData} referrerUrl={referrerUrl} />
    </td>
    <td>
      <NoteAreaChairStatus
        rowData={rowData}
        referrerUrl={referrerUrl}
        isV2Console={isV2Console}
      />
    </td>
  </tr>
)

const AreaChairStatus = ({ pcConsoleData, loadSacAcInfo, loadReviewMetaReviewData }) => {
  const [areaChairStatusTabData, setAreaChairStatusTabData] = useState({})
  const {
    shortPhrase,
    enableQuerySearch,
    filterOperators,
    propertiesAllowed,
    seniorAreaChairsId,
    areaChairsId,
    reviewersId,
    bidName,
    recommendationName,
    venueId,
    areaChairStatusExportColumns,
  } = useContext(WebFieldContext)
  const { accessToken } = useUser()
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.areaChairs?.length ?? 0)
  const pageSize = 25
  const bidEnabled = pcConsoleData.invitations?.some((p) =>
    [
      `${seniorAreaChairsId}/-/${bidName}`,
      `${areaChairsId}/-/${bidName}`,
      `${reviewersId}/-/${bidName}`,
    ].includes(p.id)
  )
  const recommendationEnabled = pcConsoleData.invitations?.some(
    (p) => p.id === `${reviewersId}/-/${recommendationName}`
  )
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#areachair-status)`
  )

  const loadACStatusTabData = async () => {
    if (!pcConsoleData.sacAcInfo) {
      loadSacAcInfo()
    } else if (!pcConsoleData.noteNumberReviewMetaReviewMap) {
      loadReviewMetaReviewData()
    } else {
      try {
        // #region get ac recommendation count
        const acRecommendations =
          recommendationName && areaChairsId
            ? await api.getAll(
                '/edges',
                {
                  invitation: `${reviewersId}/-/${recommendationName}`,
                  stream: true,
                },
                { accessToken }
              )
            : []
        const acRecommendationCount = acRecommendations.reduce((profileMap, edge) => {
          const acId = edge.signatures[0]
          if (!profileMap[acId]) {
            profileMap[acId] = 0 // eslint-disable-line no-param-reassign
          }
          profileMap[acId] += 1 // eslint-disable-line no-param-reassign
          return profileMap
        }, {})

        // #endregion
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
          const notes = acNotesMap.get(areaChairProfileId) ?? []
          return {
            areaChairProfileId,
            areaChairProfile: acProfile,
            number: index + 1,
            completedRecommendations: acRecommendationCount[areaChairProfileId] ?? 0,
            completedBids:
              pcConsoleData.bidCount?.areaChairs?.find(
                (p) => p.id?.tail === areaChairProfileId
              )?.count ?? 0,
            numCompletedReviews: notes.filter(
              (p) => p.reviewers?.length === p.officialReviews?.length
            ).length,
            numCompletedMetaReviews:
              notes.filter(
                (p) =>
                  p.metaReviewData?.numMetaReviewsDone ===
                  p.metaReviewData?.numAreaChairsAssigned
              ).length ?? 0,
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
        promptError(`loading area chair status: ${error.message}`)
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
          shortPhrase={shortPhrase}
          exportColumns={areaChairStatusExportColumns}
          enableQuerySearch={enableQuerySearch}
          filterOperators={filterOperators}
          propertiesAllowed={propertiesAllowed}
          bidEnabled={bidEnabled}
          recommendationEnabled={recommendationEnabled}
          messageParentGroup={areaChairsId}
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
        shortPhrase={shortPhrase}
        exportColumns={areaChairStatusExportColumns}
        enableQuerySearch={enableQuerySearch}
        filterOperators={filterOperators}
        propertiesAllowed={propertiesAllowed}
        bidEnabled={bidEnabled}
        recommendationEnabled={recommendationEnabled}
        messageParentGroup={areaChairsId}
      />
      <Table
        className="console-table table-striped pc-console-ac-status"
        headings={[
          { id: 'number', content: '#' },
          { id: 'areachair', content: 'Area Chair' },
          { id: 'reviewProgress', content: 'Review Progress' },
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
            referrerUrl={referrerUrl}
            isV2Console={pcConsoleData.isV2Console}
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
