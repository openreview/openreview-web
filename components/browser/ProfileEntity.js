/* eslint-disable no-use-before-define */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals Webfield: false */
/* globals $: false */
/* globals promptError: false */

import React, { useContext } from 'react'
import api from '../../lib/api-client'
import { getInterpolatedValues, getSignatures } from '../../lib/edge-utils'
import UserContext from '../UserContext'
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
    browseEdges,
    traverseEdgesCount,
  } = props.profile
  const { editInvitations, availableSignaturesInvitationMap, traverseInvitation } = useContext(EdgeBrowserContext)
  const { user, accessToken } = useContext(UserContext)

  const metadata = props.profile.metadata || {}
  const extraClasses = []
  const customLoad = [...browseEdges || [], ...editEdges || []].filter(p => p.invitation.includes('Custom_Max_Papers'))?.[0]?.weight

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
    props.addNewColumn(id, content, customLoad, traverseEdgesCount)
  }

  const removeEdge = async (editEdge) => {
    // remove toolip otherwise it stays
    $('div.tooltip').hide()
    // Delete existing edge
    // TODO: allow ProfileItems to be head objects
    const editInvitation = editInvitations.filter(p => p.id === editEdge.invitation)?.[0]
    const signatures = getSignatures(editInvitation, availableSignaturesInvitationMap, props.parentInfo.number, user)
    if (!signatures || signatures.length === 0) {
      promptError('You don\'t have permission to edit this edge')
      return
    }
    // const isInviteInvitation = editInvitation[props.columnType]?.query?.['value-regex'] === '~.*|.+@.+'
    const isTraverseInvitation = editInvitation.id === traverseInvitation.id
    const isCustomLoadInvitation = editInvitation.id.includes('Custom_Max_Papers')
    const {
      creationDate, modificationDate, name, writable, ...body // removed fields added for entity display
    } = {
      tail: id,
      ddate: Date.now(),
      ...editEdge,
      signatures,
    }
    try {
      const result = await api.post('/edges', body, { accessToken })

      if (isTraverseInvitation) {
        props.removeEdgeFromEntity(id, result)
      } else {
        if (isCustomLoadInvitation) props.updateChildColumn(props.columnIndex, null)
        props.reloadColumnEntities()
      }
    } catch (error) {
      promptError(error.message)
    }
  }

  // eslint-disable-next-line object-curly-newline
  const addEdge = async ({ e, existingEdge, editEdgeTemplate, updatedEdgeFields = {} }) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Create new edge
    const editInvitation = editInvitations.filter(p => p.id === editEdgeTemplate.invitation)?.[0]
    const isInviteInvitation = editInvitation[props.columnType]?.query?.['value-regex'] === '~.*|.+@.+'
    const isTraverseInvitation = editInvitation.id === traverseInvitation.id
    const isCustomLoadInvitation = editInvitation.id.includes('Custom_Max_Papers')
    const maxLoadInvitationHead = editInvitation.head?.query?.id
    const signatures = getSignatures(editInvitation, availableSignaturesInvitationMap, props.parentInfo.number, user)
    if (!signatures || signatures.length === 0) {
      promptError('You don\'t have permission to edit this edge')
      return
    }
    const {
      creationDate, modificationDate, name, writable, ...body // removed fields added for entity display
    } = {
      tail: id,
      ddate: null,
      ...existingEdge ?? {
        ...editEdgeTemplate,
        head: maxLoadInvitationHead ?? editEdgeTemplate.head,
        label: isInviteInvitation ? editInvitation.label?.default : editEdgeTemplate.label,
        readers: getValues(editInvitation.readers),
        nonreaders: getValues(editInvitation.nonreaders),
        writers: getValues(editInvitation.writers),
        signatures,
      },
      ...updatedEdgeFields,
    }
    try {
      const result = await api.post('/edges', body, { accessToken })
      if (isTraverseInvitation) {
        props.addEdgeToEntity(id, result)
      } else {
        if (isCustomLoadInvitation) props.updateChildColumn(props.columnIndex, updatedEdgeFields?.weight)
        props.reloadColumnEntities()
      }
      // isInviteInvitation ? props.reloadWithoutUpdate() : props.addEdgeToEntity(id, result)
    } catch (error) {
      promptError(error.message)
    }
  }

  // readers/nonreaders/writers
  const getValues = value => getInterpolatedValues({
    value,
    columnType: props.columnType,
    shouldReplaceHeadNumber: false,
    paperNumber: null,
    parentPaperNumber: props.parentInfo.number,
    id,
    parentId: props.parentInfo.id,
  })

  const renderEditEdgeWidget = ({ editEdge, editInvitation }) => {
    const isAssigned = (metadata.isAssigned || metadata.isUserAssigned)
    const isInviteInvitation = editInvitation[props.columnType]?.query?.['value-regex'] === '~.*|.+@.+'
    const isProposedAssignmentInvitation = editInvitation.id.includes('Proposed_Assignment')
    const isReviewerAssignmentStage = editInvitations.some(p => p.id.includes('Proposed_Assignment'))
    const isEmergencyReviewerStage = editInvitations.some(p => p.id.includes('/Assignment'))
    const isNotWritable = editEdge?.writable === false
    let shouldDisableControl = false

    // disable propose assignment when traverseEdgeCount>=custmom max paper in 1st stage
    if (isReviewerAssignmentStage
      && isProposedAssignmentInvitation
      && customLoad
      && customLoad <= traverseEdgesCount
      && !editEdge) shouldDisableControl = true

    // edit is not allowed if not writable
    if (editEdge && isNotWritable) shouldDisableControl = true
    // invited external reviewer and assigned should disabled invite assignment
    if (
      content?.isInvitedProfile
      && isAssigned
      && isReviewerAssignmentStage
      && isInviteInvitation) shouldDisableControl = true
    // reviewer assignmet stage(1st stage) don't show invite assignment
    // except for invited (has editEdge)
    if (isReviewerAssignmentStage && isInviteInvitation && !editEdge) return null
    // can't be invited/uninvited when assigned already(except invited profile to enable delete)
    if (isAssigned && isInviteInvitation && !content?.isInvitedProfile) return null
    if ( // invited profile show only proposed/invite assignment widget
      content?.isInvitedProfile
      && !isAssigned
      && isReviewerAssignmentStage
      && !isInviteInvitation) return null
    if ( // invited profile show only invite widget
      content?.isInvitedProfile
      && isEmergencyReviewerStage
      && !isInviteInvitation
    ) return null

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
        editEdgeTemplate={editEdgeTemplates?.find(p => p?.invitation === editInvitation.id)} // required for adding new
      />
    )
    const editEdgeToggle = () => (
      <EditEdgeToggle
        existingEdge={editEdge}
        addEdge={addEdge}
        removeEdge={() => removeEdge(editEdge)}
        // eslint-disable-next-line max-len
        canAddEdge={editEdges?.filter(p => p?.invitation === editInvitation.id).length === 0 || editInvitation.multiReply} // no editedge or invitation allow multiple edges
        editEdgeTemplate={editEdgeTemplates?.find(p => p?.invitation === editInvitation.id)} // required for adding new
        isInviteInvitation={isInviteInvitation}
        shouldDisableControl={shouldDisableControl}
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
        editEdgeTemplate={editEdgeTemplates?.find(p => p?.invitation === editInvitation.id)} // required for adding new
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
    <li className={`entry entry-reviewer d-flex ${extraClasses.join(' ')}`} onClick={handleClick}>
      <div className="reviewer-heading">
        <h3>
          <a href={`/profile?${id.startsWith('~') ? 'id' : 'email'}=${id}`} title={`Profile for ${id}`} target="_blank" rel="noreferrer">
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
