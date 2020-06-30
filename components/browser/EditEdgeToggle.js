import Icon from '../Icon'

export default function EditEdgeToggle({ isAssigned, addEdge, removeEdge }) {
  const addOrRemoveEdge = (e) => {
    if (isAssigned) {
      removeEdge(e)
    } else {
      addEdge(e, { weight: 1 })
    }
  }

  return (
    <div className="edit-controls">
      <button
        type="button"
        className="btn btn-xs btn-default"
        onClick={addOrRemoveEdge}
        autoComplete="off"
        data-tooltip="tooltip"
        data-placement="top"
        title={isAssigned ? 'Delete Reviewer Assignment' : 'Assign Reviewer'}
      >
        <Icon name={isAssigned ? 'trash' : 'thumbs-up'} />
      </button>
    </div>
  )
}
