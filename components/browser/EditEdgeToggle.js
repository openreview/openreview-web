import Icon from '../Icon'

// eslint-disable-next-line object-curly-newline
export default function EditEdgeToggle({ addEdge, removeEdge, existingEdge, canAddEdge, editEdgeTemplate }) {
  const addOrRemoveEdge = (e) => {
    if (existingEdge) {
      e.stopPropagation()
      removeEdge()
    } else {
      addEdge({
        e,
        existingEdge,
        editEdgeTemplate,
        updatedEdgeFields: { weight: 1 },
      })
    }
  }

  if (!existingEdge && !canAddEdge) return null
  const getLabel = () => {
    const weight = existingEdge?.weight ? `, ${existingEdge.weight}` : ''
    const label = editEdgeTemplate.label ? editEdgeTemplate.label : '(NO LABEL)'
    return `${editEdgeTemplate.name}: ${label}${weight}`
  }

  return (
    <div className="edit-controls d-flex">
      <label className="edit-edge-toggle-description">{getLabel()}</label>
      <button
        type="button"
        className="btn btn-xs btn-default ml-1 edit-edge-toggle-btn"
        onClick={addOrRemoveEdge}
        autoComplete="off"
        data-tooltip="tooltip"
        data-placement="top"
        title={existingEdge ? 'Delete Reviewer Assignment' : 'Assign Reviewer'}
      >
        <Icon name={existingEdge ? 'trash' : 'thumbs-up'} />
      </button>
    </div>
  )
}
