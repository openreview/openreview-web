/* eslint-disable no-use-before-define */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals Webfield: false */
/* globals $: false */

import React, { useContext } from 'react'
import EdgeBrowserContext from './EdgeBrowserContext'
import EditEdgeDropdown from './EditEdgeDropdown'
import EditEdgeToggle from './EditEdgeToggle'
import NoteAuthors from './NoteAuthors'
import NoteContent from './NoteContent'
import ScoresList from './ScoresList'
import EditEdgeTwoDropdowns from './EditEdgeTwoDropdowns'

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
    editEdges,
    editEdgeTemplates,
  } = props.note
  const { editInvitations, availableSignatures } = useContext(EdgeBrowserContext)
  const title = content.title ? content.title : 'No Title'

  const metadata = props.note.metadata || {}
  const extraClasses = []
  if (metadata.isAssigned || metadata.isUserAssigned) extraClasses.push('is-assigned')
  if (metadata.hasConflict) extraClasses.push('has-conflict')
  if (metadata.isHidden) extraClasses.push('is-hidden')
  if (editEdges?.length) extraClasses.push('is-editable')
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

  const removeEdge = (editEdge) => {
    // Delete existing edge
    // TODO: allow ProfileItems to be head objects
    Webfield.post('/edges', { tail: id, ddate: Date.now(), ...editEdge })
      .then(res => props.removeEdgeFromEntity(id, res))
  }

  // eslint-disable-next-line object-curly-newline
  const addEdge = ({ e, existingEdge, editEdgeTemplate, updatedEdgeFields = {} }) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    // Create new edge
    Webfield.post('/edges', {
      tail: id,
      ddate: null,
      ...existingEdge ?? {
        ...editEdgeTemplate,
        readers: getInterpolatedValue(editEdgeTemplate.readers),
        nonreaders: getInterpolatedValue(editEdgeTemplate.nonreaders),
        writers: getInterpolatedValue(editEdgeTemplate.writers),
        signatures: editEdgeTemplate.signatures['values-regex']
          ? [editInvitations.filter(p => p.id === editEdgeTemplate.invitation)?.[0]?.signatureValues?.filter(q => q.includes(`Paper${number}`))?.[0]]
          : editEdgeTemplate.signatures,
      },
      ...updatedEdgeFields,
    })
      .then(res => props.addEdgeToEntity(id, res))
  }

  const getInterpolatedValue = (value) => { // readers/nonreaders/writers
    if (value.resolveAtEntity) {
      return value.value
        .split('|')
        .filter(p => p.includes('{head.number}') || p.includes('Paper.*'))
        .map(q => q
          .replace('{head.number}', number)
          .replace('Paper.*', `Paper${number}`))
    }
    return value.map(p => p.replace('{head.number}', number).replace('Paper.*', `Paper${number}`))
  }

  const handleHover = (target) => {
    if (editEdges?.length === 1) $(target).tooltip({ title: `Edited by ${editEdges[0].signatures?.join(',')}`, trigger: 'hover' })
  }

  const renderEditEdgeWidget = ({ editEdge, editInvitation }) => {
    const editEdgeDropdown = (type, controlType) => (
      <EditEdgeDropdown
        existingEdge={editEdge}
        // eslint-disable-next-line max-len
        canAddEdge={editEdges?.filter(p => p?.invitation === editInvitation.id).length === 0 || editInvitation.multiReply} // no editedge or invitation allow multiple edges
        label={editInvitation.name}
        options={editInvitation?.[type]?.[controlType]}
        selected={editEdge?.[type]}
        default=" "
        addEdge={addEdge}
        removeEdge={() => removeEdge(editEdge)}
        type={type} // label or weight
        editEdgeTemplate={editEdgeTemplates?.find(p => p.invitation === editInvitation.id)} // required for adding new one
      />
    )
    const editEdgeToggle = () => (
      <EditEdgeToggle
        existingEdge={editEdge}
        // isAssigned={metadata.isAssigned}
        addEdge={addEdge}
        removeEdge={() => removeEdge(editEdge)}
        // eslint-disable-next-line max-len
        canAddEdge={editEdges?.filter(p => p?.invitation === editInvitation.id).length === 0 || editInvitation.multiReply} // no editedge or invitation allow multiple edges
        editEdgeTemplate={editEdgeTemplates?.find(p => p.invitation === editInvitation.id)} // required for adding new one
      />
    )
    const editEdgeTwoDropdowns = controlType => (
      <EditEdgeTwoDropdowns
        // eslint-disable-next-line max-len
        canAddEdge={editEdges?.filter(p => p?.invitation === editInvitation.id).length === 0 || editInvitation.multiReply} // no editedge or invitation allow multiple edges
        existingEdge={editEdge}
        editInvitation={editInvitation}
        label2="weight"
        edgeEdgeExist={editEdge?.id}
        selected1={editEdge?.id && editEdge?.label}
        selected2={editEdge?.id && editEdge?.weight}
        controlType={controlType}
        default=" "
        addEdge={addEdge}
        removeEdge={removeEdge}
        editEdgeTemplate={editEdgeTemplates?.find(p => p.invitation === editInvitation.id)} // required for adding new one
      />
    )

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

    if (shouldRenderTwoRadio) return editEdgeTwoDropdowns('value-radio')
    if (shouldRenderTwoDropdown) return editEdgeTwoDropdowns('value-dropdown')
    if (shouldRenderLabelRadio) return editEdgeDropdown('label', 'value-radio') // for now treat radio the same as dropdown
    if (shouldRenderWeightRadio) return editEdgeDropdown('weight', 'value-radio') // for now treat radio the same as dropdown
    if (shouldRenderLabelDropdown) return editEdgeDropdown('label', 'value-dropdown')
    if (shouldRenderWeightDropdown) return editEdgeDropdown('weight', 'value-dropdown')
    return editEdgeToggle()
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

      <NoteContent id={id} content={content} collapse />

      <div className="note-meta clearfix">
        { // existing editEdges
          // eslint-disable-next-line max-len,react/no-array-index-key
          editEdges?.map((editEdge, index) => <React.Fragment key={index}>{renderEditEdgeWidget({ editEdge, editInvitation: editInvitations.find(p => p.id === editEdge.invitation) })}</React.Fragment>)
        }
        { // adding new editEdge
          // eslint-disable-next-line max-len,react/no-array-index-key
          editInvitations?.map((editInvitation, index) => <React.Fragment key={index}>{renderEditEdgeWidget({ editInvitation })}</React.Fragment>)
        }

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
