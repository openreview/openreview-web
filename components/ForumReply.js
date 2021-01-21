import { useContext } from 'react'
import NoteReaders from './NoteReaders'
import NoteContent from './NoteContent'
import ForumReplyContext from './ForumReplyContext'
import { prettyId, buildNoteTitle, forumDate } from '../lib/utils'

export default function ForumReply({
  note, replies, collapsed, setCollapsed, contentExpanded, hidden,
}) {
  const { displayOptionsMap } = useContext(ForumReplyContext)
  const allRepliesHidden = replies.every(childNote => displayOptionsMap[childNote.id].hidden)

  return (
    <div className="note" style={hidden && allRepliesHidden ? { display: 'none' } : {}}>
      <button type="button" className="btn btn-link collapse-link" onClick={e => setCollapsed(!collapsed)}>
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

      {!collapsed && replies?.length > 0 && (
        <div className="note-replies">
          {replies.map((childNote) => {
            const options = displayOptionsMap[childNote.id]
            return (
              <div key={childNote.id} className="note" style={options.hidden ? { display: 'none' } : {}}>
                <ReplyTitle note={childNote} collapsed={options.collapsed} />

                {!collapsed && (
                  <NoteContentCollapsible
                    id={childNote.id}
                    content={childNote.content}
                    invitation={childNote.details?.originalInvitation || childNote.details?.invitation}
                    collapsed={options.contentExpanded}
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
      </h4>
      <div className="subheading">
        <span className="invitation">
          {prettyId(invitation, true)}
        </span>
        &bull;
        <span className="signatures">
          {signatures.map(signature => prettyId(signature, true)).join(', ')}
        </span>
        &bull;
        <span className="created-date">{forumDate(note.cdate, note.tcdate, note.mdate)}</span>
        &bull;
        <span className="readers"><NoteReaders readers={note.readers} /></span>
      </div>
    </div>
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
