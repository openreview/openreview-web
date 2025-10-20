import { useState } from 'react'
import Note, { NoteV2 } from './Note'
import { NoteAuthorsV2 } from './NoteAuthors'
import { buildNoteTitle, buildNoteUrl, prettyId } from '../lib/utils'
import ClientForumDate from './ClientForumDate'
import Icon from './Icon'
import NoteReaders from './NoteReaders'
import { getImportSourceIcon } from '../lib/profiles'

const MultiSourceNote = ({ notes, displayOptions }) => {
  const [noteToShow, setNoteToShow] = useState(notes[0])
  const { id, forum, content, invitations, readers, signatures } = noteToShow
  const privatelyRevealed = !noteToShow?.readers?.includes('everyone')

  const sources = [
    'DBLP.org/-/Record',
    `${process.env.SUPER_USER}/Public_Article/ORCID.org/-/Record`,
  ].filter((p) => notes.some((q) => q.invitations.includes(p)))

  return (
    <div className="note">
      <h4>
        <a
          href={buildNoteUrl(id, forum, content, { referrer: displayOptions.referrer })}
          target="_blank"
          rel="nofollow noreferrer"
        >
          {content.title?.value || buildNoteTitle(invitations[0], signatures)}
        </a>
      </h4>
      <div className="note-authors">
        <NoteAuthorsV2
          authors={content?.authors}
          authorIds={content?.authorids}
          signatures={signatures}
          noteReaders={readers}
        />
      </div>
      {noteToShow && (
        <ul className="note-meta-info list-inline">
          <li>
            <ClientForumDate note={noteToShow} />
          </li>
          <li>
            {!noteToShow.content?.venue?.value
              ? prettyId(noteToShow.invitations[0])
              : noteToShow.content?.venue?.value}
            {privatelyRevealed && (
              <Icon
                name="eye-open"
                extraClasses="note-visible-icon ml-2"
                tooltip="Privately revealed to you"
              />
            )}
          </li>
          <li className="readers">
            Readers: <NoteReaders readers={noteToShow.readers} />
          </li>
        </ul>
      )}
      <div className="import-sources">
        {sources.map((source) => {
          const sourceNote = notes.find((note) => note.invitations.includes(source))
          const isActive = noteToShow?.id === sourceNote?.id
          return (
            <button
              key={source}
              type="button"
              onClick={() => setNoteToShow(sourceNote)}
              className={`import-source-button ${isActive ? 'active' : ''}`}
            >
              {getImportSourceIcon(source)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const SourceGroupedNoteList = ({ notes, displayOptions }) => {
  const groupedNotes = notes.reduce((prev, curr) => {
    if (
      curr.version !== 2 ||
      ![
        'DBLP.org/-/Record',
        `${process.env.SUPER_USER}/Public_Article/ORCID.org/-/Record`,
      ].some((p) => curr.invitations.includes(p))
    ) {
      // eslint-disable-next-line no-param-reassign
      prev[curr.id] = [curr]
      return prev
    }
    const title = curr.content.title.value
    const authors = curr.content.authors.value.join(',')
    const key = `${title}|${authors}`

    if (!prev[key]) {
      // eslint-disable-next-line no-param-reassign
      prev[key] = []
    }
    prev[key].push(curr)
    return prev
  }, {})

  return (
    <ul className="list-unstyled submissions-list">
      {Object.entries(groupedNotes).map(([paperHash, importedPapers]) => {
        if (importedPapers.length === 1) {
          const note = importedPapers[0]
          return (
            <li key={note.id}>
              {note.version === 2 ? (
                <NoteV2 note={note} options={displayOptions} />
              ) : (
                <Note note={note} options={displayOptions} />
              )}
            </li>
          )
        }

        return (
          <li key={paperHash}>
            <div className="note">
              <MultiSourceNote notes={importedPapers} displayOptions={displayOptions} />
            </div>
          </li>
        )
      })}

      {notes.length === 0 && (
        <li>
          <p className="empty-message">{displayOptions.emptyMessage}</p>
        </li>
      )}
    </ul>
  )
}

export default SourceGroupedNoteList
