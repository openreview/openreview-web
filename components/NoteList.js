import Note from './Note'

const NoteList = ({ notes, displayOptions }) => (
  <ul className="list-unstyled submissions-list">
    {notes.map(note => (
      <li key={note.id}>
        <Note note={note} options={displayOptions} />
      </li>
    ))}

    {notes.length === 0 && (
      <li><p className="empty-message">{displayOptions.emptyMessage}</p></li>
    )}
  </ul>
)

export default NoteList
