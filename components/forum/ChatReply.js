/* globals $,promptMessage,promptError,MathJax: false */

import { useEffect, useState } from 'react'
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
import {
  prettyId,
  prettyInvitationId,
  prettyContentValue,
  prettyList,
  inflect,
} from '../../lib/utils'
import {
  getInvitationColors,
  getSignatureColors,
  getReplySnippet,
  addTagToReactionsList,
} from '../../lib/forum-utils'

import styles from '../../styles/components/ChatReply.module.scss'

dayjs.extend(localizedFormat)
dayjs.extend(isToday)
dayjs.extend(isYesterday)

const ChatReply = ({
  note,
  parentNote,
  displayOptions,
  isSelected,
  setChatReplyNote,
  signature,
  updateNote,
  scrollToNote,
}) => {
  const [loading, setLoading] = useState(false)
  const [useMarkdown, setUseMarkdown] = useState(true)
  const [needsRerender, setNeedsRerender] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const { accessToken } = useUser()

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
  const reactionInvitation = note.tagInvitations?.find((i) => i.id.endsWith('/Chat_Reaction'))

  const showDeleteModal = (e) => {
    setDeleteModalVisible(true)
    $(`#delete-modal-${note.id}`).modal('show')
  }

  const hideDeleteModal = () => {
    setDeleteModalVisible(false)
    $('body').removeClass('modal-open')
    $('.modal-backdrop').remove()
  }

  const toggleReactionPicker = () => {
    setShowReactionPicker((oldVal) => !oldVal)
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
      .post('/notes/edits', noteEdit, { accessToken })
      .then((res) => {
        updateNote({ ...note, ddate: now })
        setLoading(false)
      })
      .catch((err) => {
        promptError(err.message)
        setLoading(false)
      })

    hideDeleteModal()
  }

  const addOrRemoveTag = (tagValue, existingTags) => {
    if (loading || !accessToken || !reactionInvitation || !signature) return

    setLoading(true)
    setShowReactionPicker(false)

    let existingTagId
    if (existingTags?.length > 0) {
      existingTagId = existingTags.find((t) => t.signature === signature)?.id
    }
    const tagData = {
      label: tagValue,
      invitation: reactionInvitation.id,
      note: note.id,
      forum: note.forum,
      signature,
      ...(existingTagId && { id: existingTagId, ddate: Date.now() }),
    }
    api
      .post('/tags', tagData, { accessToken })
      .then((tagRes) => {
        const tooltipEl = document.querySelector(`#__next div.tooltip.in`)
        if (tooltipEl) tooltipEl.remove()

        const newTags = addTagToReactionsList(note.reactions ?? [], tagRes)
        updateNote({ ...note, reactions: newTags })
        setLoading(false)
      })
      .catch((err) => {
        promptError(err.message)
        setLoading(false)
      })
  }

  const copyNoteUrl = (e) => {
    if (!window.location) return

    copy(
      `${window.location.origin}${window.location.pathname}?id=${note.forum}&noteId=${note.id}${window.location.hash}`
    )
    promptMessage('Reply URL copied to clipboard')
  }

  useEffect(() => {
    if (needsRerender && useMarkdown) {
      setTimeout(() => {
        try {
          MathJax.typesetPromise()
        } catch (error) {
          console.warn('Could not format math notation')
        }
      }, 0)
    }
  }, [useMarkdown, needsRerender])

  if (!note || displayOptions.hidden) return null

  // Deleted Reply
  if (note.ddate) {
    return (
      <div className={`${styles.container}`} data-id={note.id}>
        <div className="chat-body deleted clearfix">
          <ReplyInfo
            parentNote={parentNote}
            parentTitle={note.parentTitle}
            scrollToNote={scrollToNote}
          />
          {/* TODO: uncomment when signatures are sent with deleted notes */}
          {/*
          <div className="header">
            <span className="indicator" style={{ backgroundColor: '#ddd' }} />
            <ChatSignature groupId={signature} />
          </div>
          */}
          <div className="note-content">
            <div className="note-content-value markdown-rendered">
              <p className="text-muted">
                <em>This message has been deleted</em>
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
      onMouseLeave={() => {
        setShowReactionPicker(false)
      }}
    >
      <div className="chat-body" style={{ backgroundColor: `${colorHash}1E` }}>
        <ReplyInfo
          parentNote={parentNote}
          parentTitle={note.parentTitle}
          scrollToNote={scrollToNote}
        />

        <div className="header">
          <span className="indicator" style={{ backgroundColor: colorHash }} />

          {note.signatures
            .map((sigId) => (
              <ChatSignature
                key={sigId}
                groupId={sigId}
                signatureGroup={note.details.signatures?.find((p) => p.id === sigId)}
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
              className={useMarkdown ? '' : 'disable-tex-rendering'}
              enableMarkdown={enableMarkdown && useMarkdown}
            />
          </div>
        ) : (
          <NoteContentV2
            id={note.id}
            content={note.content}
            presentation={presentation}
            noteReaders={note.sortedReaders}
            include={['title']}
          />
        )}

        <ReactionButtons
          noteReactions={note.reactions}
          signature={signature}
          addOrRemoveTag={addOrRemoveTag}
          toggleReactionPicker={toggleReactionPicker}
          showAddButton={!!reactionInvitation}
        />
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

          {reactionInvitation && (
            <button
              type="button"
              className="btn btn-default btn-add-reaction"
              onClick={() => {
                toggleReactionPicker()
              }}
            >
              <svg viewBox="0 0 16 16" version="1.1" aria-hidden="true">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm3.82 1.636a.75.75 0 0 1 1.038.175l.007.009c.103.118.22.222.35.31.264.178.683.37 1.285.37.602 0 1.02-.192 1.285-.371.13-.088.247-.192.35-.31l.007-.008a.75.75 0 0 1 1.222.87l-.022-.015c.02.013.021.015.021.015v.001l-.001.002-.002.003-.005.007-.014.019a2.066 2.066 0 0 1-.184.213c-.16.166-.338.316-.53.445-.63.418-1.37.638-2.127.629-.946 0-1.652-.308-2.126-.63a3.331 3.331 0 0 1-.715-.657l-.014-.02-.005-.006-.002-.003v-.002h-.001l.613-.432-.614.43a.75.75 0 0 1 .183-1.044ZM12 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM5 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5.25 2.25.592.416a97.71 97.71 0 0 0-.592-.416Z"></path>
              </svg>{' '}
              Add Reaction
            </button>
          )}

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

      {showReactionPicker && (
        <ReactionPicker
          options={reactionInvitation.tag.label.param.enum}
          noteReactions={note.reactions}
          addOrRemoveTag={addOrRemoveTag}
          toggleReactionPicker={toggleReactionPicker}
        />
      )}

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
}

function ReplyInfo({ parentNote, parentTitle, scrollToNote }) {
  if (!parentNote) return null

  return (
    <div className="parent-info disable-tex-rendering">
      <h5
        onClick={() => {
          scrollToNote(parentNote.id)
        }}
      >
        {/* <Icon name="share-alt" />{' '} */}
        <span>Replying to {prettyId(parentNote.signatures[0], true)}</span>
        {' – '}
        {getReplySnippet(parentNote.content.message?.value || parentTitle)}
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
      {groupId?.startsWith('~') ? (
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
            .reduce(
              (accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]),
              null
            )}{' '}
          {signatureGroup.members.length > 4 && (
            <a
              key="others"
              href={`/group/edit?id=${groupId}`}
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

function ReactionButtons({
  noteReactions,
  signature,
  addOrRemoveTag,
  toggleReactionPicker,
  showAddButton,
}) {
  if (!noteReactions || noteReactions.length === 0) return null

  return (
    <ul className="chat-reactions list-inline">
      {noteReactions.map(([reaction, tags]) => {
        const sigs = tags.map((t) => t.signature)
        const isActive = sigs.includes(signature)
        const tooltipText = `${inflect(
          tags.length,
          'reaction',
          'reactions',
          true
        )} from ${prettyList(sigs, 'short', 'conjunction')}`

        return (
          <li key={reaction}>
            <button
              className={`btn btn-xs btn-default ${isActive ? 'selected' : ''}`}
              data-placement="top"
              data-container="#__next"
              data-animation=""
              title={tooltipText}
              onClick={(e) => {
                $(e.target).tooltip('destroy')
                addOrRemoveTag(reaction, tags)
              }}
              onMouseEnter={(e) => {
                $(e.target).tooltip('show')
              }}
              onMouseLeave={(e) => {
                $(e.target).tooltip('destroy')
              }}
            >
              <span>{reaction}</span> {tags.length}
            </button>
          </li>
        )
      })}
      {showAddButton && (
        <li key={'add-reaction'}>
          <button
            className="btn btn-xs btn-default add-reaction"
            data-placement="top"
            data-animation=""
            title="Add Reaction"
            onClick={(e) => {
              $(e.target).tooltip('hide')
              toggleReactionPicker()
            }}
            onMouseEnter={(e) => {
              $(e.target).tooltip('show')
            }}
            onMouseLeave={(e) => {
              $(e.target).tooltip('hide')
            }}
          >
            <svg viewBox="0 0 16 16" version="1.1" aria-hidden="true">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm3.82 1.636a.75.75 0 0 1 1.038.175l.007.009c.103.118.22.222.35.31.264.178.683.37 1.285.37.602 0 1.02-.192 1.285-.371.13-.088.247-.192.35-.31l.007-.008a.75.75 0 0 1 1.222.87l-.022-.015c.02.013.021.015.021.015v.001l-.001.002-.002.003-.005.007-.014.019a2.066 2.066 0 0 1-.184.213c-.16.166-.338.316-.53.445-.63.418-1.37.638-2.127.629-.946 0-1.652-.308-2.126-.63a3.331 3.331 0 0 1-.715-.657l-.014-.02-.005-.006-.002-.003v-.002h-.001l.613-.432-.614.43a.75.75 0 0 1 .183-1.044ZM12 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM5 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5.25 2.25.592.416a97.71 97.71 0 0 0-.592-.416Z"></path>
            </svg>{' '}
            +
          </button>
        </li>
      )}
    </ul>
  )
}

function ReactionPicker({ options, noteReactions, addOrRemoveTag, toggleReactionPicker }) {
  return (
    <div className={styles['reaction-picker-overlay']} onClick={toggleReactionPicker}>
      <div className={styles['reaction-picker']}>
        {options.map((tag) => (
          <div key={tag} className="grid-item">
            <button
              className="btn btn-xs btn-default"
              data-toggle="tooltip"
              data-placement="top"
              title="Add reaction"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()

                const existingTags = noteReactions.find((tuple) => tuple[0] === tag)?.[1]
                addOrRemoveTag(tag, existingTags)
              }}
            >
              {tag}
            </button>
          </div>
        ))}
      </div>
    </div>
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

export default ChatReply
