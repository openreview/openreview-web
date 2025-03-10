/* globals $: false */
import { useContext, useEffect, useState } from 'react'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import { ProgramChairConsolePaperAreaChairProgress } from '../NoteMetaReviewStatus'
import { AcPcConsoleNoteReviewStatus, LatestReplies } from '../NoteReviewStatus'
import NoteSummary from '../NoteSummary'
import PaperStatusMenuBar from '../ProgramChairConsole/PaperStatusMenuBar'
import { pluralizeString, prettyField } from '../../../lib/utils'
import SelectAllCheckBox from '../SelectAllCheckbox'

const PaperRow = ({
  assignmentInvitations,
  rowData,
  selectedNoteIds,
  setSelectedNoteIds,
  decision,
  venue,
}) => {
  const {
    venueId,
    officialReviewName,
    reviewerName,
    reviewersId,
    areaChairName,
    areaChairsId,
    shortPhrase,
    seniorAreaChairName,
    submissionName,
    assignmentUrls,
    metaReviewRecommendationName = 'recommendation',
    additionalMetaReviewFields = [],
    preferredEmailInvitationId,
    displayReplyInvitations,
  } = useContext(WebFieldContext)
  const { note, ithenticateEdge } = rowData
  const referrerUrl = encodeURIComponent(
    `[${prettyField(
      seniorAreaChairName
    )} Console](/group?id=${venueId}/${seniorAreaChairName}#${submissionName.toLowerCase()}-status)`
  )
  const getManualAssignmentUrl = (role, roleId) => {
    if (!assignmentUrls) return null
    const assignmentUrl = assignmentUrls[role]?.manualAssignmentUrl // same for auto and manual
    // auto - deployed and not expired
    const isAssignmentConfigDeployed = assignmentInvitations?.some(
      (p) => p.id.startsWith(roleId) && (!p.expdate || p.exdate > Date.now())
    )
    // manual - there's no undeploy
    const isMatchingSetup = assignmentInvitations?.some((p) => p.id.startsWith(roleId))

    if (
      (assignmentUrls[role]?.automaticAssignment === false && isMatchingSetup) ||
      (assignmentUrls[role]?.automaticAssignment === true && isAssignmentConfigDeployed)
    )
      return assignmentUrl
    return null
  }

  return (
    <tr>
      <td>
        <input
          type="checkbox"
          checked={selectedNoteIds.includes(note.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedNoteIds((noteIds) => [...noteIds, note.id])
              return
            }
            setSelectedNoteIds((noteIds) => noteIds.filter((p) => p !== note.id))
          }}
        />
      </td>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary
          note={note}
          referrerUrl={referrerUrl}
          showReaders={true}
          isV2Note={true}
          ithenticateEdge={ithenticateEdge}
        />
      </td>
      <td>
        <AcPcConsoleNoteReviewStatus
          rowData={rowData}
          venueId={venueId}
          officialReviewName={officialReviewName}
          referrerUrl={referrerUrl}
          shortPhrase={shortPhrase}
          submissionName={submissionName}
          reviewerAssignmentUrl={getManualAssignmentUrl(reviewerName, reviewersId)}
        />
      </td>
      <td>
        <ProgramChairConsolePaperAreaChairProgress
          rowData={rowData}
          referrerUrl={referrerUrl}
          areaChairAssignmentUrl={getManualAssignmentUrl(areaChairName, areaChairsId)}
          metaReviewRecommendationName={metaReviewRecommendationName}
          additionalMetaReviewFields={additionalMetaReviewFields}
          preferredEmailInvitationId={preferredEmailInvitationId}
        />
      </td>
      {displayReplyInvitations?.length && (
        <td>
          <LatestReplies rowData={rowData} referrerUrl={referrerUrl} />
        </td>
      )}
      <td className="console-decision">
        <h4 className="title">{decision}</h4>
        {venue && <span>{venue}</span>}
      </td>
    </tr>
  )
}

const PaperStatus = ({ sacConsoleData }) => {
  const [paperStatusTabData, setPaperStatusTabData] = useState({})
  const [selectedNoteIds, setSelectedNoteIds] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(sacConsoleData.notes?.length ?? 0)
  const {
    reviewRatingName,
    submissionName,
    officialReviewName,
    areaChairName = 'Area_Chairs',
    officialMetaReviewName = 'Meta_Review',
    displayReplyInvitations,
  } = useContext(WebFieldContext)
  const pageSize = 25

  useEffect(() => {
    if (!sacConsoleData.notes) return
    setPaperStatusTabData({
      tableRowsAll: sacConsoleData.notes,
      tableRows: [...sacConsoleData.notes], // could be filtered
    })

    setTotalCount(sacConsoleData.notes?.length ?? 0)
  }, [sacConsoleData])

  useEffect(() => {
    setPaperStatusTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        // could be filtered and paginated
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    $('[data-toggle="tooltip"]').tooltip('enable')
  }, [pageNumber, paperStatusTabData.tableRows])

  useEffect(() => {
    if (!paperStatusTabData.tableRows?.length) return
    setTotalCount(paperStatusTabData.tableRows.length)
    setPageNumber(1)
  }, [paperStatusTabData.tableRows])

  if (!paperStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (paperStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        No {submissionName.toLowerCase()} have been submitted.Check back later or contact
        info@openreview.net if you believe this to be an error.
      </p>
    )
  if (paperStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <PaperStatusMenuBar
          tableRowsAll={paperStatusTabData.tableRowsAll}
          tableRows={paperStatusTabData.tableRows}
          selectedNoteIds={selectedNoteIds}
          setSelectedNoteIds={setSelectedNoteIds}
          setPaperStatusTabData={setPaperStatusTabData}
          reviewRatingName={reviewRatingName}
          defaultSeniorAreaChairName="Senior_Area_Chairs"
        />
        <p className="empty-message">
          No {pluralizeString(submissionName.toLowerCase())} matching search criteria.
        </p>
      </div>
    )
  return (
    <div className="table-container">
      <PaperStatusMenuBar
        tableRowsAll={paperStatusTabData.tableRowsAll}
        tableRows={paperStatusTabData.tableRows}
        selectedNoteIds={selectedNoteIds}
        setSelectedNoteIds={setSelectedNoteIds}
        setPaperStatusTabData={setPaperStatusTabData}
        reviewRatingName={reviewRatingName}
        defaultSeniorAreaChairName="Senior_Area_Chairs"
      />

      <Table
        className="console-table table-striped pc-console-paper-status"
        headings={[
          {
            id: 'select-all',
            content: (
              <SelectAllCheckBox
                selectedIds={selectedNoteIds}
                setSelectedIds={setSelectedNoteIds}
                allIds={paperStatusTabData.tableRows?.map((row) => row.note.id)}
              />
            ),
            width: '35px',
          },
          { id: 'number', content: '#', width: '55px' },
          { id: 'summary', content: `${submissionName} Summary` },
          {
            id: 'reviewProgress',
            content: `${prettyField(officialReviewName)} Progress`,
            width: displayReplyInvitations?.length ? '20%' : '30%',
          },
          { id: 'status', content: 'Status' },
          ...(displayReplyInvitations?.length
            ? [
                {
                  id: 'latestReplies',
                  content: 'Latest Replies',
                  width: '35%',
                },
              ]
            : []),
          { id: 'decision', content: 'Decision' },
        ]}
      >
        {paperStatusTabData.tableRowsDisplayed?.map((row) => (
          <PaperRow
            key={row.note.id}
            assignmentInvitations={sacConsoleData.assignmentInvitations}
            rowData={row}
            selectedNoteIds={selectedNoteIds}
            setSelectedNoteIds={setSelectedNoteIds}
            decision={row.decision}
            venue={row.venue}
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

export default PaperStatus
