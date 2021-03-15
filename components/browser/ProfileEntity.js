/* eslint-disable no-use-before-define */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals Webfield: false */
/* globals $: false */
/* globals promptError: false */

import React, { useContext, useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'
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
    editEdges,
    editEdgeTemplates,
  } = props.profile
  const { editInvitations, userInfo } = useContext(EdgeBrowserContext)
  const [editInvitationSignatureMap, setEditInvitationSignatureMap] = useState(null) // signatures available for all edit invitations of the entity
  const [isLoading, setIsLoading] = useState(false)

  const metadata = props.profile.metadata || {}
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
    // remove toolip otherwise it stays
    $('div.tooltip').hide()
    // Delete existing edge
    // TODO: allow ProfileItems to be head objects
    const editInvitation = editInvitations.filter(p => p.id === editEdge.invitation)?.[0]
    Webfield.post('/edges', {
      tail: id,
      ddate: Date.now(),
      ...editEdge,
      signatures: getSignatures(editInvitation),
    })
      .then(res => props.removeEdgeFromEntity(id, res))
  }

  // eslint-disable-next-line object-curly-newline
  const addEdge = ({ e, existingEdge, editEdgeTemplate, updatedEdgeFields = {} }) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Create new edge
    const editInvitation = editInvitations.filter(p => p.id === editEdgeTemplate.invitation)?.[0]
    Webfield.post('/edges', {
      tail: id,
      ddate: null,
      ...existingEdge ?? {
        ...editEdgeTemplate,
        readers: getInterpolatedValue(editEdgeTemplate.readers),
        nonreaders: getInterpolatedValue(editEdgeTemplate.nonreaders),
        writers: getInterpolatedValue(editEdgeTemplate.writers),
        signatures: getSignatures(editInvitation),
      },
      ...updatedEdgeFields,
    })
      .then(res => props.addEdgeToEntity(id, res))
  }

  const getSignatures = (editInvitation) => { // pick the correct signature from the several available signatures
    // eslint-disable-next-line max-len
    const availableSignatures = editInvitationSignatureMap.filter(p => p.invitation === editInvitation.id)?.[0]?.signature
    if (editInvitation.signatures['values-regex'] && editInvitation.signatures['values-regex'].includes('{head.number}')) {
      const nonPaperSpecificGroup = availableSignatures.filter(p => !/(Paper)[0-9]\d*/.test(p))[0]
      if (nonPaperSpecificGroup) return [nonPaperSpecificGroup]
      return [availableSignatures?.filter(q => q.includes(`Paper${props.parentInfo.number}`))?.[0]]
    }
    return availableSignatures
  }

  const getInterpolatedValue = (value) => { // readers/nonreaders/writers
    if (typeof value === 'string') {
      if (props.columnType === 'head') return value.replace('{tail}', props.parentInfo.id)
      // tail
      return value.replace('{head.number}', props.parentInfo.number).replace('{tail}', id)
    }
    if (Array.isArray(value)) {
      return value.map((v) => {
        let finalV = v
        if (props.columnType === 'head') finalV = finalV.replace('{tail}', props.parentInfo.id)
        if (props.columnType === 'tail') finalV = finalV.replace('{head.number}', props.parentInfo.number).replace('{tail}', id)
        return finalV
      })
    }
    return value
  }

  const handleHover = (target) => { // show if has only 1 edit edge
    if (editEdges?.length === 1) $(target).tooltip({ title: `Edited by ${prettyId(editEdges[0].signatures[0])}`, trigger: 'hover' })
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
        editEdgeTemplate={editEdgeTemplates.find(p => p.invitation === editInvitation.id)} // required for adding new one
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
        editEdgeTemplate={editEdgeTemplates.find(p => p.invitation === editInvitation.id)} // required for adding new one
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
        removeEdge={() => removeEdge(editEdge)}
        editEdgeTemplate={editEdgeTemplates.find(p => p.invitation === editInvitation.id)} // required for adding new one
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

  const getInterpolatedSignatures = (editInvitationSignatures, editInvitationId) => { // interpolate signature(still a regex) so that api return less results
    if (!editInvitationSignatures) {
      promptError(`signature of ${prettyId(editInvitationId)} should not be empty`)
      return null
    }
    if (editInvitationSignatures.values) return editInvitationSignatures.values
    if (editInvitationSignatures['values-regex']?.startsWith('~.*')) return [userInfo.userTildId]
    if (editInvitationSignatures['values-regex']) {
      const interpolatedSignature = editInvitationSignatures['values-regex'].replace('{head.number}', props.parentInfo.number)
      return api.get('/groups', { regex: interpolatedSignature, signatory: userInfo.userId }, { accessToken: userInfo.accessToken })
    }
    return editInvitationSignatures
  }

  useEffect(() => {
    const constructEditEdgeTemplates = async () => {
      // eslint-disable-next-line max-len
      const editInvitationsP = editInvitations.map(editInvitation => getInterpolatedSignatures(editInvitation.signatures, editInvitation.id))
      Promise.all(editInvitationsP).then((results) => {
        // eslint-disable-next-line arrow-body-style
        setEditInvitationSignatureMap(results.map((result, index) => {
          return {
            invitation: editInvitations[index].id,
            signature: result.groups ? result.groups.map(group => (group.id)) : result,
          }
        }))
        setIsLoading(false)
      })
    }
    setIsLoading(true)
    constructEditEdgeTemplates()
  }, [])

  if (isLoading) return <LoadingSpinner />

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li className={`entry entry-reviewer d-flex ${extraClasses.join(' ')}`} onClick={handleClick} onMouseEnter={e => handleHover(e.currentTarget)}>
      <div className="reviewer-heading">
        <h3>
          <a href={`/profile?id=${id}`} title={`Profile for ${id}`} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            {content.name.first} {content.name.middle} {content.name.last}
          </a>
        </h3>

        <p>{content.title}</p>
      </div>

      { // existing editEdges
        // eslint-disable-next-line max-len,react/no-array-index-key
        editEdges?.map((editEdge, index) => <React.Fragment key={index}>{renderEditEdgeWidget({ editEdge, editInvitation: editInvitations.find(p => p.id === editEdge.invitation) })}</React.Fragment>)
      }
      { // adding new editEdge
        // eslint-disable-next-line max-len,react/no-array-index-key
        editInvitations?.map((editInvitation, index) => <React.Fragment key={index}>{renderEditEdgeWidget({ editInvitation })}</React.Fragment>)
      }
      <div>
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
      </div>
    </li>
  )
}
