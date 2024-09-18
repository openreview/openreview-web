/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals $: false */

import { useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash'
import { getTooltipTitle } from '../../lib/edge-utils'
import LoadingSpinner from '../LoadingSpinner'

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
    debounce((e) => {
      setIsLoading(true)
      addEdge({
        e,
        existingEdge: existingEdge,
        editEdgeTemplate: editEdgeTemplate,
        updatedEdgeFields: { [type]: Number(e.target.value) },
      })
    }, 500),
    [existingEdge]
  )

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
            immediateValue ?? editEdgeTemplate?.defaultWeight ?? editEdgeTemplate?.defaultLabel
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
          <a
            href="#"
            className="edit-edge-remove"
            onClick={(e) => {
              e.stopPropagation()
              setIsLoading(true)
              removeEdge()
            }}
          >
            <span className="glyphicon glyphicon-trash" />
          </a>
        )}
      </div>
    </div>
  )
}

export default EditEdgeTextbox
