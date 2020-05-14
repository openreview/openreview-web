import NoteTitle from './NoteTitle'
import NoteAuthors from './NoteAuthors'
import NoteReaders from './NoteReaders'
import NoteContent from './NoteContent'
import { prettyId, forumDate, inflect } from '../lib/utils'

const Note = ({ note, options }) => (
  <div className="note">
    <NoteTitle
      id={note.id}
      forum={note.forum}
      invitation={note.invitation}
      content={note.content}
      signatures={note.signatures}
      options={options}
    />

    <div className="note-authors">
      <NoteAuthors
        authors={note.content.authors}
        authorIds={note.content.authorids}
        signatures={note.signatures}
        original={note.details && note.details.original}
      />
    </div>

    <ul className="note-meta-info list-inline">
      <li>{forumDate(note.cdate, note.tcdate, note.mdate, note.tmdate, note.content.year)}</li>
      <li>{note.content.venue ? note.content.venue : prettyId(note.invitation)}</li>
      {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
      <li>Readers: <NoteReaders readers={note.readers} /></li>
      {options.replyCount && (
        <li>{inflect(note.details.replyCount, 'Reply', 'Replies', true)}</li>
      )}
    </ul>

    {options.showContents && (
      <NoteContent content={note.content} />
    )}
  </div>
)

export default Note
