import NoteTitle from './NoteTitle'
import NoteAuthors from './NoteAuthors'
import NoteReaders from './NoteReaders'
import NoteContent from './NoteContent'
import Icon from './Icon'
import { prettyId, forumDate, inflect } from '../lib/utils'

const Note = ({ note, invitation, options }) => (
  <div className="note">
    <NoteTitle
      id={note.id}
      forum={note.forum}
      invitation={note.invitation}
      content={note.content}
      signatures={note.signatures}
      options={options}
    />

    {(note.forumContent && note.id !== note.forum) && (
      <div className="note-parent-title">
        <Icon name="share-alt" />
        <strong>
          {note.forumContent.title || 'No Title'}
        </strong>
      </div>
    )}

    <div className="note-authors">
      <NoteAuthors
        authors={note.content.authors}
        authorIds={note.content.authorids}
        signatures={note.signatures}
        original={note.details?.original}
      />
    </div>

    <ul className="note-meta-info list-inline">
      <li>{forumDate(note.cdate, note.tcdate, note.mdate, note.tmdate, note.content.year)}</li>
      <li>{note.content.venue ? note.content.venue : prettyId(note.invitation)}</li>
      {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
      <li className="readers">Readers: <NoteReaders readers={note.readers} /></li>
      {options.replyCount && (
        <li>{inflect(note.details.replyCount, 'Reply', 'Replies', true)}</li>
      )}
    </ul>

    {options.showContents && (!note.ddate || note.ddate > Date.now()) && (
      <NoteContent
        id={note.id}
        content={note.content}
        invitation={note.details?.originalInvitation || note.details?.invitation || invitation}
        omit={options.omitFields}
        isReference={options.isReference}
      />
    )}
  </div>
)

export default Note
