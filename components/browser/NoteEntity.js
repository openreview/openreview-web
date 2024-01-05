/* eslint-disable no-use-before-define */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/destructuring-assignment */
/* globals $: false */
/* globals promptError: false */

import React, { useContext } from 'react'
import EdgeBrowserContext from './EdgeBrowserContext'
import EditEdgeDropdown from './EditEdgeDropdown'
import EditEdgeToggle from './EditEdgeToggle'
import NoteAuthors from './NoteAuthors'
import NoteContent from './NoteContent'
import ScoresList from './ScoresList'
import EditEdgeTwoDropdowns from './EditEdgeTwoDropdowns'
import api from '../../lib/api-client'
import UserContext from '../UserContext'
import {
  getInterpolatedValues,
  getSignatures,
  isForBothGroupTypesInvite,
  isInGroupInvite,
  isNotInGroupInvite,
} from '../../lib/edge-utils'

export default function NoteEntity(props) {
  const { editInvitations, traverseInvitation, availableSignaturesInvitationMap, version } =
    useContext(EdgeBrowserContext)
  const { user, accessToken } = useContext(UserContext)

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
    signatures: noteSignatures,
  } = props.note

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

    if (
      (e.target.tagName === 'A' && e.target.className !== 'show-assignments') ||
      (e.target.tagName === 'BUTTON' && e.target.className.includes('dropdown-toggle'))
    ) {
      return
    }

    e.preventDefault()
    props.setSelectedItemId(id)
    props.addNewColumn(id, content)
  }

  const removeEdge = async (editEdge) => {
    // remove toolip otherwise it stays
    $('div.tooltip').hide()
    // Delete existing edge
    // TODO: allow ProfileItems to be head objects
    const editInvitation = editInvitations.filter((p) => p.id === editEdge.invitation)?.[0]
    const signatures = getSignatures(
      editInvitation,
      availableSignaturesInvitationMap,
      number,
      user
    )
    const isTraverseInvitation = editInvitation.id === traverseInvitation.id
    if (version === 1 && (!signatures || signatures.length === 0)) {
      promptError("You don't have permission to edit this edge")
      return
    }
    const {
      creationDate,
      modificationDate,
      name,
      writable,
      ...body // removed fields added for entity display
    } = {
      tail: id,
      ddate: Date.now(),
      ...editEdge,
      signatures,
    }
    try {
      const result = await api.post('/edges', body, { accessToken, version })
      if (isTraverseInvitation) {
        props.removeEdgeFromEntity(id, result)
      } else {
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
    const editInvitation = editInvitations.filter(
      (p) => p.id === editEdgeTemplate.invitation
    )?.[0]
    const otherColumnType = props.columnType === 'head' ? 'tail' : 'head'
    const isInviteInvitation =
      isInGroupInvite(editInvitation, otherColumnType) ||
      isForBothGroupTypesInvite(editInvitation, otherColumnType)
    const signatures = getSignatures(
      editInvitation,
      availableSignaturesInvitationMap,
      number,
      user
    )
    const isTraverseInvitation = editInvitation.id === traverseInvitation.id
    const maxLoadInvitationHead = editInvitation.head?.query?.id
    if (version === 1 && (!signatures || signatures.length === 0)) {
      promptError("You don't have permission to edit this edge")
      return
    }
    const {
      creationDate,
      modificationDate,
      name,
      writable,
      ...body // removed fields added for entity display
    } = {
      tail: id,
      ...(existingEdge ?? {
        ...editEdgeTemplate,
        defaultWeight: undefined,
        defaultLabel: undefined,
        label: isInviteInvitation ? editInvitation.label?.default : editEdgeTemplate.label,
        head: maxLoadInvitationHead ?? editEdgeTemplate.head,
        readers: getValues(editInvitation.readers),
        nonreaders: getValues(editInvitation.nonreaders),
        writers: getValues(editInvitation.writers),
        signatures,
      }),
      ...updatedEdgeFields,
      signatures,
    }
    try {
      const result = await api.post('/edges', body, { accessToken, version })
      if (isTraverseInvitation) {
        props.addEdgeToEntity(id, result)
      } else {
        props.reloadColumnEntities()
      }
    } catch (error) {
      promptError(error.message)
    }
  }

  // readers/nonreaders/writers
  const getValues = (value) =>
    getInterpolatedValues({
      value,
      columnType: props.columnType,
      shouldReplaceHeadNumber: true,
      paperNumber: number,
      parentPaperNumber: props.parentInfo.number,
      id,
      parentId: props.parentInfo.id,
      version,
    })

  const renderEditEdgeWidget = ({ editEdge, editInvitation }) => {
    const parentColumnType = props.columnType === 'head' ? 'tail' : 'head'
    const isAssigned = metadata.isAssigned || metadata.isUserAssigned
    const isInviteInvitation =
      isInGroupInvite(editInvitation, parentColumnType) ||
      isNotInGroupInvite(editInvitation, parentColumnType) ||
      isForBothGroupTypesInvite(editInvitation, parentColumnType)
    const isExternalOnlyInviteInvitation = isNotInGroupInvite(editInvitation, parentColumnType)
    const isReviewerAssignmentStage = editInvitations.some((p) =>
      p.id.includes('Proposed_Assignment')
    )
    const isEmergencyReviewerStage = editInvitations.some((p) => p.id.includes('/Assignment'))
    const isProposedAssignmentInvitation = editInvitation.id.includes('Proposed_Assignment')
    const isAssignmentInvitation = editInvitation.id.includes('/Assignment')
    const isIgnoreHeadEditInvitation = editInvitation.query?.head === 'ignore'
    const isParentInvited = props.parentInfo.content?.isInvitedProfile
    // invited reviewers won't be in altGlobalEntityMap so check the props passed in
    const parentExistingLoad =
      props.altGlobalEntityMap[props.parentInfo.id]?.traverseEdgesCount ??
      props.parentInfo.existingLoad
    const parentCustomLoad = props.parentInfo.customLoad
    const isNotWritable = editEdge?.writable === false
    let shouldDisableControl = false
    let disableControlReason = null

    // show invite only at bottom of column
    if (isExternalOnlyInviteInvitation && !editEdge) return null

    // not to show invite assignment when removed from reviewers group
    if (isInviteInvitation && props.parentInfo.content?.isDummyProfile) return null

    // invited profile show only invite edge and proposed assignment edge
    if (isParentInvited && !(isInviteInvitation || isProposedAssignmentInvitation)) return null
    // show existing invite edge for normal reviewers
    if (!isParentInvited && isInviteInvitation && !editEdge) return null
    // head of head:ignore edge is group id and does not make sense for note
    if (isIgnoreHeadEditInvitation) return null
    if (
      ((isReviewerAssignmentStage && (isProposedAssignmentInvitation || isInviteInvitation)) ||
        (isEmergencyReviewerStage && (isAssignmentInvitation || isInviteInvitation))) &&
      Number.isInteger(parentCustomLoad) &&
      parentCustomLoad <= parentExistingLoad &&
      !editEdge
    ) {
      shouldDisableControl = true
      disableControlReason = 'Custom load has reached.'
    }

    // invited external reviewer and assigned should disabled invite assignment
    if (isParentInvited && isAssigned && isReviewerAssignmentStage && isInviteInvitation) {
      shouldDisableControl = true
      disableControlReason = 'The Reviewer has been invited.'
    }

    // edit is not allowed if not writable
    if (editEdge && isNotWritable) {
      shouldDisableControl = true
      disableControlReason = 'You are not allowed to edit this edge.'
    }

    const editEdgeDropdown = (type, controlType) => (
      <EditEdgeDropdown
        existingEdge={editEdge}
        // eslint-disable-next-line max-len
        canAddEdge={
          editEdges?.filter((p) => p?.invitation === editInvitation.id).length === 0 ||
          editInvitation.multiReply
        } // no editedge or invitation allow multiple edges
        label={editInvitation.name}
        options={editInvitation?.[type]?.[controlType]}
        selected={editEdge?.[type]}
        default=" "
        addEdge={addEdge}
        removeEdge={() => removeEdge(editEdge)}
        type={type} // label or weight
        editEdgeTemplate={editEdgeTemplates?.find((p) => p.invitation === editInvitation.id)} // required for adding new
      />
    )
    const editEdgeToggle = () => (
      <EditEdgeToggle
        existingEdge={editEdge}
        addEdge={addEdge}
        removeEdge={() => removeEdge(editEdge)}
        // eslint-disable-next-line max-len
        canAddEdge={
          editEdges?.filter((p) => p?.invitation === editInvitation.id).length === 0 ||
          editInvitation.multiReply
        } // no editedge or invitation allow multiple edges
        editEdgeTemplate={editEdgeTemplates?.find((p) => p.invitation === editInvitation.id)} // required for adding new
        shouldDisableControl={shouldDisableControl}
        disableControlReason={disableControlReason}
        isInviteInvitation={isInviteInvitation}
      />
    )
    const editEdgeTwoDropdowns = (controlType) => (
      <EditEdgeTwoDropdowns
        // eslint-disable-next-line max-len
        canAddEdge={
          editEdges?.filter((p) => p?.invitation === editInvitation.id).length === 0 ||
          editInvitation.multiReply
        } // no editedge or invitation allow multiple edges
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
        editEdgeTemplate={editEdgeTemplates?.find((p) => p.invitation === editInvitation.id)} // required for adding new
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
    <li className={`entry entry-note ${extraClasses.join(' ')}`} onClick={handleClick}>
      <div className="note-heading">
        <h3>
          <a
            href={`/forum?id=${forum}`}
            title="Open forum for this paper"
            target="_blank"
            rel="noreferrer"
          >
            {title}
          </a>{' '}
          <span>{`(#${number})`}</span>
        </h3>

        <NoteAuthors
          authors={content.authors}
          authorIds={content.authorids}
          signatures={noteSignatures}
          original={original}
          max={4}
        />
        {content.venue && <span className="note-venue">{content.venue}</span>}
      </div>

      <NoteContent id={id} content={content} collapse />

      <div className="note-meta clearfix">
        {/* existing editEdges */}
        {editEdges?.map((editEdge, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={index}>
            {renderEditEdgeWidget({
              editEdge,
              editInvitation: editInvitations.find((p) => p.id === editEdge.invitation),
            })}
          </React.Fragment>
        ))}

        {/* add new editEdge */}
        {editInvitations?.map((editInvitation, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={index}>
            {renderEditEdgeWidget({ editInvitation })}
          </React.Fragment>
        ))}

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
                props.showCounter && (
                  <>
                    <span>{`${props.traverseLabel}:`}</span>{' '}
                    <span>{props.note.traverseEdgesCount}</span>
                  </>
                )
              )}
            </li>
          </ul>
        </div>
      </div>
    </li>
  )
}
