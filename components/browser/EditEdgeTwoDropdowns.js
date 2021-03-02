/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */

import { useState } from 'react'

export default function EditEdgeTwoDropdowns(props) {
  const defaultOption = props.default ? props.default : props.options[0]
  const [label, setLabel] = useState(props.selected1)
  const [weight, setWeight] = useState(props.selected2)

  const labelOptions = props.editInvitation.label?.[props.controlType]
  const weightOptions = props.editInvitation.weight?.[props.controlType]

  const isLabelRequired = props.editInvitation.label?.required
  const isWeightRequired = props.editInvitation.weight?.required

  const enableAddEdge = (!isLabelRequired || label) && (!isWeightRequired || weight)
  const addEdge = (e) => {
    // add new edge or save existing edge
    e.stopPropagation()
    props.addEdge({
      e,
      existingEdge: props.existingEdge,
      editEdgeTemplate: props.editEdgeTemplate,
      updatedEdgeFields: { label: label ?? props.editEdgeTemplate.label, weight },
    })
  }

  if (!props.existingEdge && !props.canAddEdge) return null
  return (
    <div className="edit-controls full-width d-flex">
      <div className="d-flex">
        <label>
          {props.editInvitation.name}
          :
        </label>
        <div className="btn-group edit-edge-dropdown">
          <button
            className="btn btn-default btn-xs btn-link dropdown-toggle flex-button"
            type="button"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
            onClick={e => e.stopPropagation()}
          >
            <span className="two-dropdowns-edge-label">{label ?? defaultOption}</span>
            <span className="caret" />
          </button>
          <ul className="dropdown-menu">
            {labelOptions && labelOptions.map(option => (
              <li key={option}>
                <a href="#" onClick={() => setLabel(option)}>{option}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="d-flex ml-1">
        <label>
          {props.label2}
          :
        </label>
        <div className="btn-group edit-edge-dropdown">
          <button
            className="btn btn-default btn-xs btn-link dropdown-toggle flex-button"
            type="button"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
            onClick={e => e.stopPropagation()}
          >
            <span className="two-dropdowns-edge-weight">{weight ?? defaultOption}</span>
            <span className="caret" />
          </button>
          <ul className="dropdown-menu">
            {weightOptions && weightOptions.map(option => (
              <li key={option}>
                <a href="#" onClick={() => setWeight(option)}>{option}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {props.edgeEdgeExist ? (
        <>
          <a href="#" className="ml-1" onClick={addEdge}>
            <span className="glyphicon glyphicon-floppy-disk" />
          </a>
          <a href="#" className="ml-1" onClick={props.removeEdge}>
            <span className="glyphicon glyphicon-trash" />
          </a>
        </>
      ) : enableAddEdge && (
        <a href="#" className="ml-1" onClick={addEdge}>
          <span className="glyphicon glyphicon-plus" />
        </a>
      )}
    </div>
  )
}
