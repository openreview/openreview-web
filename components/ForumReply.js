import NoteReaders from './NoteReaders'
import NoteContent from './NoteContent'
import { prettyId, buildNoteTitle, forumDate } from '../lib/utils'

export default function ForumReply({ note }) {
  return (
    <div className="note">
      <ReplyTitle note={note} />

      <NoteContentCollapsible
        id={note.id}
        content={note.content}
        invitation={note.details?.originalInvitation || note.details?.invitation}
      />

      {note.replies && (
        <div className="note-replies">
          {note.replies.map(childNote => (
            <div className="note">
              <ReplyTitle note={childNote} />

              <NoteContentCollapsible
                id={childNote.id}
                content={childNote.content}
                invitation={childNote.details?.originalInvitation || childNote.details?.invitation}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReplyTitle({ note }) {
  const {
    id, invitation, content, signatures,
  } = note
  return (
    <h4>
      {content.title ? (
        <>
          <strong>{content.title}</strong>
          &bull;
          <span className="signatures">
            by
            {' '}
            {signatures.map(signature => prettyId(signature, true)).join(', ')}
          </span>
        </>
      ) : (
        <span>{buildNoteTitle(invitation, signatures)}</span>
      )}
      &bull;
      <span className="created-date">{forumDate(note.cdate, note.tcdate, note.mdate)}</span>
      &bull;
      <span className="readers"><NoteReaders readers={note.readers} /></span>
    </h4>
  )
}

function NoteContentCollapsible({ id, content, invitation }) {
  return (
    <div
      role="button"
      tabIndex="0"
      className="note-content-container collapsed"
      onClick={e => e.currentTarget.classList.toggle('collapsed')}
    >
      <NoteContent
        id={id}
        content={content}
        invitation={invitation}
      />
      <div className="gradient-overlay" />
    </div>
  )
}
