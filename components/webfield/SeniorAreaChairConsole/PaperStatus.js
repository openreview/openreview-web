/* globals $: false */
import { useContext, useEffect, useState } from 'react'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import { ProgramChairConsolePaperAreaChairProgress } from '../NoteMetaReviewStatus'
import { AcPcConsoleNoteReviewStatus } from '../NoteReviewStatus'
import NoteSummary from '../NoteSummary'
import PaperStatusMenuBar from '../ProgramChairConsole/PaperStatusMenuBar'

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

const PaperRow = ({ rowData, selectedNoteIds, setSelectedNoteIds, decision, venue }) => {
  const { venueId, officialReviewName, shortPhrase, apiVersion, seniorAreaChairName } =
    useContext(WebFieldContext)
  const { note, metaReviewData } = rowData
  const referrerUrl = encodeURIComponent(
    `[Senior Area Chair Console](/group?id=${venueId}/${seniorAreaChairName}#paper-status)`
  )
  const noteWithAuthorRevealed = {
    ...note,
    content: {
      ...note.content,
      authors: note.details.original?.content?.authors ?? note.content.authors,
      authorids: note.details.original?.content?.authorids ?? note.content.authorids,
    },
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
          note={noteWithAuthorRevealed}
          referrerUrl={referrerUrl}
          showReaders={true}
          isV2Note={note.version === 2}
        />
      </td>
      <td>
        <AcPcConsoleNoteReviewStatus
          rowData={rowData}
          venueId={venueId}
          officialReviewName={officialReviewName}
          referrerUrl={referrerUrl}
          shortPhrase={shortPhrase}
          submissionName="Paper"
        />
      </td>
      <td>
        <ProgramChairConsolePaperAreaChairProgress
          metaReviewData={metaReviewData}
          referrerUrl={referrerUrl}
          isV2Console={apiVersion === 2}
        />
      </td>
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
          },
          { id: 'number', content: '#' },
          { id: 'summary', content: 'Paper Summary' },
          { id: 'reviewProgress', content: 'Review Progress', width: '30%' },
          { id: 'status', content: 'Status' },
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
            venue={row.note?.content?.venue?.value}
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
