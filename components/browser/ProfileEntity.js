/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals Webfield: false */
/* globals $: false */

import { useContext } from 'react'
import EdgeBrowserContext from './EdgeBrowserContext'
import EditEdgeDropdown from './EditEdgeDropdown'
import EditEdgeToggle from './EditEdgeToggle'
import EditEdgeTwoDropdowns from './EditEdgeTwoDropdowns'
import ScoresList from './ScoresList'

export default function ProfileEntity(props) {
  if (!props.profile || !props.profile.content) {
    return null
  }

  // Format profile data for rendering
  const {
    id,
    content,
    editEdge,
  } = props.profile
  const { editInvitation } = useContext(EdgeBrowserContext)

  const metadata = props.profile.metadata || {}
  const extraClasses = []
  if (metadata.isAssigned || metadata.isUserAssigned) extraClasses.push('is-assigned')
  if (metadata.hasConflict) extraClasses.push('has-conflict')
  if (metadata.isHidden) extraClasses.push('is-hidden')
  if (editEdge) extraClasses.push('is-editable')
  if (props.isSelected) extraClasses.push('is-selected')

  // Event handlers
  const handleClick = (e) => {
    if (!props.canTraverse) return

    if (e.target.tagName === 'A' && e.target.className !== 'show-assignments') {
      return
    }

    e.preventDefault()
    props.setSelectedItemId(id)
    props.addNewColumn(id)
  }

  const removeEdge = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Delete existing edge
    // TODO: allow ProfileItems to be head objects
    Webfield.post('/edges', { tail: id, ddate: Date.now(), ...editEdge })
      .then(res => props.removeEdgeFromEntity(id, res))
  }

  const addEdge = (e, updatedEdgeFields = {}) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Create new edge
    Webfield.post('/edges', {
      tail: id,
      ddate: null,
      ...editEdge,
      ...updatedEdgeFields,
    })
      .then(res => props.addEdgeToEntity(id, res))
  }

  const handleHover = (target) => {
    if (!editEdge?.id) return
    $(target).tooltip({ title: `Edited by ${editEdge.signatures?.join(',')}`, trigger: 'hover' })
  }

  // TODO: determine what widget to use based on the reply object of the edit invitation
  let editEdgeWidget = null
  // #region existing
  // switch (editInvitation.name) {
  //   case 'Paper Assignment':
  //     editEdgeWidget = (
  //       <EditEdgeToggle
  //         isAssigned={metadata.isAssigned}
  //         addEdge={addEdge}
  //         removeEdge={removeEdge}
  //       />
  //     )
  //     break

  //   case 'Recommendation':
  //     editEdgeWidget = (
  //       <EditEdgeDropdown
  //         label={editInvitation.name}
  //         isAssigned={metadata.isAssigned}
  //         options={editInvitation.weight['value-dropdown']}
  //         selected={editEdge.weight}
  //         default=" "
  //         addEdge={addEdge}
  //         removeEdge={removeEdge}
  //       />
  //     )
  //     break

  //   default:
  //     break
  // }
  // #endregion

  // #region updated
  const editEdgeDropdown = (type, controlType) => (
    <EditEdgeDropdown
      label={editInvitation.name}
      isAssigned={metadata.isAssigned}
      options={editInvitation?.[type]?.[controlType]}
      selected={editEdge[type]}
      default=" "
      addEdge={addEdge}
      removeEdge={removeEdge}
      type={type} // label or weight
    />
  )

  const editEdgeToggle = (
    <EditEdgeToggle
      isAssigned={metadata.isAssigned}
      addEdge={addEdge}
      removeEdge={removeEdge}
    />
  )

  const editEdgeTwoDropdowns = controlType => (
    <EditEdgeTwoDropdowns
      editInvitation={editInvitation}
      label2="weight"
      edgeEdgeExist={editEdge.id}
      selected1={editEdge.id && editEdge.label}
      selected2={editEdge.id && editEdge.weight}
      controlType={controlType}
      default=" "
      addEdge={addEdge}
      removeEdge={removeEdge}
      defaultLabel={editEdge.label}
    />
  )

  if (editEdge && editEdge.invitation === editInvitation.id) {
    const labelRadio = editInvitation.label?.['value-radio']
    const labelDropdown = editInvitation.label?.['value-dropdown']
    const weightRadio = editInvitation.weight?.['value-radio']
    const weightDropdown = editInvitation.weight?.['value-dropdown']

    const shouldRenderTwoRadio = labelRadio && weightRadio
    const shouldRenderTwoDropdown = labelDropdown && weightDropdown
    const shouldRenderLabelRadio = labelRadio && !editInvitation.weight
    const shouldRenderWeightRadio = weightRadio && !editInvitation.label
    const shouldRenderLabelDropdown = labelDropdown && !editInvitation.weight
    const shouldRenderWeightDropdown = weightDropdown && !editInvitation.label

    if (shouldRenderTwoRadio) {
      editEdgeWidget = 'two radio button lists'
    } else if (shouldRenderTwoDropdown) {
      editEdgeWidget = 'two dropdowns'
    } else if (shouldRenderLabelRadio) {
      editEdgeWidget = editEdgeDropdown('label', 'value-radio') // for now treat radio the same as dropdown
    } else if (shouldRenderWeightRadio) {
      editEdgeWidget = editEdgeDropdown('weight', 'value-radio') // for now treat radio the same as dropdown
    } else if (shouldRenderLabelDropdown) {
      editEdgeWidget = editEdgeDropdown('label', 'value-dropdown')
    } else if (shouldRenderWeightDropdown) {
      // editEdgeWidget = editEdgeDropdown('weight', 'value-dropdown')
      editEdgeWidget = editEdgeTwoDropdowns('value-dropdown')
    } else {
      editEdgeWidget = editEdgeToggle
    }
  }
  // #endregion

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li className={`entry entry-reviewer ${extraClasses.join(' ')}`} onClick={handleClick} onMouseEnter={e => handleHover(e.currentTarget)}>
      <div className="reviewer-heading">
        <h3>
          <a href={`/profile?id=${id}`} title={`Profile for ${id}`} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            {content.name.first} {content.name.middle} {content.name.last}
          </a>
        </h3>

        <p>{content.title}</p>
      </div>

      {editEdgeWidget}

      <ScoresList edges={props.profile.browseEdges} />

      <div className="action-links">
        <ul className="list-unstyled text-right">
          <li>
            {props.canTraverse ? (
              <a href="#" className="show-assignments">
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                {props.traverseLabel} ({props.profile.traverseEdgesCount}) &raquo;
              </a>
            ) : (
              <>
                <span>{`${props.traverseLabel}:`}</span>
                {' '}
                <span>{props.profile.traverseEdgesCount}</span>
              </>
            )}
          </li>
        </ul>
      </div>
    </li>
  )
}
