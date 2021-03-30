/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */

export default function EditEdgeDropdown(props) {
  const defaultOption = props.default ? props.default : props.options[0]
  const showTrashButton = props.existingEdge?.writers?.length !== 0

  if (!props.existingEdge && !props.canAddEdge) return null
  return (
    <div className="edit-controls full-width">
      <label>
        {props.label}
        :
      </label>
      <div className="btn-group edit-edge-dropdown">
        <button
          className="btn btn-default btn-xs btn-link dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          onClick={e => e.stopPropagation()}
        >
          <span className="edge-weight">{props.selected}</span>
          <span className="caret" />
        </button>
        <ul className="dropdown-menu">
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
