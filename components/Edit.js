import { forumDate, prettyId } from '../lib/utils'
import Icon from './Icon'
import { NoteAuthorsV2 } from './NoteAuthors'
import { NoteContentV2 } from './NoteContent'
import NoteReaders from './NoteReaders'
import { NoteTitleV2 } from './NoteTitle'

const Edit = ({ edit, options }) => {
  const privatelyRevealed = options.showPrivateIcon && !edit.readers.includes('everyone')
  return (
    <div className={`note ${privatelyRevealed ? 'note-private' : ''} ${options.extraClasses}`}>
      <NoteTitleV2
        id={edit.id}
        forum={edit.forum}
        invitation={edit.invitations[0]}
        content={edit.content ?? {}}
        signatures={edit.signatures}
        options={options}
      />

      {edit.forumContent && edit.id !== edit.forum && (
        <div className="note-parent-title">
          <Icon name="share-alt" />
          <strong>{edit.forumContent.title?.value || 'No Title'}</strong>
        </div>
      )}

      <div className="note-authors">
        <NoteAuthorsV2
          authors={edit.content?.authors}
          authorIds={edit.content?.authorids}
          signatures={edit.signatures}
          noteReaders={edit.readers}
        />
      </div>

      <ul className="note-meta-info list-inline">
        <li>
          {forumDate(
            edit.cdate,
            edit.tcdate,
            edit.mdate,
            edit.tmdate,
            edit.content?.year?.value
          )}
        </li>
        <li>
          {prettyId(edit.invitations[0])}
          {privatelyRevealed && (
            <Icon
              name="eye-open"
              extraClasses="note-visible-icon ml-2"
              tooltip="Privately revealed to you"
            />
          )}
        </li>
      </ul>
      <ul className="note-meta-info list-inline">
        <li className="readers">
          Edit readers: <NoteReaders readers={edit.readers} />
        </li>
        <li className="readers">
          Edit writers: <NoteReaders readers={edit.writers} />
        </li>
        <li className="readers">
          Edit signatures: <NoteReaders readers={edit.signatures} />
        </li>
      </ul>

      {options.showContents && (!edit.ddate || edit.ddate > Date.now()) && (
        <NoteContentV2
          id={edit.id}
          content={{
            ...edit?.note?.content,
            ...(edit?.note?.readers && { 'Note readers': { value: edit.note.readers } }),
            ...(edit?.note?.writers && { 'Note writers': { value: edit.note.writers } }),
            ...(edit?.note?.signatures && {
              'Note signatures': { value: edit.note.signatures },
            }),
          }}
          omit={options.omitFields}
          isEdit={options.isReference}
          presentation={edit.details?.presentation}
          noteReaders={edit.readers?.sort()}
        />
      )}
    </div>
  )
}

export default Edit
