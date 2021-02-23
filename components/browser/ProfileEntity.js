/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals Webfield: false */
/* globals $: false */

import { useContext, useEffect } from 'react'
import EdgeBrowserContext from './EdgeBrowserContext'
import EditEdgeDropdown from './EditEdgeDropdown'
import EditEdgeToggle from './EditEdgeToggle'
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
    e.preventDefault()
    e.stopPropagation()

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
    $(target).tooltip({ title: `Edited by ${editEdge.signatures?.join(',')}` })
  }

  // TODO: determine what widget to use based on the reply object of the edit invitation
  let editEdgeWidget = null
  if (editEdge && editEdge.invitation === editInvitation.id) {
    switch (editInvitation.name) {
      case 'Paper Assignment':
        editEdgeWidget = (
          <EditEdgeToggle
            isAssigned={metadata.isAssigned}
            addEdge={addEdge}
            removeEdge={removeEdge}
          />
        )
        break

      case 'Recommendation':
        editEdgeWidget = (
          <EditEdgeDropdown
            label={editInvitation.name}
            isAssigned={metadata.isAssigned}
            options={editInvitation.weight['value-dropdown']}
            selected={editEdge.weight}
            default=" "
            addEdge={addEdge}
            removeEdge={removeEdge}
          />
        )
        break

      default:
        break
    }
  }


  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li className={`entry entry-reviewer ${extraClasses.join(' ')}`} onClick={handleClick} onMouseEnter={e => handleHover(e.target)}>
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
