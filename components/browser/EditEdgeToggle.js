/* globals $: false */
import { useEffect, useState } from 'react'
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
  isTraverseEdge,
  traverseEdgeTemplate,
  traverseEdgesCount,
}) {
  const [loading, setLoading] = useState(false)

  const addOrRemoveEdge = async (e) => {
    if (shouldDisableControl) {
      e.stopPropagation()
      return
    }
    setLoading(true)
    if (existingEdge) {
      e.stopPropagation()
      await removeEdge()
    } else {
      await addEdge({
        e,
        existingEdge,
        editEdgeTemplate: isTraverseEdge ? traverseEdgeTemplate : editEdgeTemplate,
        updatedEdgeFields: isInviteInvitation ? undefined : { weight: 1 }, // invite invitation weight remain as 0
        isTraverseEdge,
      })
    }
    setLoading(false)
  }

  const getExistingEdgeLabel = () => {
    if (existingEdge?.label) return `${existingEdge.name}: ${existingEdge.label}${existingEdge?.weight ? `,${existingEdge.weight}` : ''}`
    return `${existingEdge?.name}${existingEdge?.weight ? ` : ${existingEdge.weight}` : ''}`
  }

  const getNewEdgeButtonText = () => {
    if (editEdgeTemplate?.label === 'Assign') return 'Assign'
    if (isTraverseEdge && traverseEdgeTemplate) return traverseEdgeTemplate.name
    return `${editEdgeTemplate?.name}`
  }

  const getNewEdgeLabel = () => {
    if (editEdgeTemplate?.label) {
      return `${editEdgeTemplate.label}${editEdgeTemplate?.weight ? `,${editEdgeTemplate.weight}` : ''}`
    }
    return null
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

  useEffect(() => {
    setLoading(false) // loading stays true when traverse is removed
  }, [traverseEdgesCount])

  if (!existingEdge && !canAddEdge) return null

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
      {getNewEdgeLabel() && <label className="edit-edge-toggle-description">{getNewEdgeLabel()}</label>}
      <button
        type="button"
        className={`btn btn-xs btn-default edit-edge-toggle-btn ${(shouldDisableControl || loading) ? 'disable' : ''}`}
        title={shouldDisableControl ? disableControlReason : undefined}
        onClick={addOrRemoveEdge}
      >
        {getNewEdgeButtonText()}
      </button>
    </div>
  )
}
