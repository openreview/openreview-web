import Note, { NoteV2 } from './Note'
const RadioButtonGroup = ({ options, selectedBidOption, updateBidOption }) => {
  return (
    <div
      className="tag-widget edge-widget"
      data-type="radio"
      data-id=""
      data-invitation-id="NeurIPS.cc/2022/Conference/Reviewers/-/Bid"
    >
      <label>Bid:</label>

      <div className="btn-group btn-group-xs" role="group" data-toggle="buttons">
        {options.map((option) => {
          return (
            <label
              key={option}
              className={`btn btn-default radio-toggle${
                option === selectedBidOption ? ' active' : ''
              }`}
              onClick={() => {
                updateBidOption(option)
              }}
            >
              <input type="radio" name="tag-options" autoComplete="off" /> {option}
            </label>
          )
        })}
      </div>
    </div>
  )
}

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
  displayOptions,
  updateBidOption,
}) => (
  <ul className="list-unstyled submissions-list">
    {notes.map((note) => {
      const selectedBidOption = bidEdges?.find((p) => p.head === note.id)?.label
      return (
        <li key={note.id}>
          {note.version === 2 ? (
            <>
              <NoteV2 note={note} options={displayOptions} />
              <RadioButtonGroup
                options={bidOptions}
                selectedBidOption={selectedBidOption}
                updateBidOption={(updatedOption) => updateBidOption(note, updatedOption)}
              />
            </>
          ) : (
            <>
              <Note note={note} options={displayOptions} />
              <RadioButtonGroup
                options={bidOptions}
                selectedBidOption={selectedBidOption}
                updateBidOption={(updatedOption) => updateBidOption(note, updatedOption)}
              />
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
