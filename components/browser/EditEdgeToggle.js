import Icon from '../Icon'

// eslint-disable-next-line object-curly-newline
export default function EditEdgeToggle({
  addEdge, removeEdge, existingEdge, canAddEdge, editEdgeTemplate, isInviteInvitation, shouldDisableControl = false,
}) {
  const addOrRemoveEdge = (e) => {
    if (existingEdge) {
      e.stopPropagation()
      removeEdge()
    } else {
      addEdge({
        e,
        existingEdge,
        editEdgeTemplate,
        updatedEdgeFields: isInviteInvitation ? undefined : { weight: 1 }, // invite invitation weight remain as 0
      })
    }
  }

  const getLabel = () => {
    if (existingEdge?.label) return `${existingEdge.name}: ${existingEdge.label}${existingEdge?.weight ? `,${existingEdge.weight}` : ''}`
    if (editEdgeTemplate?.label) return `${editEdgeTemplate.name}: ${editEdgeTemplate.label}${existingEdge?.weight ? `,${existingEdge.weight}` : ''}`
    return `${editEdgeTemplate?.name}: ${existingEdge?.weight ?? ''}`
  }

  const getTooltip = () => {
    if (isInviteInvitation) {
      if (existingEdge) return 'Cancel Invite'
      return 'Invite Reviewer'
    }
    if (existingEdge) return 'Delete Reviewer Assignment'
    return 'Assign Reviewer'
  }

  if (!existingEdge && !canAddEdge) return null

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
        title={getTooltip()}
        disabled={shouldDisableControl}
      >
        <Icon name={existingEdge ? 'trash' : 'thumbs-up'} extraClasses={shouldDisableControl ? 'span-disabled' : null} />
      </button>
    </div>
  )
}
