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

const RejectedWithdrawnPaperRow = ({ rowData, referrerUrl, isV2Console }) => {
  const { number, note, reason } = rowData
  return (
    <tr>
      <td>
        <strong>{number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={isV2Console} />
      </td>
      <td>
        <strong className="note-number">{reason}</strong>
      </td>
    </tr>
  )
}

const RejectedWithdrawnPapers = () => {
  const [rejectedPaperTabData, setRejectedPaperTabData] = useState({})
  const {
    withdrawnSubmissionId,
    deskRejectedSubmissionId,
    shortPhrase,
    enableQuerySearch,
    venueId,
    apiVersion,
  } = useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const { accessToken } = useUser()
  const pageSize = 25
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#deskrejectwithdrawn-status)`
  )

  const loadRejectedWithdrawnPapers = async () => {
    const rejectedPapersP = deskRejectedSubmissionId
      ? api.getAll(
          '/notes',
          { invitation: deskRejectedSubmissionId, details: 'original' },
          { accessToken }
        )
      : Promise.resolve([])
    const withdrawnPapersP = withdrawnSubmissionId
      ? api.getAll(
          '/notes',
          { invitation: withdrawnSubmissionId, details: 'original' },
          { accessToken }
        )
      : Promise.resolve([])
    try {
      const results = await Promise.all([rejectedPapersP, withdrawnPapersP])
      const tableRows = results[0]
        .map((p) => ({
          number: p.number,
          note: p,
          originalNote: p.details?.original,
          reason: 'Desk Rejected',
        }))
        .concat(
          results[1].map((p) => ({
            number: p.number,
            note: p,
            originalNote: p.details?.original,
            reason: 'Withdrawn',
          }))
        )
      setRejectedPaperTabData({
        tableRowsAll: tableRows,
        tableRows,
      })
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
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
          { id: 'number', content: '#' },
          { id: 'paperSummary', content: 'Paper Summary', width: '60%' },
          { id: 'reason', content: 'Reason' },
        ]}
      >
        {rejectedPaperTabData.tableRowsDisplayed?.map((row) => (
          <RejectedWithdrawnPaperRow
            key={row.number}
            rowData={row}
            referrerUrl={referrerUrl}
            isV2Console={apiVersion === 2}
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
