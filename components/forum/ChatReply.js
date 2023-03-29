/* globals promptMessage,promptError: false */

import { forwardRef, useState } from 'react'
import truncate from 'lodash/truncate'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import Icon from '../Icon'
import { NoteContentV2, NoteContentValue } from '../NoteContent'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId, prettyInvitationId, prettyContentValue, forumDate } from '../../lib/utils'
import { getInvitationColors, getSignatureColors } from '../../lib/forum-utils'

import styles from '../../styles/components/ChatReply.module.scss'

dayjs.extend(localizedFormat)
dayjs.extend(isToday)
dayjs.extend(isYesterday)

// eslint-disable-next-line prefer-arrow-callback
export default forwardRef(function ChatReply(
  { note, parentNote, displayOptions, isSelected, setChatReplyNote, updateNote },
  ref
) {
  const [loading, setLoading] = useState(false)
  const { accessToken } = useUser()

  if (!note || displayOptions.hidden) return null

  const isChatNote = Object.keys(note.content).length === 1 && note.content.message
  const presentation = note.details?.presentation
  const colorHash = getSignatureColors(prettyId(note.signatures[0], true))
  const cdate = dayjs(note.cdate)
  const formattedTime = dayjs(note.cdate).format('LT')
  let datePrefix = ''
  if (cdate.isToday()) {
    datePrefix = 'Today'
  } else if (cdate.isYesterday()) {
    datePrefix = 'Yesterday'
  } else {
    datePrefix = cdate.format('l')
  }

  const deleteNote = (e) => {
    e.preventDefault()

    if (loading || !accessToken) return
    setLoading(true)

    // TODO: prompt user for signature
    const now = Date.now()
    const noteEdit = {
      invitation: note.deleteInvitation.id,
      signatures: note.signatures,
      note: {
        id: note.id,
        replyto: note.replyto,
        content: note.content,
        ddate: now,
      },
    }

    api
      .post('/notes/edits', noteEdit, { accessToken, version: 2 })
      .then((res) => {
        updateNote({ ...note, ddate: now })
        setLoading(false)
      })
      .catch((err) => {
        promptError(err.message, { scrollToTop: false })
        setLoading(false)
      })
  }

  const copyNoteUrl = (e) => {
    if (!window.location) return

    copy(
      `${window.location.origin}${window.location.pathname}?id=${note.forum}&noteId=${note.id}${window.location.hash}`
    )
    promptMessage('Reply URL copied to clipboard', { scrollToTop: false })
  }

  if (note.ddate) {
    return (
      <div className={`${styles.container}`} data-id={note.id} ref={ref}>
        <div className="chat-body deleted clearfix">
          <ReplyInfo parentNote={parentNote} parentTitle={note.parentTitle} />

          <div className="header">
            <span className="indicator" style={{ backgroundColor: '#ddd' }} />
            <strong>{prettyId(note.signatures[0], true)}</strong>
          </div>
          <div className="note-content">
            <div className="note-content-value markdown-rendered">
              <p className="text-muted">
                <em>Message Deleted</em>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`left clearfix ${styles.container} ${isSelected ? styles.active : ''}`}
      data-id={note.id}
      ref={ref}
    >
      <div className="chat-body" style={{ backgroundColor: `${colorHash}22` }}>
        <ReplyInfo parentNote={parentNote} parentTitle={note.parentTitle} />

        <div className="header">
          <span className="indicator" style={{ backgroundColor: colorHash }} />

          {note.signatures
            .map((signature) => (
              <ChatSignature
                key={signature}
                groupId={signature}
                signatureGroup={note.details.signatures?.find((p) => p.id === signature)}
              />
            ))
            .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}

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

          <small>
            {/* <Icon name="time" tooltip={forumDate(note.cdate, null, note.mdate, null)} /> */}
            {datePrefix} at {formattedTime}
          </small>

          {note.details?.editsCount > 1 && (
            <small>(edited)</small>
          )}
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

      <div className={styles['chat-actions']}>
        <div className="btn-group" role="group" aria-label="Actions">
          <button
            type="button"
            className="btn btn-default"
            onClick={() => {
              setChatReplyNote(note)
            }}
          >
            <Icon name="share-alt" /> Reply
          </button>

          <button type="button" className="btn btn-default" onClick={copyNoteUrl}>
            <Icon name="link" /> Copy Link
          </button>

          {note.details.writable && note.deleteInvitation && (
            <button type="button" className="btn btn-default" onClick={deleteNote}>
              <Icon name="trash" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

function ReplyInfo({ parentNote, parentTitle }) {
  if (!parentNote) return null

  return (
    <div className="parent-info">
      <h5 onClick={() => {}}>
        {/* <Icon name="share-alt" />{' '} */}
        <span>Replying to {prettyId(parentNote.signatures[0], true)}</span>
        {' – '}
        {truncate(parentNote.content.message?.value || parentTitle, {
          length: 100,
          omission: '...',
          separator: ' ',
        })}
      </h5>
    </div>
  )
}

function ChatSignature({ groupId, signatureGroup }) {
  let tooltip
  let icon
  if (signatureGroup?.readers) {
    tooltip = `Identities privately revealed to ${signatureGroup.readers
      ?.map((p) => prettyId(p, true))
      .join(', ')}`
    icon = 'eye-open'
    if (signatureGroup.readers?.includes('everyone')) {
      tooltip = 'Identities publicly revealed to everyone'
      icon = 'globe'
    }
  }

  return (
    <strong>
      {groupId.startsWith('~') ? (
        <a href={`/profile?id=${groupId}`} target="_blank" rel="noreferrer">
          {prettyId(groupId, true)}
        </a>
      ) : (
        prettyId(groupId, true)
      )}

      {signatureGroup?.members.length > 0 && (
        <span className="members-list">
          (
          <Icon name={icon} tooltip={tooltip} />
          {signatureGroup.members
            .slice(0, 4)
            .map((q) => (
              <a key={q} href={`/profile?id=${q}`} target="_blank" rel="noreferrer">
                {prettyId(q, true)}
              </a>
            ))
            .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
          {signatureGroup.members.length > 4 && (
            <a
              key="others"
              href={`/group/info?id=${groupId}`}
              target="_blank"
              rel="noreferrer"
            >
              +{signatureGroup.members.length - 4} more
            </a>
          )}
          )
        </span>
      )}
    </strong>
  )
}
