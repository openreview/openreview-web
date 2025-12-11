import NoteTitle, { NoteTitleV2 } from './NoteTitle'
import NoteAuthors, { NoteAuthorsV2 } from './NoteAuthors'
import NoteReaders from './NoteReaders'
import NoteContent, { NoteContentV2 } from './NoteContent'
import Icon from './Icon'
import { prettyId, forumDate, inflect } from '../lib/utils'
import Collapse from './Collapse'
import ClientForumDate from './ClientForumDate'

const Note = ({ note, invitation, options }) => {
  const privatelyRevealed = options.showPrivateIcon && !note.readers.includes('everyone')

  const renderNoteContent = () => {
    if (!options.showContents || (note.ddate && note.ddate <= Date.now())) return null

    if (options.collapse) {
      return (
        <Collapse showLabel="Show details" hideLabel="Hide details" indent={true}>
          <NoteContent
            id={note.id}
            content={note.content}
            invitation={
              note.details?.originalInvitation || note.details?.invitation || invitation
            }
            omit={options.omitFields}
            isReference={options.isReference}
          />
        </Collapse>
      )
    }

    return (
      <NoteContent
        id={note.id}
        content={note.content}
        invitation={note.details?.originalInvitation || note.details?.invitation || invitation}
        omit={options.omitFields}
        isReference={options.isReference}
      />
    )
  }

  return (
    <div
      className={`note ${privatelyRevealed ? 'note-private' : ''} ${
        options.unlinkedPublications?.includes(note.id) ? 'unlinked-publication' : ''
      }`}
    >
      <NoteTitle
        id={note.id}
        forum={note.forum}
        invitation={note.invitation}
        content={note.content}
        signatures={note.signatures}
        options={{
          ...options,
          isUnlinked: options.unlinkedPublications?.includes(note.id),
        }}
      />

      {note.forumContent && note.id !== note.forum && (
        <div className="note-parent-title">
          <Icon name="share-alt" />
          <strong>{note.forumContent.title || 'No Title'}</strong>
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
        <li>
          {forumDate(
            note.cdate,
            note.tcdate,
            note.mdate,
            note.tmdate,
            note.content.year,
            note.pdate
          )}
        </li>
        <li>
          {note.content.venue ? note.content.venue : prettyId(note.invitation)}
          {privatelyRevealed && (
            <Icon
              name="eye-close"
              extraClasses="note-visible-icon"
              tooltip="Privately revealed to you"
            />
          )}
        </li>
        <li className="readers">
          Readers: <NoteReaders readers={note.readers} />
        </li>
        {options.replyCount && typeof note.details?.replyCount === 'number' && (
          <li>{inflect(note.details?.replyCount, 'Reply', 'Replies', true)}</li>
        )}
      </ul>

      {renderNoteContent()}
    </div>
  )
}

export const NoteV2 = ({ note, options }) => {
  const privatelyRevealed = options.showPrivateIcon && !note.readers.includes('everyone')
  const omitContentFields = ['pdf', 'html'].concat(options.omitFields ?? [])

  const renderNoteContent = () => {
    if (!options.showContents || (note.ddate && note.ddate <= Date.now())) return null
    if (options.collapse) {
      return (
        <Collapse showLabel="Show details" hideLabel="Hide details" indent={true}>
          <NoteContentV2
            id={note.id}
            content={note.content ?? {}}
            omit={omitContentFields}
            isEdit={options.isReference}
            presentation={note.details?.presentation}
            noteReaders={note.readers?.sort()}
          />
        </Collapse>
      )
    }
    return (
      <NoteContentV2
        id={note.id}
        content={note.content ?? {}}
        omit={omitContentFields}
        isEdit={options.isReference}
        presentation={note.details?.presentation}
        noteReaders={note.readers?.sort()}
      />
    )
  }

  return (
    <div
      className={`note ${privatelyRevealed ? 'note-private' : ''} ${
        options.unlinkedPublications?.includes(note.id) ? 'unlinked-publication' : ''
      } ${options.extraClasses}`}
    >
      {options.customTitle ? (
        options.customTitle(note)
      ) : (
        <NoteTitleV2
          id={note.id}
          forum={note.forum}
          invitation={note.invitations[0]}
          content={note.content ?? {}}
          signatures={note.signatures}
          options={options}
        />
      )}

      {note.forumContent && note.id !== note.forum && (
        <div className="note-parent-title">
          <Icon name="share-alt" />
          <strong>{note.forumContent.title?.value || 'No Title'}</strong>
        </div>
      )}

      <div className="note-authors">
        {options.customAuthor ? (
          options.customAuthor(note)
        ) : (
          <NoteAuthorsV2
            authors={note.content?.authors}
            authorIds={note.content?.authorids}
            signatures={note.signatures}
            noteReaders={note.readers}
          />
        )}
      </div>

      {options.customMetaInfo ? (
        options.customMetaInfo(note)
      ) : (
        <ul className="note-meta-info list-inline">
          <li>
            {options.clientRenderingOnly ? (
              <ClientForumDate note={note} />
            ) : (
              forumDate(
                note.cdate,
                note.tcdate,
                note.mdate,
                note.tmdate,
                note.content?.year?.value,
                note.pdate
              )
            )}
          </li>
          <li>
            {note.note || !note.content?.venue?.value // note.note indicates this is an edit
              ? prettyId(note.invitations[0])
              : note.content?.venue?.value}
            {privatelyRevealed && (
              <Icon
                name="eye-open"
                extraClasses="note-visible-icon ml-2"
                tooltip="Privately revealed to you"
              />
            )}
          </li>
          <li className="readers">
            Readers: <NoteReaders readers={note.readers} />
          </li>
          {options.replyCount && typeof note.details?.replyCount === 'number' && (
            <li>{inflect(note.details?.replyCount, 'Reply', 'Replies', true)}</li>
          )}
        </ul>
      )}

      {renderNoteContent()}
    </div>
  )
}

export default Note
