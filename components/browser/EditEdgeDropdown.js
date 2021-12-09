/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals $: false */

import { useState } from 'react'
import { getTooltipTitle } from '../../lib/edge-utils'

export default function EditEdgeDropdown(props) {
  const defaultOption = props.default ? props.default : props.options[0]
  const showTrashButton = props.existingEdge?.writers?.length !== 0
  const [showDropdown, setShowDropdown] = useState(false)

  const handleHover = (target) => {
    if (!props.existingEdge) return
    const title = getTooltipTitle(props.existingEdge)
    $(target).tooltip({
      title,
      trigger: 'hover',
      container: 'body',
    })
  }

  if (!props.existingEdge && !props.canAddEdge) return null
  return (
    <div className="edit-controls full-width">
      <label onMouseEnter={e => handleHover(e.target)}>
        {props.label}
        :
      </label>
      <div
        className="btn-group edit-edge-dropdown"
        onBlur={(e) => {
          if (e.currentTarget?.contains(e.relatedTarget)) return // clicked option
          setShowDropdown(false)
        }}>
        <button
          className="btn btn-default btn-xs btn-link"
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          onClick={(e) => { setShowDropdown(true); e.stopPropagation() }}
        >
          <span className="edge-weight">{props.selected ?? props.editEdgeTemplate?.defaultWeight}</span>
          <span className="caret" />
        </button>
        <ul className={`dropdown-menu${showDropdown ? ' show' : ''}`}>
          {props.options && props.options.map(option => (
            <li key={option}>
              <a
                href="#"
                onClick={e => props.addEdge({
                  e,
                  existingEdge: props.existingEdge,
                  editEdgeTemplate: props.editEdgeTemplate,
                  updatedEdgeFields: { [props.type]: option },
                })}
              >
                {option}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {props.existingEdge && showTrashButton && (
        <a href="#" className="edit-edge-remove" onClick={(e) => { e.stopPropagation(); props.removeEdge() }}>
          <span className="glyphicon glyphicon-trash" />
        </a>
      )}
    </div>
  )
}
