/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals $: false */

import { getTooltipTitle } from '../../lib/edge-utils'

export default function EditEdgeTextbox(props) {
  const showTrashButton = props.existingEdge?.writers?.length !== 0

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
    <div
      className="edit-controls full-width"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <label onMouseEnter={(e) => handleHover(e.target)}>{props.label}:</label>
      <div className="btn-group edit-edge-textbox">
        <input
          type="text"
          className="form-control edit-edge-input"
          value={props.selected}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation()
            props.addEdge({
              e,
              existingEdge: props.existingEdge,
              editEdgeTemplate: props.editEdgeTemplate,
              updatedEdgeFields: { [props.type]: Number(e.target.value) },
            })
          }}
        />
      </div>
      {props.existingEdge && showTrashButton && (
        <a
          href="#"
          className="edit-edge-remove"
          onClick={(e) => {
            e.stopPropagation()
            props.removeEdge()
          }}
        >
          <span className="glyphicon glyphicon-trash" />
        </a>
      )}
    </div>
  )
}
