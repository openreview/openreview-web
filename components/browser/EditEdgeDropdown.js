/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */

export default function EditEdgeDropdown(props) {
  const defaultOption = props.default ? props.default : props.options[0]

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
        >
          <span className="edge-weight">{props.isAssigned ? props.selected : defaultOption}</span>
          <span className="caret" />
        </button>
        <ul className="dropdown-menu">
          {props.options && props.options.map(option => (
            <li key={option}>
              <a href="#" onClick={e => props.addEdge(e, { weight: option })}>{option}</a>
            </li>
          ))}
        </ul>
      </div>
      {props.isAssigned && (
        <a href="#" className="edit-edge-remove" onClick={props.removeEdge}>
          <span className="glyphicon glyphicon-trash" />
        </a>
      )}
    </div>
  )
}
