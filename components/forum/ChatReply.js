import { useContext, useState } from 'react'
import Link from 'next/link'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { NoteContentV2, NoteContentValue } from '../NoteContent'
import useUser from '../../hooks/useUser'
import { prettyId, prettyInvitationId, prettyContentValue, forumDate } from '../../lib/utils'
import { getInvitationColors } from '../../lib/forum-utils'
import Icon from '../Icon'

import styles from '../../styles/components/ChatReply.module.scss'

dayjs.extend(localizedFormat)

export default function ChatReply({ note, parentId, isReplyNote, setChatReplyNote, updateNote }) {
  if (!note) return null

  const isChatNote = Object.keys(note.content).length === 1 && note.content.message
  const presentation = note.details?.presentation

  return (
    <li className={`left clearfix ${styles.container} ${isReplyNote ? styles.active : ''}`}>
      {/*
      <span className="chat-img pull-left">
        <img
          src="https://via.placeholder.com/50x50"
          alt="Profile Picture"
          className="img-circle"
        />
      </span>
      */}

      <div className="chat-body clearfix">
        <div className="parent-title">
          {/* <h5 onClick={() => {}}>
            <Icon name="share-alt" /> Replying to{' '}
            {truncate(note.parentTitle, {
              length: 135,
              omission: '...',
              separator: ' ',
            })}
          </h5> */}
        </div>

        <div className="header">
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
            <button className="btn btn-link" onClick={() => { setChatReplyNote(note) }}>
              <Icon name="share-alt" /> Reply
            </button>
          </li>
          <li>
            <button className="btn btn-link" onClick={() => {}}>
              <Icon name="flag" /> Flag
            </button>
          </li>
        </ul>
        <ul className="list-inline pull-right">
          <li>
            <button className="btn btn-link" onClick={() => {}}>
              <Icon name="option-horizontal" /> More
            </button>
          </li>
        </ul>
      </div>
    </li>
  )
}
