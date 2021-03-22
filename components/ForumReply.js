/* globals promptMessage: false */

import { useContext } from 'react'
import copy from 'copy-to-clipboard'
import NoteContent from './NoteContent'
import ForumReplyContext from './ForumReplyContext'
import {
  prettyId, prettyInvitationId, buildNoteTitle, forumDate,
} from '../lib/utils'
import { getInvitationColors } from '../lib/forum-utils'
import Icon from './Icon'

export default function ForumReply({ note, replies }) {
  const { displayOptionsMap, setCollapsed } = useContext(ForumReplyContext)
  const { hidden, collapsed, contentExpanded } = displayOptionsMap[note.id]
  const allRepliesHidden = replies.every(childNote => displayOptionsMap[childNote.id].hidden)

  return (
    <div className="note" style={(hidden && allRepliesHidden) ? { display: 'none' } : {}}>
      <button type="button" className="btn btn-link collapse-link" onClick={e => setCollapsed(note.id, !collapsed)}>
        [
        {collapsed ? '+' : '–'}
        ]
      </button>

      <ReplyTitle note={note} collapsed={collapsed} />

      {!collapsed && (
        <NoteContentCollapsible
          id={note.id}
          content={note.content}
          invitation={note.details?.originalInvitation || note.details?.invitation}
          collapsed={!contentExpanded}
        />
      )}

      {(!collapsed || !allRepliesHidden) && replies?.length > 0 && (
        <div className="note-replies">
          {replies.map((childNote) => {
            const options = displayOptionsMap[childNote.id]
            return (
              <div key={childNote.id} className="note" style={options.hidden ? { display: 'none' } : {}}>
                <button type="button" className="btn btn-link collapse-link" onClick={e => setCollapsed(childNote.id, !options.collapsed)}>
                  [
                  {options.collapsed ? '+' : '–'}
                  ]
                </button>

                <ReplyTitle note={childNote} collapsed={options.collapsed} />

                {!options.collapsed && (
                  <NoteContentCollapsible
                    id={childNote.id}
                    content={childNote.content}
                    invitation={childNote.details?.originalInvitation || childNote.details?.invitation}
                    collapsed={!options.contentExpanded}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReplyTitle({ note, collapsed }) {
  const {
    id, invitation, content, signatures,
  } = note

  if (collapsed) {
    return (
      <div>
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
            <span>{buildNoteTitle(invitation, signatures)}</span>
          )}

          <CopyLinkButton noteId={id} />
        </h4>
      </div>
    )
  }

  return (
    <div>
      <h4>
        {content.title ? (
          <strong>{content.title}</strong>
        ) : (
          <span>{buildNoteTitle(invitation, signatures)}</span>
        )}

        <CopyLinkButton noteId={id} />
      </h4>
      <div className="subheading">
        <span
          className="invitation highlight"
          data-toggle="tooltip"
          data-placement="top"
          title="Reply type"
          style={getInvitationColors(prettyInvitationId(invitation))}
        >
          {prettyInvitationId(invitation, true)}
        </span>
        <span className="signatures" data-toggle="tooltip" data-placement="top" title="Reply Author">
          <Icon name="pencil" />
          {signatures.map(signature => prettyId(signature, true)).join(', ')}
        </span>
        <span className="created-date" data-toggle="tooltip" data-placement="top" title="Date created">
          <Icon name="calendar" />
          {forumDate(note.cdate, note.tcdate, note.mdate)}
        </span>
        <span className="readers" data-toggle="tooltip" data-placement="top" title="Visible to">
          <Icon name="eye-open" />
          {note.readers.map(reader => prettyId(reader, true)).join(', ')}
        </span>
      </div>
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
  id, content, invitation, collapsed,
}) {
  return (
    <div
      role="button"
      tabIndex="0"
      className={`note-content-container ${collapsed ? 'collapsed' : ''}`}
      onClick={e => e.currentTarget.classList.toggle('collapsed')}
    >
      <NoteContent
        id={id}
        content={content}
        invitation={invitation}
      />
      <div className="gradient-overlay">
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a href="#" onClick={e => e.preventDefault()}>Show more</a>
      </div>
    </div>
  )
}
