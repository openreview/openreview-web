/* globals promptMessage: false */
/* globals view2: false */

import { useContext, useState } from 'react'
import Link from 'next/link'
import copy from 'copy-to-clipboard'
import { NoteContentV2 } from '../NoteContent'
import NoteEditorForm from '../NoteEditorForm'
import ForumReplyContext from './ForumReplyContext'
import useUser from '../../hooks/useUser'
import {
  prettyId, prettyInvitationId, buildNoteTitle, forumDate,
} from '../../lib/utils'
import { getInvitationColors } from '../../lib/forum-utils'
import Icon from '../Icon'

export default function ForumReply({ note, replies, updateNote }) {
  const [activeInvitation, setActiveInvitation] = useState(null)
  const [activeEditInvitation, setActiveEditInvitation] = useState(null)
  const { forumId, displayOptionsMap, setCollapsed } = useContext(ForumReplyContext)
  const { user } = useUser()

  const {
    invitations, content, signatures, ddate,
  } = note
  const { hidden, collapsed, contentExpanded } = displayOptionsMap[note.id]
  const allRepliesHidden = replies.every(childNote => displayOptionsMap[childNote.id].hidden)
  const generatedTitle = buildNoteTitle(invitations[0], signatures)

  const scrollToNote = (noteId) => {
    const el = document.querySelector(`.note[data-id="${noteId}"]`)
    if (!el) return

    const navBarHeight = 63
    const y = el.getBoundingClientRect().top + window.pageYOffset - navBarHeight

    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  if (collapsed) {
    // Collapsed reply
    return (
      <ReplyContainer
        id={note.id}
        hidden={hidden && allRepliesHidden}
        collapsed={collapsed}
        deleted={!!ddate}
        setCollapsed={setCollapsed}
      >
        <div className="heading">
          <h4 className="minimal-title">
            {content.title?.value ? (
              <>
                <strong>{content.title.value}</strong>
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
              <span>{generatedTitle}</span>
            )}
          </h4>

          <CopyLinkButton noteId={note.id} />
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
        deleted={!!ddate}
        setCollapsed={setCollapsed}
      >
        <NoteEditorForm
          note={note}
          invitation={activeEditInvitation}
          onNoteEdited={(newNote) => {
            updateNote(newNote)
            setActiveEditInvitation(null)
            scrollToNote(newNote.id)
          }}
          onNoteCancelled={() => {
            setActiveEditInvitation(null)
          }}
          onError={(isLoadingError) => {
            if (isLoadingError) {
              setActiveEditInvitation(null)
            }
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
      deleted={!!ddate}
      setCollapsed={setCollapsed}
    >
      <div className="heading">
        <h4>
          {content.title?.value ? (
            <strong>{content.title.value}</strong>
          ) : (
            <span>{generatedTitle}</span>
          )}
        </h4>

        <CopyLinkButton noteId={note.id} />

        {(note.editInvitations?.length > 0 && !ddate) && (
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-xs dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Edit
              &nbsp;
              <span className="caret" />
            </button>
            <ul className="dropdown-menu">
              {note.editInvitations?.map(invitation => (
                <li
                  key={invitation.id}
                  onClick={() => setActiveEditInvitation(invitation)}
                >
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#">{prettyInvitationId(invitation.id)}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {note.deleteInvitation && (
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => {
              view2.deleteOrRestoreNote(
                note,
                note.deleteInvitation,
                content.title?.value ? content.title.value : generatedTitle,
                user,
                (newNote) => {
                  updateNote(newNote)
                  scrollToNote(newNote.id)
                }
              )
            }}
          >
            <Icon name={ddate ? 'repeat' : 'trash'} />
          </button>
        )}
      </div>

      <div className="subheading">
        <span
          key={invitations[0]}
          className="invitation highlight"
          data-toggle="tooltip"
          data-placement="top"
          title="Reply type"
          style={getInvitationColors(prettyInvitationId(invitations[0]))}
        >
          {prettyInvitationId(invitations[0], true)}
        </span>
        <span className="signatures">
          <Icon name="pencil" tooltip="Reply Author" />
          {signatures.map((signature) => {
            const signatureLink = signature.startsWith('~')
              ? <Link href={`/profile?id=${signature}`}><a>{prettyId(signature)}</a></Link>
              : prettyId(signature)
            const signatureGroup = note.details?.signatures?.find(p => p.id === signature)
            if (signatureGroup) {
              let tooltip = `Privately revealed to ${signatureGroup.readers?.map(p => prettyId(p)).join(', ')}`
              let icon = 'eye-open'
              if (signatureGroup.readers?.includes('everyone')) {
                tooltip = 'Publicly revealed to everyone'
                icon = 'globe'
              }
              return (
                <span key={signature}>
                  {signatureLink}
                  {' '}
                  (
                  <Icon name={icon} tooltip={tooltip} />
                  {signatureGroup.members.map(q => (
                    <Link key={q} href={`/profile?id=${q}`}><a>{prettyId(q)}</a></Link>
                  )).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
                  )
                </span>
              )
            }
            return <span key={signature}>{signatureLink}</span>
          }).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
        </span>
        <span className="created-date" data-toggle="tooltip" data-placement="top" title="Date created">
          <Icon name="calendar" />
          {forumDate(note.cdate, null, note.mdate, null)}
        </span>
        <span className="readers" data-toggle="tooltip" data-placement="top" title="Visible to">
          <Icon name="eye-open" />
          {note.readers.map(reader => prettyId(reader, true)).join(', ')}
        </span>
        <span className="revisions">
          <Icon name="duplicate" />
          <Link href={`/revisions?id=${note.id}`}>
            <a>Revisions</a>
          </Link>
        </span>
      </div>

      <NoteContentCollapsible
        id={note.id}
        content={note.content}
        presentation={note.details?.presentation}
        collapsed={!contentExpanded}
        deleted={!!ddate}
      />

      {(note.replyInvitations?.length > 0 && !note.ddate) && (
        <div className="invitations-container mt-2">
          <div className="invitation-buttons">
            <span className="hint">Add:</span>
            {note.replyInvitations.map(inv => (
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
              updateNote(newNote)
              setActiveInvitation(null)
              scrollToNote(newNote.id)
            }}
            onNoteCancelled={() => { setActiveInvitation(null) }}
            onError={(isLoadingError) => {
              if (isLoadingError) {
                setActiveInvitation(null)
              }
            }}
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
  id, hidden, collapsed, deleted, setCollapsed, children,
}) {
  return (
    <div className={`note ${deleted ? 'deleted' : ''}`} style={hidden ? { display: 'none' } : {}} data-id={id}>
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
  id, content, presentation, collapsed, deleted
}) {
  if (deleted) {
    return (
      <div className="note-content-container">
        <div className="note-content">
          <em>[Deleted]</em>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex="0"
      className={`note-content-container ${collapsed ? 'collapsed' : ''}`}
    >
      <NoteContentV2
        id={id}
        content={content}
        presentation={presentation}
        include={['pdf', 'html']}
      />
      {/* <div className="gradient-overlay" /> */}
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
