import Note, { NoteV2 } from './Note'
import { BidRadioButtonGroup, TagText } from './webfield/BidTag'

const NoteList = ({ notes, displayOptions }) => (
  <ul className="list-unstyled submissions-list">
    {notes.map((note) => (
      <li key={note.id}>
        {note.version === 2 ? (
          <NoteV2 note={note} options={displayOptions} />
        ) : (
          <Note note={note} options={displayOptions} />
        )}
      </li>
    ))}

    {notes.length === 0 && (
      <li>
        <p className="empty-message">{displayOptions.emptyMessage}</p>
      </li>
    )}
  </ul>
)

export const NoteListWithBidTag = ({
  notes,
  bidOptions,
  bidEdges,
  scoreEdges,
  displayOptions,
  updateBidOption,
}) => (
  <ul className="list-unstyled submissions-list">
    {notes.map((note) => {
      const selectedBidOption = bidEdges?.find((p) => p.head === note.id)?.label
      const scoreEdge = scoreEdges?.find((p) => p.head === note.id)
      return (
        <li key={note.id}>
          {note.version === 2 ? (
            <>
              <NoteV2 note={note} options={displayOptions} />
              <BidRadioButtonGroup
                options={bidOptions}
                selectedBidOption={selectedBidOption}
                updateBidOption={(updatedOption) => updateBidOption(note, updatedOption)}
              />
              <TagText scoreEdge={scoreEdge} />
            </>
          ) : (
            <>
              <Note note={note} options={displayOptions} />
              <BidRadioButtonGroup
                options={bidOptions}
                selectedBidOption={selectedBidOption}
                updateBidOption={(updatedOption) => updateBidOption(note, updatedOption)}
              />
              <TagText scoreEdge={scoreEdge} />
            </>
          )}
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

export default NoteList
