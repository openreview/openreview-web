import List from 'rc-virtual-list'
import { NoteV2 } from './Note'
import { BidRadioButtonGroup, BidScore } from './webfield/BidWidget'

// only work with v2 api
const NoteListWithBidWidget = ({
  notes,
  bidOptions,
  bidEdges,
  scoreEdges,
  displayOptions,
  updateBidOption,
  virtualList,
  bidUpdateStatus,
  showBidScore = true,
}) => {
  const renderNoteWithBidWidget = (note, selectedBidOption, scoreEdge) => (
    <div className="bid-container">
      <NoteV2 note={note} options={displayOptions} />
      <BidRadioButtonGroup
        label="Bid"
        options={bidOptions}
        selectedBidOption={selectedBidOption}
        updateBidOption={(updatedOption) => updateBidOption(note, updatedOption)}
        bidUpdateStatus={bidUpdateStatus}
      />
      {showBidScore && <BidScore scoreEdge={scoreEdge} />}
    </div>
  )

  if (virtualList) {
    return (
      <div className="submissions-list">
        <ul className="list-unstyled">
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
      </div>
    )
  }

  return (
    <div className="submissions-list">
      <ul className="list-unstyled">
        {notes.map((note) => {
          const selectedBidOption = bidEdges?.find((p) => p.head === note.id)?.label
          const scoreEdge = scoreEdges?.find((p) => p.head === note.id)

          return (
            <li key={note.id}>
              {renderNoteWithBidWidget(note, selectedBidOption, scoreEdge)}
            </li>
          )
        })}

        {notes.length === 0 && (
          <li>
            <p className="empty-message">{displayOptions.emptyMessage}</p>
          </li>
        )}
      </ul>
    </div>
  )
}

export default NoteListWithBidWidget
