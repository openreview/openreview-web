/* globals $: false */

import { useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash'
import { getTooltipTitle } from '../../lib/edge-utils'
import LoadingSpinner from '../LoadingSpinner'
import Icon from '../Icon'

const EditEdgeTextbox = ({
  existingEdge,
  canAddEdge,
  label,
  selected,
  addEdge,
  removeEdge,
  type,
  editEdgeTemplate,
}) => {
  const showTrashButton = existingEdge?.writers?.length !== 0
  const [isLoading, setIsLoading] = useState(false)
  const [immediateValue, setImmediateValue] = useState(null)

  const handleHover = (target) => {
    if (!existingEdge) return
    const title = getTooltipTitle(existingEdge)
    $(target).tooltip({
      title,
      trigger: 'hover',
      container: 'body',
    })
  }

  const delayedAddEdge = useCallback(
    debounce(async (e) => {
      setIsLoading(true)
      const result = await addEdge({
        e,
        existingEdge,
        editEdgeTemplate,
        updatedEdgeFields: { [type]: Number(e.target.value) },
      })
      setIsLoading(false)
      if (!result) setImmediateValue(selected)
    }, 500),
    [existingEdge]
  )

  const handleRemoveEdge = async (e) => {
    e.stopPropagation()
    setIsLoading(true)
    await removeEdge()
    setIsLoading(false)
  }

  useEffect(() => {
    setIsLoading(false)
    if (selected !== null && selected !== undefined) {
      setImmediateValue(selected)
    } else {
      setImmediateValue(null)
    }
  }, [existingEdge, canAddEdge])

  if (!existingEdge && !canAddEdge) return null
  return (
    <div
      key={editEdgeTemplate?.tail}
      className="edit-controls full-width"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <label onMouseEnter={(e) => handleHover(e.target)}>{label}:</label>
      <div className="btn-group edit-edge-textbox">
        <input
          type="text"
          className="form-control edit-edge-input"
          disabled={isLoading}
          value={
            immediateValue ??
            editEdgeTemplate?.defaultWeight ??
            editEdgeTemplate?.defaultLabel ??
            ''
          }
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation()
            setImmediateValue(e.target.value)
            delayedAddEdge(e)
          }}
        />
      </div>
      <div className="edit-edge-spinner">
        {isLoading && <LoadingSpinner inline text="" extraClass="spinner-small" />}
        {existingEdge && showTrashButton && (
          <button
            type="button"
            className={`btn btn-xs btn-default ml-1 edit-edge-toggle-btn ${
              isLoading ? 'disable' : ''
            }`}
            onClick={handleRemoveEdge}
            autoComplete="off"
          >
            <Icon name="trash" extraClasses={isLoading ? 'span-disabled' : null} />
          </button>
        )}
      </div>
    </div>
  )
}

export default EditEdgeTextbox
