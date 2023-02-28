/* globals promptMessage: false */

import { useState } from 'react'
import truncate from 'lodash/truncate'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import Icon from '../Icon'
import { NoteContentV2, NoteContentValue } from '../NoteContent'
import useUser from '../../hooks/useUser'
import { prettyId, prettyInvitationId, prettyContentValue, forumDate } from '../../lib/utils'
import { getInvitationColors } from '../../lib/forum-utils'

import styles from '../../styles/components/ChatReply.module.scss'

dayjs.extend(localizedFormat)

export default function ChatReply({
  note,
  parentNote,
  displayOptions,
  isSelected,
  setChatReplyNote,
  updateNote,
}) {
  const [editMode, setEditMode] = useState(false)

  if (!note || displayOptions.hidden) return null

  const isChatNote = Object.keys(note.content).length === 1 && note.content.message
  const presentation = note.details?.presentation
  const colorHash = getInvitationColors(prettyId(note.signatures[0], true)).backgroundColor

  const copyNoteUrl = (e) => {
    if (!window.location) return

    copy(
      `${window.location.origin}${window.location.pathname}?id=${note.forum}&noteId=${note.id}${window.location.hash}`
    )
    promptMessage('Reply URL copied to clipboard', { scrollToTop: false })
  }

  return (
    <li
      className={`left clearfix ${styles.container} ${isSelected ? styles.active : ''}`}
      data-id={note.id}
      style={{ boxShadow: `0 0 0 2px ${colorHash}` }}
    >
      <div className="chat-body clearfix">
        {parentNote && (
          <div className="parent-info">
            <h5 onClick={() => {}}>
              {/* <Icon name="share-alt" />{' '} */}
              <span>Replying to {prettyId(parentNote.signatures[0], true)}</span>
              {' – '}
              {truncate(parentNote.content.message?.value || note.parentTitle, {
                length: 100,
                omission: '...',
                separator: ' ',
              })}
            </h5>
          </div>
        )}

        <div className="header">
          <span className="indicator" style={{ backgroundColor: colorHash }} />
          <strong>
            {note.signatures
              .map((signature) => (
                <span key={signature}>
                  {signature.startsWith('~') ? (
                    <a href={`/profile?id=${signature}`} target="_blank" rel="noreferrer">
                      {prettyId(signature, true)}
                    </a>
                  ) : (
                    prettyId(signature, true)
                  )}
                </span>
              ))
              .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
          </strong>

          {!isChatNote && (
            <span
              key={note.invitations[0]}
              className="invitation highlight"
              data-toggle="tooltip"
              data-placement="top"
              title="Reply type"
              style={getInvitationColors(prettyInvitationId(note.invitations[0]))}
            >
              {prettyInvitationId(note.invitations[0], true)}
            </span>
          )}

          {note.details?.editsCount > 1 && (
            <span className="highlight edit-indicator">(edited)</span>
          )}

          <small className="text-muted pull-right">
            <Icon name="time" tooltip={forumDate(note.cdate, null, note.mdate, null)} />{' '}
            {dayjs(note.cdate).format('l LT')}
          </small>
        </div>

        {isChatNote ? (
          <div className="note-content">
            <NoteContentValue
              content={prettyContentValue(note.content.message.value)}
              enableMarkdown={presentation?.[0]?.markdown}
            />
          </div>
        ) : (
          <NoteContentV2
            id={note.id}
            content={note.content}
            presentation={presentation}
            noteReaders={note.readers}
            include={['title', 'pdf', 'html']}
          />
        )}
      </div>

      <div className="chat-actions clearfix">
        <ul className="list-inline pull-left">
          <li>
            <button
              className="btn btn-link"
              onClick={() => {
                setChatReplyNote(note)
              }}
            >
              <Icon name="share-alt" /> Reply
            </button>
          </li>
          <li>
            <button className="btn btn-link" onClick={copyNoteUrl}>
              <Icon name="link" tooltip="Copy post URL" /> Link
            </button>
          </li>
          {/*
          <li>
            <button className="btn btn-link" onClick={() => { setEditMode(true) }}>
              <Icon name="pencil" /> Edit
            </button>
          </li>
          */}
          {/*
          <li>
            <button className="btn btn-link" onClick={() => {}}>
              <Icon name="flag" /> Flag
            </button>
          </li>
          */}
        </ul>
        <ul className="list-inline pull-right">
          {/*
          <li>
            <button className="btn btn-link" onClick={() => {}}>
              <Icon name="option-horizontal" /> More
            </button>
          </li>
          */}
        </ul>
      </div>
    </li>
  )
}
