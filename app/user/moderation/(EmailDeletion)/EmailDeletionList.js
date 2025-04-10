'use client'

import { use, useEffect, useState } from 'react'
import Table from '../../../../components/Table'
import PaginationLinks from '../../../../components/PaginationLinks'
import { formatDateTime } from '../../../../lib/utils'
import EmailDeletionForm from './EmailDeletionForm'

const pageSize = 25

export default function EmailDeletionList({
  emailDeletionNotesP,
  emailRemovalInvitationId,
  accessToken,
}) {
  const initialEmailDeletionNotes = use(emailDeletionNotesP)
  const [emailDeletionNotes, setEmailDeletionNotes] = useState(initialEmailDeletionNotes)
  const [emailDeletionNotesToShow, setEmailDeletionNotesToShow] = useState(
    emailDeletionNotes.slice(0, pageSize)
  )
  const [page, setPage] = useState(1)

  useEffect(() => {
    setEmailDeletionNotesToShow(
      emailDeletionNotes.slice((page - 1) * pageSize, page * pageSize)
    )
  }, [emailDeletionNotes, page])

  return (
    <>
      <EmailDeletionForm
        emailRemovalInvitationId={emailRemovalInvitationId}
        accessToken={accessToken}
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
  )
}
