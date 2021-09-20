const NamesButton = ({
  newRow, readonly, preferred, handleRemove, handleMakePreferred,
}) => {
  if (!newRow && readonly) {
    if (preferred) {
      return <span className="preferred hint">(Preferred Name)</span>
    }
    return <button type="button" className="btn preferred_button" onClick={handleMakePreferred}>Make Preferred</button>
  }
  return <button type="button" className="btn remove_button" onClick={handleRemove}>Remove</button>
}

export default NamesButton
