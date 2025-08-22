/* globals promptMessage,$: false */

import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import copy from 'copy-to-clipboard'
import truncate from 'lodash/truncate'
import { NoteContentV2 } from '../NoteContent'
import NoteEditor from '../NoteEditor'
import ForumReplyContext from './ForumReplyContext'
import Icon from '../Icon'
import { getInvitationColors } from '../../lib/forum-utils'
import { prettyId, prettyInvitationId, forumDate, buildNoteTitle } from '../../lib/utils'

function scrollToNote(noteId, showEditor) {
  const el = document.querySelector(
    `.note[data-id="${noteId}"]${showEditor ? ' .invitation-buttons' : ''}`
  )
  if (!el) return

  const navBarHeight = 63
  const y = el.getBoundingClientRect().top + window.scrollY - navBarHeight
  window.scrollTo({ top: y, behavior: 'smooth' })
}

export default function ForumReply({
  note,
  replies,
  replyDepth,
  parentNote,
  updateNote,
  deleteOrRestoreNote,
  isDirectReplyToForum,
}) {
  const [activeInvitation, setActiveInvitation] = useState(null)
  const [activeEditInvitation, setActiveEditInvitation] = useState(null)
  const { displayOptionsMap, nesting, excludedInvitations, setCollapsed, setContentExpanded } =
    useContext(ForumReplyContext)

  const { invitations, signatures, content, ddate } = note
  const { hidden, collapsed, contentExpanded } = displayOptionsMap[note.id]
  const allChildIds = replies.reduce(
    (acc, reply) =>
      acc.concat(
        reply.id,
        reply.replies.map((r) => r.id)
      ),
    []
  )
  const allRepliesHidden = allChildIds.every((childId) => displayOptionsMap[childId].hidden)

  let replyInvitations = []
  if (!note.ddate) {
    const noteReadableByEveryone = note.readers.includes('everyone')
    replyInvitations = note.replyInvitations?.filter((inv) => {
      if (excludedInvitations && excludedInvitations.includes(inv.id)) return false

      const invitationReaders = Array.isArray(inv.edit?.note?.readers)
        ? inv.edit?.note?.readers
        : inv.edit?.note?.readers?.param?.const

      return (
        noteReadableByEveryone ||
        !invitationReaders ||
        invitationReaders.some((r) => r.startsWith('$')) ||
        invitationReaders.every((reader) => note.readers.includes(reader))
      )
    })
  }

  const openNoteEditor = (invitation, type) => {
    if (type === 'reply') {
      setActiveInvitation(activeInvitation ? null : invitation)
      setActiveEditInvitation(null)
    } else if (type === 'edit') {
      setActiveInvitation(null)
      setActiveEditInvitation(activeInvitation ? null : invitation)
    }
  }

  useEffect(() => {
    $('.forum-replies-container [data-toggle="tooltip"]').tooltip({ html: true })
  }, [collapsed])

  if (collapsed) {
    // Collapsed reply
    return (
      <ReplyContainer
        id={note.id}
        hidden={hidden && allRepliesHidden}
        collapsed={collapsed}
        expanded={contentExpanded}
        deleted={!!ddate}
        setCollapsed={setCollapsed}
        setContentExpanded={setContentExpanded}
        replyDepth={replyDepth}
      >
        <div className="heading">
          <h4 className="minimal-title">
            <strong>{content.title?.value || buildNoteTitle(invitations[0])}</strong> &bull;{' '}
            <span className="signatures">
              by {signatures.map((signature) => prettyId(signature, true)).join(', ')}
            </span>{' '}
            {ddate && <span className="signatures">[Deleted]</span>}
          </h4>

          <CopyLinkButton forumId={note.forum} noteId={note.id} />
        </div>

        {!allRepliesHidden && (
          <NoteReplies
            replies={replies}
            replyDepth={replyDepth + 1}
            parentNote={note}
            updateNote={updateNote}
            deleteOrRestoreNote={deleteOrRestoreNote}
          />
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
        expanded={contentExpanded}
        deleted={!!ddate}
        setCollapsed={setCollapsed}
        setContentExpanded={setContentExpanded}
        replyDepth={replyDepth}
      >
        <NoteEditor
          invitation={activeEditInvitation}
          note={note}
          replyToNote={parentNote}
          className={`note-editor-edit depth-${replyDepth % 2 === 0 ? 'even' : 'odd'}`}
          closeNoteEditor={() => setActiveEditInvitation(null)}
          onNoteCreated={(newNote) => {
            updateNote(newNote)
            setActiveEditInvitation(null)
            scrollToNote(newNote.id)
          }}
          isDirectReplyToForum={isDirectReplyToForum}
        />
        {!allRepliesHidden && (
          <>
            <hr />
            <NoteReplies
              replies={replies}
              replyDepth={replyDepth + 1}
              parentNote={note}
              updateNote={updateNote}
              deleteOrRestoreNote={deleteOrRestoreNote}
            />
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
      expanded={contentExpanded}
      deleted={!!ddate}
      setCollapsed={setCollapsed}
      setContentExpanded={setContentExpanded}
      replyDepth={replyDepth}
    >
      {nesting === replyDepth && note.replyto !== parentNote?.id && (
        <div className="parent-title">
          <h5 onClick={() => scrollToNote(note.replyto)}>
            <Icon name="share-alt" /> Replying to{' '}
            {truncate(note.parentTitle, {
              length: 135,
              omission: '...',
              separator: ' ',
            })}
          </h5>
        </div>
      )}

      <div className="heading">
        <h4>
          {content.title?.value ? (
            <strong>{content.title.value}</strong>
          ) : (
            <span>{note.generatedTitle}</span>
          )}
        </h4>

        <CopyLinkButton forumId={note.forum} noteId={note.id} />

        {note.editInvitations?.length > 0 && !ddate && (
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-xs dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Edit &nbsp;
              <span className="caret" />
            </button>
            <ul className="dropdown-menu">
              {note.editInvitations?.map((invitation) => (
                <li key={invitation.id}>
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a
                    href="#"
                    data-id={invitation.id}
                    onClick={(e) => {
                      e.preventDefault()
                      openNoteEditor(invitation, 'edit')
                    }}
                  >
                    {prettyInvitationId(invitation.id)}
                  </a>
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
              deleteOrRestoreNote(note, note.deleteInvitation, updateNote)
            }}
          >
            <Icon name={ddate ? 'repeat' : 'trash'} />
            <span className="sr-only">Delete or restore note</span>
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
          by{' '}
          {signatures
            .map((signature) => {
              const signatureLink = signature.startsWith('~') ? (
                <a href={`/profile?id=${signature}`} target="_blank" rel="noreferrer">
                  {prettyId(signature, true)}
                </a>
              ) : (
                prettyId(signature, true)
              )
              const signatureGroup = note.details?.signatures?.find((p) => p.id === signature)
              if (signatureGroup) {
                let tooltip = `Identities privately revealed to ${signatureGroup.readers
                  ?.map((p) => prettyId(p, true))
                  .join(', ')}`
                let icon = 'eye-open'
                if (signatureGroup.readers?.includes('everyone')) {
                  tooltip = 'Identities publicly revealed to everyone'
                  icon = 'globe'
                }
                return (
                  <span key={signature}>
                    {signatureLink} (
                    <Icon name={icon} tooltip={tooltip} />
                    {signatureGroup.members
                      .slice(0, 4)
                      .map((q) => (
                        <a key={q} href={`/profile?id=${q}`} target="_blank" rel="noreferrer">
                          {prettyId(q, true)}
                        </a>
                      ))
                      .concat(
                        signatureGroup.members.length > 4 ? (
                          <a
                            key="others"
                            href={`/group/edit?id=${signatureGroup.id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            +{signatureGroup.members.length - 4} more
                          </a>
                        ) : (
                          []
                        )
                      )
                      .reduce(
                        (accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]),
                        null
                      )}
                    )
                  </span>
                )
              }
              return <span key={signature}>{signatureLink}</span>
            })
            .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
        </span>
        <span
          className="created-date"
          data-toggle="tooltip"
          data-placement="top"
          title="Date created"
        >
          <Icon name="calendar" />
          {forumDate(note.cdate, null, note.mdate, null, null, null, true)}
        </span>
        <span
          className="readers"
          data-toggle="tooltip"
          data-placement="top"
          title={`Visible to <br/>${note.readers.join(',<br/>')}`}
        >
          <Icon name="eye-open" />
          {note.readers.map((reader) => prettyId(reader, true)).join(', ')}
        </span>
        {note.tmdate !== note.tcdate && (
          <span className="revisions">
            <Icon name="duplicate" />
            <Link href={`/revisions?id=${note.id}`}>Revisions</Link>
          </span>
        )}
      </div>

      <NoteContentCollapsible
        id={note.id}
        content={content}
        presentation={note.details?.presentation}
        noteReaders={note.sortedReaders}
        contentExpanded={contentExpanded}
        setContentExpanded={setContentExpanded}
        deleted={!!ddate}
      />

      {replyInvitations.length > 0 && (
        <div className="invitations-container mt-2">
          <div className="invitation-buttons">
            <span className="hint">Add:</span>
            {replyInvitations.map((inv) => (
              <button
                key={inv.id}
                type="button"
                className={`btn btn-xs ${activeInvitation?.id === inv.id ? 'active' : ''}`}
                data-id={inv.id}
                onClick={() => openNoteEditor(inv, 'reply')}
              >
                {prettyInvitationId(inv.id)}
              </button>
            ))}
          </div>

          <NoteEditor
            invitation={activeInvitation}
            replyToNote={note}
            className={`note-editor-reply depth-${replyDepth % 2 === 0 ? 'even' : 'odd'}`}
            closeNoteEditor={() => {
              setActiveInvitation(null)
            }}
            onNoteCreated={(newNote) => {
              updateNote(newNote)
              setActiveInvitation(null)
              scrollToNote(newNote.id)
            }}
            isDirectReplyToForum={false} // reply to direct reply
          />
        </div>
      )}

      {!allRepliesHidden && (
        <NoteReplies
          replies={replies}
          replyDepth={replyDepth + 1}
          parentNote={note}
          updateNote={updateNote}
          deleteOrRestoreNote={deleteOrRestoreNote}
        />
      )}
    </ReplyContainer>
  )
}

function ReplyContainer({
  id,
  hidden,
  collapsed,
  expanded,
  deleted,
  setCollapsed,
  setContentExpanded,
  replyDepth,
  children,
}) {
  return (
    <div
      className={`note ${deleted ? 'deleted' : ''} depth-${
        replyDepth % 2 === 0 ? 'even' : 'odd'
      }`}
      style={hidden ? { display: 'none' } : {}}
      data-id={id}
    >
      <div
        className="btn-group-vertical btn-group-xs collapse-controls-v"
        role="group"
        aria-label="Collapse controls"
      >
        <button
          type="button"
          className={`btn btn-default ${collapsed ? 'active' : ''}`}
          onClick={(e) => {
            setCollapsed(id, true)
            setContentExpanded(id, false)
          }}
        >
          −
        </button>
        <button
          type="button"
          className={`btn btn-default middle ${!collapsed && !expanded ? 'active' : ''}`}
          onClick={(e) => {
            setCollapsed(id, false)
            setContentExpanded(id, false)
          }}
        >
          ＝
        </button>
        <button
          type="button"
          className={`btn btn-default ${!collapsed && expanded ? 'active' : ''}`}
          onClick={(e) => {
            setCollapsed(id, false)
            setContentExpanded(id, true)
          }}
        >
          ≡
        </button>
      </div>

      {children}
    </div>
  )
}

function CopyLinkButton({ forumId, noteId }) {
  const copyNoteUrl = (e) => {
    if (!window.location) return

    copy(`${window.location.origin}${window.location.pathname}?id=${forumId}&noteId=${noteId}`)
    promptMessage(`URL of note ${noteId} copied to clipboard`, { scrollToTop: false })
  }

  return (
    <button
      type="button"
      className="btn btn-xs permalink-btn"
      onClick={copyNoteUrl}
      aria-label={`Copy URL of note ${noteId}`}
    >
      <a
        onClick={(e) => e.preventDefault()}
        href={`${window.location.origin}${window.location.pathname}?id=${forumId}&noteId=${noteId}`}
      >
        <Icon name="link" tooltip={`Copy URL of note ${noteId}`} />
        <span className="sr-only">Copy URL of note {noteId}</span>
      </a>
    </button>
  )
}

function NoteContentCollapsible({
  id,
  content,
  presentation,
  noteReaders,
  contentExpanded,
  deleted,
  setContentExpanded,
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
  if (!Object.keys(content ?? {}).length)
    return (
      <div className="note-content-container">
        <div className="note-content">
          <em>[empty]</em>
        </div>
      </div>
    )

  return (
    <div className={`note-content-container ${contentExpanded ? '' : 'collapsed'}`}>
      <NoteContentV2
        id={id}
        content={content}
        presentation={presentation}
        noteReaders={noteReaders}
      />
      {!contentExpanded && (
        <div className="gradient-overlay">
          <button
            type="button"
            className="btn btn-block btn-link"
            onClick={() => setContentExpanded(id, true)}
          >
            ≡ &nbsp;Show All
          </button>
        </div>
      )}
    </div>
  )
}

function NoteReplies({ replies, replyDepth, parentNote, updateNote, deleteOrRestoreNote }) {
  const { replyNoteMap } = useContext(ForumReplyContext)

  if (!replies?.length) return null

  return (
    <div className="note-replies">
      {replies.map((childNote) => (
        <ForumReply
          key={childNote.id}
          note={replyNoteMap[childNote.id]}
          replyDepth={replyDepth}
          parentNote={parentNote}
          replies={childNote.replies ?? []}
          updateNote={updateNote}
          deleteOrRestoreNote={deleteOrRestoreNote}
          isDirectReplyToForum={false}
        />
      ))}
    </div>
  )
}
