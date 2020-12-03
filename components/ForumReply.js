import NoteReaders from './NoteReaders'
import NoteContent from './NoteContent'
import { prettyId, buildNoteTitle, forumDate } from '../lib/utils'

export default function ForumReply({ note, collapse, setCollapse }) {
  return (
    <div className="note">
      <button type="button" className="btn btn-link collapse-link" onClick={e => setCollapse(collapse === 0 ? 1 : 0)}>[–]</button>

      <ReplyTitle note={note} collapse={collapse} />

      {collapse > 0 && (
        <NoteContentCollapsible
          id={note.id}
          content={note.content}
          invitation={note.details?.originalInvitation || note.details?.invitation}
          collapsed={collapse === 1}
        />
      )}

      {note.replies && (
        <div className="note-replies">
          {note.replies.map(childNote => (
            <div className="note">
              <ReplyTitle note={childNote} collapse={collapse} />

              {collapse > 0 && (
                <NoteContentCollapsible
                  id={childNote.id}
                  content={childNote.content}
                  invitation={childNote.details?.originalInvitation || childNote.details?.invitation}
                  collapsed={collapse === 1}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReplyTitle({ note, collapse }) {
  const {
    id, invitation, content, signatures,
  } = note

  if (collapse === 0) {
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
