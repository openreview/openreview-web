import List from 'rc-virtual-list'
import Note, { NoteV2 } from './Note'
import { BidRadioButtonGroup, BidScore } from './webfield/BidWidget'

const NoteListWithBidWidget = ({
  notes,
  bidOptions,
  bidEdges,
  scoreEdges,
  displayOptions,
  updateBidOption,
  virtualList,
  apiVersion,
  bidUpdateStatus,
}) => {
  const renderNoteWithBidWidget = (note, selectedBidOption, scoreEdge) => (
    <>
      {apiVersion === 2 ? ( // bid has no mixed notes from v1 and v2
        <NoteV2 note={note} options={displayOptions} />
      ) : (
        <Note note={note} options={displayOptions} />
      )}
      <BidRadioButtonGroup
        options={bidOptions}
        selectedBidOption={selectedBidOption}
        updateBidOption={(updatedOption) => updateBidOption(note, updatedOption)}
        bidUpdateStatus={bidUpdateStatus}
      />
      <BidScore scoreEdge={scoreEdge} />
    </>
  )

  if (virtualList) {
    return (
      <ul className="list-unstyled submissions-list">
        <List
          data={notes}
          height={notes.length === 0 ? 0 : window.innerHeight}
          itemHeight={135}
          itemKey="id"
        >
          {(note) => {
            const selectedBidOption = bidEdges?.find((p) => p.head === note.id)?.label
            const scoreEdge = scoreEdges?.find((p) => p.head === note.id)
            return renderNoteWithBidWidget(note, selectedBidOption, scoreEdge)
          }}
        </List>
        {notes.length === 0 && (
          <li>
            <p className="empty-message">{displayOptions.emptyMessage}</p>
          </li>
        )}
      </ul>
    )
  }

  return (
    <ul className="list-unstyled submissions-list">
      {notes.map((note) => {
        const selectedBidOption = bidEdges?.find((p) => p.head === note.id)?.label
        const scoreEdge = scoreEdges?.find((p) => p.head === note.id)

        return (
          <li key={note.id}>{renderNoteWithBidWidget(note, selectedBidOption, scoreEdge)}</li>
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

export default NoteListWithBidWidget
