/* globals promptError: false */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import NoteEditorForm from '../NoteEditorForm'
import NoteAuthors from '../NoteAuthors'
import NoteContent from '../NoteContent'
import Icon from '../Icon'
import { prettyId, prettyInvitationId, forumDate } from '../../lib/utils'

import '../../styles/components/forum-note.less'

function ForumNote({
  note, referenceInvitations, originalInvitations, tagInvitations,
}) {
  const {
    id, content, details, signatures,
  } = note

  const pastDue = note.ddate && note.ddate < Date.now()
  const canEdit = (details.original && details.originalWritable) || (!details.originalWritable && details.writable)
  const showInvitationButtons = referenceInvitations?.length > 0 || originalInvitations?.length > 0 || canEdit
  // eslint-disable-next-line no-underscore-dangle
  const texDisabled = !!content._disableTexRendering

  const [activeInvitation, setActiveInvitation] = useState(null)
  const [activeNote, setActiveNote] = useState(null)

  const openNoteEditor = (invitation, options) => {
    if (activeInvitation && activeInvitation.id !== invitation.id) {
      promptError(
        'There is currently another editor pane open on the page. Please submit your changes or click Cancel before continuing',
        { scrollToTop: false },
      )
      return
    }
    if (activeInvitation) {
      setActiveInvitation(null)
      setActiveNote(null)
      return
    }

    let noteToEdit
    if (options?.original) {
      noteToEdit = note.details?.original
    } else if (options?.revision) {
      noteToEdit = invitation.details?.repliedNotes?.[0]
      if (noteToEdit) {
        // Include both the referent and the note id so the API doesn't create a new reference
        noteToEdit = { ...noteToEdit, updateId: noteToEdit.id }
        noteToEdit.updateId = noteToEdit.id
      }
    }
    setActiveNote(noteToEdit ?? note)
    setActiveInvitation(activeInvitation ? null : invitation)
  }

  if (activeInvitation) {
    return (
      <div className="forum-note">
        <NoteEditorForm
          note={activeNote}
          invitation={activeInvitation}
          onNoteCreated={() => {}}
          onNoteCancelled={() => { setActiveInvitation(null) }}
          onError={() => { setActiveInvitation(null) }}
        />

        <hr />
      </div>
    )
  }

  return (
    <div className={`forum-note ${pastDue ? 'trashed' : ''} ${texDisabled ? 'disable-tex-rendering' : ''}`}>
      <ForumTitle
        id={id}
        title={content.title}
        pdf={content.pdf}
        html={content.html || content.ee}
      />

      <div className="forum-authors mb-2">
        <h3>
          <NoteAuthors authors={content.authors} authorIds={content.authorIds} signatures={signatures} />
        </h3>
      </div>

      <ForumMeta note={note} />

      <NoteContent
        id={id}
        content={content}
        invitation={details.originalInvitation || details.invitation}
      />

      {showInvitationButtons && (
        <div className="revision-invitations-container mb-4">
          <div className="invitation-buttons">
            {originalInvitations?.map((invitation) => {
              let buttonText = prettyInvitationId(invitation.id)
              let options = { original: true }
              if (buttonText === 'Revision' && invitation.multiReply === false && invitation.details.repliedNotes?.length) {
                buttonText = 'Edit Revision'
                options = { revision: true }
              }
              return (
                <button
                  key={invitation.id}
                  type="button"
                  className="btn btn-xs"
                  onClick={() => openNoteEditor(invitation, options)}
                >
                  {buttonText}
                </button>
              )
            })}

            {referenceInvitations?.map(invitation => (
              <button
                key={invitation.id}
                type="button"
                className="btn btn-xs"
                onClick={() => openNoteEditor(invitation)}
              >
                {prettyInvitationId(invitation.id)}
              </button>
            ))}

            {canEdit && !pastDue && (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  onClick={() => {
                    const invitation = note.details.originalWritable
                      ? note.details.originalInvitation
                      : note.details.invitation
                    const options = note.details.originalWritable ? { original: true } : {}
                    openNoteEditor(invitation, options)
                  }}
                >
                  <Icon name="edit" />
                  {' '}
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-xs"
                  onClick={() => {}}
                >
                  <Icon name="trash" />
                  {' '}
                  Delete
                </button>
              </>
            )}
            {canEdit && pastDue && (
              <button
                type="button"
                className="btn btn-xs"
                onClick={() => {}}
              >
                Restore
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ForumTitle({
  id, title, pdf, html,
}) {
  return (
    <div className="forum-title mt-2 mb-2">
      <h2 className="citation_title">
        {title}
      </h2>

      {pdf && (
        <div className="forum-content-link">
          {/* eslint-disable-next-line react/jsx-no-target-blank */}
          <a className="citation_pdf_url" href={`/pdf?id=${id}`} title="Download PDF" target="_blank">
            <img src="/images/pdf_icon_blue.svg" alt="Download PDF" />
          </a>
        </div>
      )}
      {html && (
        <div className="forum-content-link">
          <a href={html} title="Open Website" target="_blank" rel="noopener noreferrer">
            <img src="/images/html_icon_blue.svg" alt="Open Webpage" />
          </a>
        </div>
      )}
    </div>
  )
}

function ForumMeta({ note }) {
  return (
    <div className="forum-meta mb-2">
      <span className="date item">
        <Icon name="calendar" />
        {forumDate(note.cdate, note.tcdate, note.mdate, note.tmdate, note.content.year)}
      </span>

      <span className="item">
        <Icon name="folder-open" />
        {note.content.venue || prettyId(note.invitation)}
      </span>

      {note.readers && (
        <span className="readers item" data-toggle="tooltip" data-placement="top" title={`Visible to ${note.readers.join(', ')}`}>
          <Icon name="eye-open" />
          {note.readers.map(reader => prettyId(reader, true)).join(', ')}
        </span>
      )}

      {/* eslint-disable-next-line no-underscore-dangle */}
      {note.content._bibtex && (
        <span className="item">
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a
            href="#"
            data-target="#bibtex-modal"
            data-toggle="modal"
            // eslint-disable-next-line no-underscore-dangle
            data-bibtex={encodeURIComponent(note.content._bibtex)}
          >
            Show Bibtex
          </a>
        </span>
      )}

      {note.details.revisions && (
        <span className="item">
          <Link href={`/revisions?id=${note.id}`}>
            <a>Show Revisions</a>
          </Link>
        </span>
      )}
    </div>
  )
}

export default ForumNote
