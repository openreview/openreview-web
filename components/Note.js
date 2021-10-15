import NoteTitle, { NoteTitleV2 } from './NoteTitle'
import NoteAuthors, { NoteAuthorsV2 } from './NoteAuthors'
import NoteReaders from './NoteReaders'
import NoteContent, { NoteContentV2 } from './NoteContent'
import Icon from './Icon'
import { prettyId, forumDate, inflect } from '../lib/utils'

const Note = ({ note, invitation, options }) => {
  const privatelyRevealed = options.showPrivateIcon && !note.readers.includes('everyone')

  return (
    <div className={`note ${privatelyRevealed ? 'note-private' : ''}`}>
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
        <li>
          {note.content.venue ? note.content.venue : prettyId(note.invitation)}
          {privatelyRevealed && <Icon name="eye-close" extraClasses="note-visible-icon" tooltip="Privately revealed to you" />}
        </li>
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
}

export const NoteV2 = ({ note, options }) => {
  const privatelyRevealed = options.showPrivateIcon && !note.readers.includes('everyone')
  return (
    <div className={`note ${privatelyRevealed ? 'note-private' : ''} ${options.extraClasses}`}>
      <NoteTitleV2
        id={note.id}
        forum={note.forum}
        invitation={note.invitations[0]}
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
        <NoteAuthorsV2
          authors={note.content.authors}
          authorIds={note.content.authorids}
          signatures={note.signatures}
          noteReaders={note.readers}
        />
      </div>

      <ul className="note-meta-info list-inline">
        <li>{forumDate(note.cdate, note.tcdate, note.mdate, note.tmdate, note.content.year?.value)}</li>
        <li>
          {note.content.venue?.value ? note.content.venue.value : prettyId(note.invitations[0])}
          {privatelyRevealed && <Icon name="eye-close" extraClasses="note-visible-icon" tooltip="Privately revealed to you" />}
        </li>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <li className="readers">Readers: <NoteReaders readers={note.readers} /></li>
        {options.replyCount && (
          <li>{inflect(note.details.replyCount, 'Reply', 'Replies', true)}</li>
        )}
      </ul>

      {options.showContents && (!note.ddate || note.ddate > Date.now()) && (
        <NoteContentV2
          id={note.id}
          content={note.content}
          omit={options.omitFields}
          isEdit={options.isReference}
          presentation={note.details?.presentation}
          noteReaders={note.readers?.sort()}
        />
      )}
    </div>
  )
}

export default Note
