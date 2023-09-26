/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import NoteSummary from '../NoteSummary'
import RejectedWithdrawnPapersMenuBar from './RejectedWithdrawnPapersMenuBar'

const RejectedWithdrawnPaperRow = ({ rowData, referrerUrl }) => {
  const { number, note, reason } = rowData
  return (
    <tr>
      <td>
        <strong>{number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={true} />
      </td>
      <td>
        <strong className="note-number">{reason}</strong>
      </td>
    </tr>
  )
}

const RejectedWithdrawnPapers = ({ pcConsoleData }) => {
  const [rejectedPaperTabData, setRejectedPaperTabData] = useState({})
  const { withdrawnVenueId, deskRejectedVenueId, shortPhrase, enableQuerySearch, venueId } =
    useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const { accessToken } = useUser()
  const pageSize = 25
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#deskrejectwithdrawn-status)`
  )

  const formatTableRows = (deskRejectedNotes, withdrawnNotes) =>
    deskRejectedNotes
      .map((p) => ({
        number: p.number,
        note: p,
        reason: 'Desk Rejected',
      }))
      .concat(
        withdrawnNotes.map((p) => ({
          number: p.number,
          note: p,
          reason: 'Withdrawn',
        }))
      )

  const loadAllNotes = (ids) =>
    Promise.all(
      ids.map((id) => {
        if (!id) return Promise.resolve([])
        return api.getAll('/notes', { 'content.venueid': id, domain: venueId }, { accessToken, version: 2 })
      })
    )

  const loadRejectedWithdrawnPapers = async () => {
    try {
      const results = await loadAllNotes([deskRejectedVenueId, withdrawnVenueId])
      const tableRows = formatTableRows(results[0], results[1])
      setRejectedPaperTabData({
        tableRowsAll: tableRows,
        tableRows,
      })
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (pcConsoleData.withdrawnNotes || pcConsoleData.deskRejectedNotes) {
      const tableRows = formatTableRows(
        pcConsoleData.deskRejectedNotes ?? [],
        pcConsoleData.withdrawnNotes ?? []
      )
      setRejectedPaperTabData({
        tableRowsAll: tableRows,
        tableRows,
      })
      return
    }
    loadRejectedWithdrawnPapers()
  }, [])

  useEffect(() => {
    setRejectedPaperTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    setTotalCount(rejectedPaperTabData.tableRows?.length ?? 0)
  }, [pageNumber, rejectedPaperTabData.tableRows])

  useEffect(() => {
    if (!rejectedPaperTabData.tableRows?.length) return
    setTotalCount(rejectedPaperTabData.tableRows.length)
    setPageNumber(1)
  }, [rejectedPaperTabData.tableRows])

  if (!rejectedPaperTabData.tableRowsAll) return <LoadingSpinner />
  if (rejectedPaperTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        No papers have been desk rejected or withdrawn.Check back later or contact
        info@openreview.net if you believe this to be an error.
      </p>
    )
  if (rejectedPaperTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <RejectedWithdrawnPapersMenuBar
          tableRowsAll={rejectedPaperTabData.tableRowsAll}
          tableRows={rejectedPaperTabData.tableRows}
          setRejectedPaperTabData={setRejectedPaperTabData}
          shortPhrase={shortPhrase}
          enableQuerySearch={enableQuerySearch}
        />
        <p className="empty-message">No paper matching search criteria.</p>
      </div>
    )
  return (
    <div className="table-container">
      <RejectedWithdrawnPapersMenuBar
        tableRowsAll={rejectedPaperTabData.tableRowsAll}
        tableRows={rejectedPaperTabData.tableRows}
        setRejectedPaperTabData={setRejectedPaperTabData}
        shortPhrase={shortPhrase}
        enableQuerySearch={enableQuerySearch}
      />
      <Table
        className="console-table table-striped pc-console-rejected-papers"
        headings={[
          { id: 'number', content: '#', width: '55px' },
          { id: 'paperSummary', content: 'Paper Summary', width: '60%' },
          { id: 'reason', content: 'Reason' },
        ]}
      >
        {rejectedPaperTabData.tableRowsDisplayed?.map((row) => (
          <RejectedWithdrawnPaperRow
            key={row.number}
            rowData={row}
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

export default RejectedWithdrawnPapers
