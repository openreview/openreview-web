/* eslint-disable jsx-a11y/anchor-is-valid */
/* globals $: false */

import { getTooltipTitle } from '../../lib/edge-utils'

export default function EditEdgeDropdown(props) {
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
    <div className="edit-controls full-width">
      <label onMouseEnter={(e) => handleHover(e.target)}>{props.label}:</label>
      <div className="btn-group edit-edge-dropdown">
        <button
          className="btn btn-default btn-xs btn-link dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <span className="edge-weight">
            {props.selected ??
              props.editEdgeTemplate?.defaultWeight ??
              props.editEdgeTemplate?.defaultLabel}
          </span>
          <span className="caret" />
          <span className="sr-only">Toggle dropdown menu</span>
        </button>
        <ul className="dropdown-menu">
          {props.options &&
            props.options.map((option) => (
              <li key={option}>
                <a
                  href="#"
                  onClick={(e) =>
                    props.addEdge({
                      e,
                      existingEdge: props.existingEdge,
                      editEdgeTemplate: props.editEdgeTemplate,
                      updatedEdgeFields: { [props.type]: option },
                    })
                  }
                >
                  {option}
                </a>
              </li>
            ))}
        </ul>
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
          <span className="sr-only">Delete edge</span>
        </a>
      )}
    </div>
  )
}
