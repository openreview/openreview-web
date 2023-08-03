/* globals $,promptMessage,promptError,MathJax: false */

import { forwardRef, useEffect, useState } from 'react'
import truncate from 'lodash/truncate'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import Icon from '../Icon'
import BasicModal from '../BasicModal'
import Signatures from '../Signatures'
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
  const [useMarkdown, setUseMarkdown] = useState(true)
  const [needsRerender, setNeedsRerender] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const { accessToken } = useUser()

  useEffect(() => {
    if (needsRerender && useMarkdown) {
      setTimeout(() => {
        try {
          MathJax.typesetPromise()
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Could not format math notation')
        }
      }, 100)
    }
  }, [useMarkdown, needsRerender])

  if (!note || displayOptions.hidden) return null

  const isChatNote = Object.keys(note.content).length === 1 && note.content.message
  const presentation = note.details?.presentation
  const enableMarkdown = presentation?.[0]?.markdown
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

  const showDeleteModal = (e) => {
    setDeleteModalVisible(true)
    $(`#delete-modal-${note.id}`).modal('show')
  }
  const hideDeleteModal = () => {
    setDeleteModalVisible(false)
    $('body').removeClass('modal-open')
    $('.modal-backdrop').remove()
  }

  const deleteNote = (deleteSignatures) => {
    if (loading || !accessToken) return

    setLoading(true)
    const now = Date.now()
    const noteEdit = {
      invitation: note.deleteInvitation.id,
      signatures: deleteSignatures,
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

    hideDeleteModal()
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
      <div className="chat-body" style={{ backgroundColor: `${colorHash}1E` }}>
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

          {note.tmdate !== note.tcdate && <small>(edited)</small>}
        </div>

        {isChatNote ? (
          <div className="note-content">
            <NoteContentValue
              content={prettyContentValue(note.content.message.value)}
              enableMarkdown={enableMarkdown && useMarkdown}
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

          {isChatNote && enableMarkdown && (
            <button
              type="button"
              className="btn btn-default"
              onClick={() => {
                setUseMarkdown((oldVal) => !oldVal)
                setNeedsRerender(true)
              }}
            >
              <Icon name="text-background" /> View {useMarkdown ? 'Raw' : 'Formatted'}
            </button>
          )}

          {note.details.writable && note.deleteInvitation && (
            <button type="button" className="btn btn-default" onClick={showDeleteModal}>
              <Icon name="trash" /> Delete
            </button>
          )}
        </div>
      </div>

      {note.details.writable && note.deleteInvitation && (
        <DeleteChatModal
          noteId={note.id}
          deleteInvitation={note.deleteInvitation}
          deleteNote={deleteNote}
          isVisible={deleteModalVisible}
        />
      )}
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
          {' '}
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

function DeleteChatModal({ noteId, deleteInvitation, deleteNote, isVisible }) {
  const [signatures, setSignatures] = useState(null)
  const [error, setError] = useState(null)

  return (
    <BasicModal
      id={`delete-modal-${noteId}`}
      title="Delete Chat Message"
      primaryButtonText="Delete"
      primaryButtonDisabled={!signatures?.value}
      onPrimaryButtonClick={() => deleteNote(signatures.value)}
      onClose={() => {}}
    >
      <p className="mb-3">
        Are you sure you want to delete this message? The deleted chat note will be updated
        with the signature you choose below.
      </p>
      <div className="mb-2">
        <h4 className="pull-left mt-2 mr-3">Signature:</h4>
        {isVisible && (
          <Signatures
            fieldDescription={deleteInvitation.edit.signatures}
            onChange={(newSignatures) => {
              setSignatures((prev) => ({ ...prev, ...newSignatures }))
            }}
            currentValue={signatures}
            onError={setError}
          />
        )}
      </div>
      {error && (
        <div className="alert alert-danger">
          Error: Signatures could note be loaded. Please reload the page and try again.
        </div>
      )}
    </BasicModal>
  )
}
