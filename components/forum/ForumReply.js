/* globals promptMessage: false */

import { useContext, useState } from 'react'
import Link from 'next/link'
import copy from 'copy-to-clipboard'
import { NoteContentV2 } from '../NoteContent'
import NoteEditorForm from '../NoteEditorForm'
import ForumReplyContext from './ForumReplyContext'
import {
  prettyId, prettyInvitationId, buildNoteTitle, forumDate,
} from '../../lib/utils'
import { getInvitationColors } from '../../lib/forum-utils'
import Icon from '../Icon'

export default function ForumReply({ note, replies, updateNote }) {
  const [activeInvitation, setActiveInvitation] = useState(null)
  const [activeEditInvitation, setActiveEditInvitation] = useState(null)
  const { forumId, displayOptionsMap, setCollapsed } = useContext(ForumReplyContext)

  const {
    id, invitations, content, signatures, details, ddate,
  } = note
  const pastDue = ddate && ddate < Date.now()
  const canEdit = (details.original && details.originalWritable) || (!details.originalWritable && details.writable)
  const { hidden, collapsed, contentExpanded } = displayOptionsMap[note.id]
  const allRepliesHidden = replies.every(childNote => displayOptionsMap[childNote.id].hidden)
  const showInvitationButtons = note.commonInvitations?.length > 0 || note.referenceInvitations?.length > 0

  if (collapsed) {
    // Collapsed reply
    return (
      <ReplyContainer
        id={note.id}
        hidden={hidden && allRepliesHidden}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      >
        <div className="heading">
          <h4 className="minimal-title">
            {content.title ? (
              <>
                <strong>{content.title}</strong>
                {' '}
                &bull;
                {' '}
                <span className="signatures">
                  by
                  {' '}
                  {signatures.map(signature => prettyId(signature, true)).join(', ')}
                </span>
              </>
            ) : (
              <span>{buildNoteTitle(invitations[0], signatures)}</span>
            )}
          </h4>

          <CopyLinkButton noteId={id} />
        </div>

        {!allRepliesHidden && (
          <NoteReplies replies={replies} updateNote={updateNote} />
        )}
      </ReplyContainer>
    )
  }

  if (activeEditInvitation) {
    return (
      <ReplyContainer
        id={note.id}
        hidden={hidden && allRepliesHidden}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      >
        <NoteEditorForm
          note={note.details.originalWritable ? note.details.original : note}
          invitation={activeEditInvitation}
          onNoteEdited={(newNote) => {
            setActiveEditInvitation(null)
            updateNote({
              ...note,
              content: {
                ...note.content,
                ...newNote.content,
              },
            })
          }}
          onNoteCancelled={() => {
            setActiveEditInvitation(null)
          }}
        />

        {!allRepliesHidden && (
          <>
            <hr />
            <NoteReplies replies={replies} updateNote={updateNote} />
          </>
        )}
      </ReplyContainer>
    )
  }

  // Expanded Reply
  return (
    <ReplyContainer
      id={note.id}
      hidden={hidden && allRepliesHidden}
      collapsed={collapsed}
      setCollapsed={setCollapsed}
    >
      <div className="heading">
        <h4>
          {content.title ? (
            <strong>{content.title}</strong>
          ) : (
            <span>{buildNoteTitle(invitations[0], signatures)}</span>
          )}
        </h4>

        <CopyLinkButton noteId={id} />

        {note.referenceInvitations?.map(inv => (
          <button
            key={inv.id}
            type="button"
            className={`btn btn-xs ${activeEditInvitation?.id === inv.id ? 'active' : ''}`}
            onClick={() => setActiveEditInvitation(inv)}
          >
            {prettyInvitationId(inv.id)}
          </button>
        ))}

        {canEdit && !pastDue && (
          <>
            <button
              type="button"
              className="btn btn-xs"
              onClick={() => {
                const editInvitation = note.details.originalWritable
                  ? note.details.originalInvitation
                  : note.details.invitation
                setActiveEditInvitation(editInvitation)
              }}
            >
              <Icon name="edit" />
            </button>
            <button
              type="button"
              className="btn btn-xs"
              onClick={() => {}}
            >
              <Icon name="trash" />
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

      <div className="subheading">
        {invitations.map((invitation) => (
          <span
            key={invitation.id}
            className="invitation highlight"
            data-toggle="tooltip"
            data-placement="top"
            title="Reply type"
            style={getInvitationColors(prettyInvitationId(invitation))}
          >
            {prettyInvitationId(invitation, true)}
          </span>
        ))}
        <span className="signatures" data-toggle="tooltip" data-placement="top" title="Reply Author">
          <Icon name="pencil" />
          {signatures.map(signature => prettyId(signature, true)).join(', ')}
        </span>
        <span className="created-date" data-toggle="tooltip" data-placement="top" title="Date created">
          <Icon name="calendar" />
          {forumDate(note.cdate, null, note.mdate, null)}
        </span>
        <span className="readers" data-toggle="tooltip" data-placement="top" title="Visible to">
          <Icon name="eye-open" />
          {note.readers.map(reader => prettyId(reader, true)).join(', ')}
        </span>
        {note.details.revisions && (
          <span>
            <Link href={`/revisions?id=${note.id}`}>
              <a>Show Revisions</a>
            </Link>
          </span>
        )}
      </div>

      <NoteContentCollapsible
        id={note.id}
        content={note.content}
        presentation={note.details?.presentation}
        collapsed={!contentExpanded}
      />

      {showInvitationButtons && (
        <div className="invitations-container mt-2">
          <div className="invitation-buttons">
            <span className="hint">Add:</span>
            {[...note.replyInvitations, ...note.commonInvitations].map(inv => (
              <button
                key={inv.id}
                type="button"
                className={`btn btn-xs ${activeInvitation?.id === inv.id ? 'active' : ''}`}
                onClick={() => setActiveInvitation(inv)}
              >
                {prettyInvitationId(inv.id)}
              </button>
            ))}
          </div>

          <NoteEditorForm
            forumId={forumId}
            invitation={activeInvitation}
            replyToId={note.id}
            onNoteCreated={(newNote) => {
              setActiveEditInvitation(null)
              updateNote(newNote, note.id, note.commonInvitations)
            }}
            onNoteCancelled={() => { setActiveInvitation(null) }}
            onError={() => { setActiveInvitation(null) }}
          />
        </div>
      )}

      {!allRepliesHidden && (
        <NoteReplies replies={replies} updateNote={updateNote} />
      )}
    </ReplyContainer>
  )
}

function ReplyContainer({
  id, hidden, collapsed, setCollapsed, children,
}) {
  return (
    <div className="note" style={hidden ? { display: 'none' } : {}} data-id={id}>
      <button type="button" className="btn btn-link collapse-link" onClick={e => setCollapsed(id, !collapsed)}>
        [
        {collapsed ? '+' : '–'}
        ]
      </button>

      {children}
    </div>
  )
}

function CopyLinkButton({ noteId }) {
  const { forumId } = useContext(ForumReplyContext)

  const copyNoteUrl = (e) => {
    if (!window.location) return

    copy(`${window.location.origin}${window.location.pathname}?id=${forumId}&noteId=${noteId}`)
    promptMessage('Reply URL copied to clipboard', { scrollToTop: false })
  }

  return (
    <button type="button" className="btn btn-xs permalink-btn" onClick={copyNoteUrl}>
      <Icon name="link" tooltip="Copy reply URL" />
    </button>
  )
}

function NoteContentCollapsible({
  id, content, presentation, collapsed,
}) {
  return (
    <div
      role="button"
      tabIndex="0"
      className={`note-content-container ${collapsed ? 'collapsed' : ''}`}
      onClick={e => e.currentTarget.classList.toggle('collapsed')}
    >
      <NoteContentV2
        id={id}
        content={content}
        presentation={presentation}
        include={['pdf', 'html']}
      />
      <div className="gradient-overlay">
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a href="#" onClick={e => e.preventDefault()}>Show more</a>
      </div>
    </div>
  )
}

function NoteReplies({ replies, updateNote }) {
  if (!replies?.length) return null

  return (
    <div className="note-replies">
      {replies.map(childNote => (
        <ForumReply
          key={childNote.id}
          note={childNote}
          replies={[]}
          updateNote={updateNote}
        />
      ))}
    </div>
  )
}
