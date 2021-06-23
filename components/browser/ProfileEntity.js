/* eslint-disable no-use-before-define */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals Webfield: false */
/* globals $: false */
/* globals promptError,promptMessage: false */

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
    traverseEdgeTemplate,
    browseEdges,
    traverseEdgesCount,
  } = props.profile
  const {
    editInvitations,
    availableSignaturesInvitationMap,
    traverseInvitation,
    browseInvitations,
  } = useContext(EdgeBrowserContext)
  const { user, accessToken } = useContext(UserContext)

  const metadata = props.profile.metadata || {}
  const extraClasses = []
  const defaultWeight = [...editInvitations, ...browseInvitations].filter(p => p.id.includes('Custom_Max_Papers'))?.[0]?.defaultWeight
  const customLoad = [...browseEdges || [], ...editEdges || []].find(p => p.invitation.includes('Custom_Max_Papers'))?.weight ?? defaultWeight
  const isInviteAcceptedProfile = editEdges?.find(p => p.invitation.includes('Invite_Assignment'))?.label === 'Accepted'

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

  const removeEdge = async (editEdge, isTraverseEdge = false) => {
    // remove toolip otherwise it stays
    $('div.tooltip').hide()
    // Delete existing edge
    // TODO: allow ProfileItems to be head objects
    const editInvitation = isTraverseEdge
      ? traverseInvitation
      : editInvitations.filter(p => p.id === editEdge.invitation)?.[0]
    const signatures = getSignatures(editInvitation, availableSignaturesInvitationMap, props.parentInfo.number, user)
    if (!signatures || signatures.length === 0) {
      promptError('You don\'t have permission to edit this edge')
      return
    }
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

  const addEdge = async ({
    e, existingEdge, editEdgeTemplate, updatedEdgeFields = {}, isTraverseEdge = false,
  }) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Create new edge
    const editInvitation = isTraverseEdge
      ? traverseInvitation
      : editInvitations.filter(p => p.id === editEdgeTemplate.invitation)?.[0]
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
        defaultWeight: undefined,
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
      if (isInviteInvitation) promptMessage(`Invitation has been sent to ${body.tail} and it's waiting for the response.`)
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
  const renderEditEdgeWidget = ({ edge, invitation, isTraverseEdge = false }) => {
    const isAssigned = (metadata.isAssigned || metadata.isUserAssigned)
    const isInviteInvitation = invitation[props.columnType]?.query?.['value-regex'] === '~.*|.+@.+'
    const isProposedAssignmentInvitation = invitation.id.includes('Proposed_Assignment')
    const isAssignmentInvitation = invitation.id.includes('/Assignment')
    const isCustomLoadInvitation = invitation.id.includes('Custom_Max_Papers')
    const isReviewerAssignmentStage = editInvitations.some(p => p.id.includes('Proposed_Assignment'))
    const isEmergencyReviewerStage = editInvitations.some(p => p.id.includes('/Assignment'))
    const isNotWritable = edge?.writable === false

    let disableControlReason = null

    // disable propose assignment when traverseEdgeCount>=custmom max paper in 1st stage
    if (
      (
        (isReviewerAssignmentStage && isProposedAssignmentInvitation)
        || (isEmergencyReviewerStage && isAssignmentInvitation)
      )
      && customLoad && customLoad <= traverseEdgesCount && !edge) {
      disableControlReason = 'Custom load has been reached'
    }
    // edit is not allowed if not writable
    if (edge && isNotWritable) {
      disableControlReason = 'You are not allowed to edit this edge'
    }
    // invited external reviewer and assigned should disabled invite assignment
    if (content?.isInvitedProfile && isAssigned && isReviewerAssignmentStage && isInviteInvitation) {
      disableControlReason = 'The reviewer has already been invited'
    }

    // reviewer assignmet stage (1st stage) don't show invite assignment except for invited (has editEdge)
    if (isReviewerAssignmentStage && isInviteInvitation && !edge) return null

    // can't be invited/uninvited when assigned already(except invited profile to enable delete)
    if (isAssigned && isInviteInvitation && !content?.isInvitedProfile) return null

    // invited reviewer with assigned edge,don't show custom load edge
    if (isAssigned && content?.isInvitedProfile && isCustomLoadInvitation) return null

    // invited profile show only proposed/invite assignment widget
    if (content?.isInvitedProfile && !isInviteAcceptedProfile
      && !isAssigned && isReviewerAssignmentStage && !isInviteInvitation) return null

    // invited profile show only invite widget
    if (content?.isInvitedProfile && isEmergencyReviewerStage && !isInviteInvitation) return null

    const editEdgeDropdown = (type, controlType) => (
      <EditEdgeDropdown
        existingEdge={edge}
        // eslint-disable-next-line max-len
        canAddEdge={editEdges?.filter(p => p?.invitation === invitation.id).length === 0 || invitation.multiReply} // no editedge or invitation allow multiple edges
        label={invitation.name}
        options={invitation?.[type]?.[controlType]}
        selected={edge?.[type]}
        default=" "
        addEdge={addEdge}
        removeEdge={() => removeEdge(edge)}
        type={type} // label or weight
        editEdgeTemplate={editEdgeTemplates?.find(p => p?.invitation === invitation.id)} // required for adding new
      />
    )
    const editEdgeToggle = () => (
      <EditEdgeToggle
        existingEdge={edge}
        addEdge={addEdge}
        removeEdge={() => removeEdge(edge, isTraverseEdge)}
        // eslint-disable-next-line max-len
        canAddEdge={editEdges?.filter(p => p?.invitation === invitation.id).length === 0 || invitation.multiReply} // no editedge or invitation allow multiple edges
        editEdgeTemplate={editEdgeTemplates?.find(p => p?.invitation === invitation.id)} // required for adding new
        isInviteInvitation={isInviteInvitation}
        shouldDisableControl={!!disableControlReason}
        disableControlReason={disableControlReason}
        isTraverseEdge={isTraverseEdge}
        traverseEdgeTemplate={traverseEdgeTemplate}
      />
    )
    const editEdgeTwoDropdowns = controlType => (
      <EditEdgeTwoDropdowns
        // eslint-disable-next-line max-len
        canAddEdge={editEdges?.filter(p => p?.invitation === invitation.id).length === 0 || invitation.multiReply} // no editedge or invitation allow multiple edges
        existingEdge={edge}
        editInvitation={invitation}
        label2="weight"
        edgeEdgeExist={edge?.id}
        selected1={edge?.id && edge?.label}
        selected2={edge?.id && edge?.weight}
        controlType={controlType}
        default=" "
        addEdge={addEdge}
        removeEdge={() => removeEdge(edge)}
        editEdgeTemplate={editEdgeTemplates?.find(p => p?.invitation === invitation.id)} // required for adding new
      />
    )

    const labelRadio = invitation.label?.['value-radio']
    const labelDropdown = invitation.label?.['value-dropdown']
    const weightRadio = invitation.weight?.['value-radio']
    const weightDropdown = invitation.weight?.['value-dropdown']

    const shouldRenderTwoRadio = labelRadio && weightRadio
    const shouldRenderTwoDropdown = labelDropdown && weightDropdown
    const shouldRenderLabelRadio = labelRadio && !invitation.weight
    const shouldRenderWeightRadio = weightRadio && !invitation.label
    const shouldRenderLabelDropdown = labelDropdown && !invitation.weight
    const shouldRenderWeightDropdown = weightDropdown && !invitation.label

    if (shouldRenderTwoRadio) return editEdgeTwoDropdowns('value-radio')
    if (shouldRenderTwoDropdown) return editEdgeTwoDropdowns('value-dropdown')
    if (shouldRenderLabelRadio) return editEdgeDropdown('label', 'value-radio') // for now treat radio the same as dropdown
    if (shouldRenderWeightRadio) return editEdgeDropdown('weight', 'value-radio') // for now treat radio the same as dropdown
    if (shouldRenderLabelDropdown) return editEdgeDropdown('label', 'value-dropdown')
    if (shouldRenderWeightDropdown) return editEdgeDropdown('weight', 'value-dropdown')
    return editEdgeToggle()
  }

  // eslint-disable-next-line consistent-return
  const renderTraverseEdgeWidget = () => {
    // existing
    if (props.profile.traverseEdge) {
      // eslint-disable-next-line max-len
      if (!props.profile.traverseEdge?.writable || editInvitations.some(p => p.id === traverseInvitation.id)) return null
      return renderEditEdgeWidget({
        edge: props.profile.traverseEdge,
        invitation: traverseInvitation,
        isTraverseEdge: true,
      })
    }
    // new only for external reviewer who has accepted
    if (traverseInvitation.id.includes('/Assignment') && editEdges?.some(
      p => editInvitations.find(
        q => q.id === p.invitation,
      )?.[props.columnType]?.query?.['value-regex'] === '~.*|.+@.+' // invite invitation
        && p.label === 'Accepted',
    )
    ) {
      return renderEditEdgeWidget({
        invitation: traverseInvitation,
        isTraverseEdge: true,
      })
    }
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

      {/* existing editEdges */}
      {editEdges?.map((editEdge, index) => (
        <React.Fragment key={index}>
          {renderEditEdgeWidget({
            edge: editEdge,
            invitation: editInvitations.find(p => p.id === editEdge.invitation) ?? traverseInvitation,
          })}
        </React.Fragment>
      ))}

      {renderTraverseEdgeWidget()}

      {/* add new editEdge */}
      {editInvitations?.map((editInvitation, index) => (
        <React.Fragment key={index}>
          {renderEditEdgeWidget({ invitation: editInvitation })}
        </React.Fragment>
      ))}

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
