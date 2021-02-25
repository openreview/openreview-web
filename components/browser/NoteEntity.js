/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals Webfield: false */
/* globals $: false */

import { useContext } from 'react'
import EdgeBrowserContext from './EdgeBrowserContext'
import EditEdgeDropdown from './EditEdgeDropdown'
import EditEdgeToggle from './EditEdgeToggle'
import NoteAuthors from './NoteAuthors'
import NoteContent from './NoteContent'
import ScoresList from './ScoresList'

export default function NoteEntity(props) {
  if (!props.note || !props.note.content) {
    return null
  }

  // Format note data for rendering
  const {
    id,
    forum,
    number,
    content,
    original,
    editEdge,
  } = props.note
  const { editInvitation } = useContext(EdgeBrowserContext)
  const title = content.title ? content.title : 'No Title'

  const metadata = props.note.metadata || {}
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
    $(target).tooltip({ title: `Edited by ${editEdge.signatures?.join(',')}`, trigger: 'hover' })
  }

  let editEdgeWidget = null
  let editEdgeWidgetPosition

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
        editEdgeWidgetPosition = 1
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
        editEdgeWidgetPosition = 2
        break

      default:
        break
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li className={`entry entry-note ${extraClasses.join(' ')}`} onClick={handleClick} onMouseEnter={e => handleHover(e.currentTarget)}>
      <div className="note-heading">
        <h3>
          <a href={`/forum?id=${forum}`} title="Open forum for this paper" target="_blank" rel="noreferrer">
            {title}
          </a>
          {' '}
          <span>{`(#${number})`}</span>
        </h3>

        <NoteAuthors
          authors={content.authors}
          authorIds={content.authorids}
          original={original}
          max={4}
        />
      </div>

      {editEdgeWidgetPosition === 1 && editEdgeWidget}

      <NoteContent id={id} content={content} collapse />

      <div className="note-meta clearfix">
        {editEdgeWidgetPosition === 2 && editEdgeWidget}

        <ScoresList edges={props.note.browseEdges} />

        <div className="action-links">
          <ul className="list-unstyled text-right">
            <li>
              {props.canTraverse ? (
                <a href="#" className="show-assignments">
                  {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                  {props.traverseLabel} ({props.note.traverseEdgesCount}) &raquo;
                </a>
              ) : (
                <>
                  <span>{`${props.traverseLabel}:`}</span>
                  {' '}
                  <span>{props.note.traverseEdgesCount}</span>
                </>
              )}
            </li>
          </ul>
        </div>
      </div>
    </li>
  )
}
