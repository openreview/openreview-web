/* globals $: false */
import { useState } from 'react'
import Icon from '../Icon'
import { getTooltipTitle } from '../../lib/edge-utils'

export default function EditEdgeToggle({
  addEdge,
  removeEdge,
  existingEdge,
  canAddEdge,
  editEdgeTemplate,
  isInviteInvitation,
  shouldDisableControl = false,
  disableControlReason,
}) {
  const [loading, setLoading] = useState(false)

  const addOrRemoveEdge = (e) => {
    if (shouldDisableControl) {
      e.stopPropagation()
      return
    }
    setLoading(true)
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

  const getExistingEdgeLabel = () => {
    if (existingEdge?.label) return `${existingEdge.name}: ${existingEdge.label}${existingEdge?.weight ? `,${existingEdge.weight}` : ''}`
    return `${existingEdge?.name}${existingEdge?.weight ? ` : ${existingEdge.weight}` : ''}`
  }

  const getNewEdgeLabel = () => {
    if (editEdgeTemplate?.label === 'Assign' || editEdgeTemplate?.name === 'Assign') return 'Assign'
    if (editEdgeTemplate?.label) return `${editEdgeTemplate.name}: ${editEdgeTemplate.label}${editEdgeTemplate?.weight ? `,${editEdgeTemplate.weight}` : ''}`
    return `${editEdgeTemplate?.name}${editEdgeTemplate?.weight ? ` : ${editEdgeTemplate.weight}` : ''}`
  }

  const handleLabelHover = (target) => {
    if (!existingEdge) return
    const title = getTooltipTitle(existingEdge)
    $(target).tooltip({
      title,
      trigger: 'hover',
      container: 'body',
    })
  }

  if (!existingEdge && !canAddEdge) return null

  return (() => {
    if (existingEdge) {
      return (
        <div className="edit-controls d-flex mt-1">
          <label className="edit-edge-toggle-description" onMouseEnter={e => handleLabelHover(e.target)}>{getExistingEdgeLabel()}</label>
          <button
            type="button"
            className={`btn btn-xs btn-default ml-1 edit-edge-toggle-btn ${(shouldDisableControl || loading) ? 'disable' : ''}`}
            title={shouldDisableControl ? disableControlReason : getExistingEdgeLabel()}
            onClick={addOrRemoveEdge}
            autoComplete="off"
          >
            <Icon name="trash" extraClasses={shouldDisableControl || loading ? 'span-disabled' : null} />
          </button>
        </div>
      )
    }

    return (
      <div className="edit-controls d-flex mt-1">
        <button
          type="button"
          className={`btn btn-xs btn-default edit-edge-toggle-btn ${(shouldDisableControl || loading) ? 'disable' : ''}`}
          title={shouldDisableControl ? disableControlReason : undefined}
          onClick={addOrRemoveEdge}
        >
          {getNewEdgeLabel()}
        </button>
      </div>
    )
  })()
}
