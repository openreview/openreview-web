/* globals $: false */
import { useContext, useEffect, useState } from 'react'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import { ProgramChairConsolePaperAreaChairProgress } from '../NoteMetaReviewStatus'
import { AcPcConsoleNoteReviewStatus } from '../NoteReviewStatus'
import NoteSummary from '../NoteSummary'
import PaperStatusMenuBar from './PaperStatusMenuBar'

const SelectAllCheckBox = ({ selectedNoteIds, setSelectedNoteIds, allNoteIds }) => {
  const allNotesSelected = selectedNoteIds.length === allNoteIds?.length

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedNoteIds(allNoteIds)
      return
    }
    setSelectedNoteIds([])
  }
  return (
    <input
      type="checkbox"
      id="select-all-papers"
      checked={allNotesSelected}
      onChange={handleSelectAll}
    />
  )
}

const PaperRow = ({
  rowData,
  selectedNoteIds,
  setSelectedNoteIds,
  decision,
  venue,
  getManualAssignmentUrl,
}) => {
  const {
    areaChairsId,
    venueId,
    officialReviewName,
    shortPhrase,
    submissionName,
    metaReviewRecommendationName = 'recommendation',
  } = useContext(WebFieldContext)
  const { note, metaReviewData } = rowData
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#paper-status)`
  )

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
          reviewerAssignmentUrl={getManualAssignmentUrl('Reviewers')}
        />
      </td>
      {areaChairsId && (
        <td>
          <ProgramChairConsolePaperAreaChairProgress
            rowData={rowData}
            referrerUrl={referrerUrl}
            areaChairAssignmentUrl={getManualAssignmentUrl('Area_Chairs')}
            metaReviewRecommendationName={metaReviewRecommendationName}
          />
        </td>
      )}
      <td className="console-decision">
        <h4 className="title">{decision}</h4>
        {venue && <span>{venue}</span>}
      </td>
    </tr>
  )
}

const PaperStatus = ({ pcConsoleData, loadReviewMetaReviewData }) => {
  const [paperStatusTabData, setPaperStatusTabData] = useState({})
  const [selectedNoteIds, setSelectedNoteIds] = useState([])
  const { venueId, areaChairsId, assignmentUrls, reviewRatingName } =
    useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.notes?.length ?? 0)
  const pageSize = 25

  const getManualAssignmentUrl = (role) => {
    if (!assignmentUrls) return null
    const assignmentUrl = assignmentUrls[role]?.manualAssignmentUrl // same for auto and manual
    // auto
    const isAssignmentConfigDeployed = pcConsoleData.invitations?.some(
      (p) => p.id === `${venueId}/${role}/-/Assignment`
    )
    // manual
    const isMatchingSetup = isAssignmentConfigDeployed

    if (
      (assignmentUrls[role]?.automaticAssignment === false && isMatchingSetup) ||
      (assignmentUrls[role]?.automaticAssignment === true && isAssignmentConfigDeployed)
    )
      return assignmentUrl
    return null
  }

  useEffect(() => {
    if (!pcConsoleData.notes) return
    if (!pcConsoleData.noteNumberReviewMetaReviewMap) {
      setTimeout(() => {
        loadReviewMetaReviewData()
      }, 500)
    } else {
      const { notes, noteNumberReviewMetaReviewMap } = pcConsoleData
      if (!notes) return
      const tableRows = [...(noteNumberReviewMetaReviewMap.values() ?? [])]
      setPaperStatusTabData({
        tableRowsAll: tableRows,
        tableRows: [...tableRows], // could be filtered
      })

      setTotalCount(pcConsoleData.notes?.length ?? 0)
    }
  }, [pcConsoleData.notes, pcConsoleData.noteNumberReviewMetaReviewMap])

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
  }, [pageNumber, pcConsoleData.notes, paperStatusTabData.tableRows])

  useEffect(() => {
    if (!paperStatusTabData.tableRows?.length) return
    setTotalCount(paperStatusTabData.tableRows.length)
    setPageNumber(1)
  }, [paperStatusTabData.tableRows])

  if (!paperStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (paperStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        No papers have been submitted.Check back later or contact info@openreview.net if you
        believe this to be an error.
      </p>
    )
  if (paperStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <PaperStatusMenuBar
          tableRowsAll={paperStatusTabData.tableRowsAll}
          tableRows={paperStatusTabData.tableRows}
          selectedNoteIds={selectedNoteIds}
          setPaperStatusTabData={setPaperStatusTabData}
          reviewRatingName={reviewRatingName}
        />
        <p className="empty-message">No papers matching search criteria.</p>
      </div>
    )
  return (
    <div className="table-container">
      <PaperStatusMenuBar
        tableRowsAll={paperStatusTabData.tableRowsAll}
        tableRows={paperStatusTabData.tableRows}
        selectedNoteIds={selectedNoteIds}
        setPaperStatusTabData={setPaperStatusTabData}
        reviewRatingName={reviewRatingName}
      />
      <Table
        className="console-table table-striped pc-console-paper-status"
        headings={[
          {
            id: 'select-all',
            content: (
              <SelectAllCheckBox
                selectedNoteIds={selectedNoteIds}
                setSelectedNoteIds={setSelectedNoteIds}
                allNoteIds={paperStatusTabData.tableRows?.map((row) => row.note.id)}
              />
            ),
            width: '35px',
          },
          { id: 'number', content: '#', width: '55px' },
          { id: 'summary', content: 'Paper Summary', width: '30%' },
          { id: 'reviewProgress', content: 'Review Progress', width: '30%' },
          ...(areaChairsId ? [{ id: 'status', content: 'Status' }] : []),
          { id: 'decision', content: 'Decision' },
        ]}
      >
        {paperStatusTabData.tableRowsDisplayed?.map((row) => (
          <PaperRow
            key={row.note.id}
            rowData={row}
            selectedNoteIds={selectedNoteIds}
            setSelectedNoteIds={setSelectedNoteIds}
            decision={row.decision}
            venue={row.venue}
            getManualAssignmentUrl={getManualAssignmentUrl}
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
