/* globals promptError: false */

import { useEffect, useState } from 'react'
import api from '../../../../lib/api-client'
import Table from '../../../../components/Table'
import PaginationLinks from '../../../../components/PaginationLinks'
import { formatDateTime } from '../../../../lib/utils'
import EmailDeletionForm from './EmailDeletionForm'
import LoadingSpinner from '../../../../components/LoadingSpinner'

const emailRemovalInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Email_Removal`
const pageSize = 25

export default function EmailDeletionTab() {
  const [emailDeletionNotes, setEmailDeletionNotes] = useState(null)
  const [emailDeletionNotesToShow, setEmailDeletionNotesToShow] = useState(null)
  const [page, setPage] = useState(1)

  const loadEmailDeletionNotes = async () => {
    try {
      const notesResultP = api.getAll('/notes', {
        invitation: emailRemovalInvitationId,
        sort: 'tcdate',
      })
      const editResultsP = api.getAll(
        '/notes/edits',
        { invitation: emailRemovalInvitationId },
        { resultsKey: 'edits' }
      )
      const processLogsP = api.getAll(
        '/logs/process',
        { invitation: emailRemovalInvitationId },
        { resultsKey: 'logs' }
      )
      const [notes, edits, processLogs] = await Promise.all([
        notesResultP,
        editResultsP,
        processLogsP,
      ])

      const notesWithStatus = notes.map((p) => {
        const edit = edits.find((q) => q.note.id === p.id)
        const processLog = processLogs.find((q) => q.id === edit?.id)
        return {
          ...p,
          processLogStatus: processLog?.status ?? 'running',
          processLogUrl: processLog
            ? `${process.env.API_V2_URL}/logs/process?id=${processLog.id}`
            : null,
        }
      })

      setEmailDeletionNotes(notesWithStatus)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!emailDeletionNotes) return
    setEmailDeletionNotesToShow(
      emailDeletionNotes.slice((page - 1) * pageSize, page * pageSize)
    )
  }, [emailDeletionNotes, page])

  useEffect(() => {
    loadEmailDeletionNotes()
  }, [])

  if (!emailDeletionNotesToShow) return <LoadingSpinner />

  return (
    <>
      <div className="email-deletion-container">
        <>
          <EmailDeletionForm
            emailRemovalInvitationId={emailRemovalInvitationId}
            setEmailDeletionNotes={setEmailDeletionNotes}
          />
          <div className="email-deletion-list">
            <Table
              headings={[
                { content: 'Status', width: '5%' },
                { content: 'Email', width: '25%' },
                { content: 'Profile Id', width: '25%' },
                { content: 'Comment', width: '25%' },
                { content: 'Date' },
              ]}
            />

            {emailDeletionNotesToShow.map((note) => (
              <div className="email-deletion-row" key={note.id}>
                <span className="col-status">
                  <a href={note.processLogUrl} target="_blank" rel="noreferrer">
                    <span
                      className={`label label-${
                        note.processLogStatus === 'ok' ? 'success' : 'default'
                      }`}
                    >
                      {note.processLogStatus}
                    </span>
                  </a>
                </span>
                <span className="col-email">
                  <span>{note.content.email.value}</span>
                </span>
                <span className="col-profile">
                  <a
                    href={`/profile?id=${note.content.profile_id.value}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {note.content.profile_id.value}
                  </a>
                </span>
                <span className="col-comment">{note.content.comment.value}</span>
                <span className="col-created">{formatDateTime(note.tcdate)}</span>
              </div>
            ))}
            {emailDeletionNotes.length === 0 ? (
              <p className="empty-message">No email deletion requests.</p>
            ) : (
              <PaginationLinks
                currentPage={page}
                itemsPerPage={pageSize}
                totalCount={emailDeletionNotes.length}
                options={{ useShallowRouting: true }}
                setCurrentPage={setPage}
              />
            )}
          </div>
        </>
      </div>
    </>
  )
}
