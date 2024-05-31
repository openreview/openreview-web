/* globals promptError: false */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { get, sortBy } from 'lodash'
import EditorSection from '../EditorSection'
import api from '../../lib/api-client'
import { prettyField, prettyId } from '../../lib/utils'
import InvitationContentEditor from './InvitationContentEditor'

const WorflowInvitationRow = ({
  subInvitation,
  workflowInvitation,
  loadWorkflowInvitations,
}) => {
  const [showInvitationEditor, setShowInvitationEditor] = useState(false)
  const invitationName = prettyField(subInvitation.id.split('/').pop())
  const getFieldDisplayValue = (invitation, path) => {
    if (!path) return null
    const fieldValue = get(invitation, path)
    if (typeof fieldValue === 'object') {
      if (Array.isArray(fieldValue)) {
        const valueSegments = fieldValue.map((value) =>
          prettyId(value).split(/\{(\S+\s*\S*)\}/g)
        )
        return valueSegments.map((segments) => (
          <>
            {segments.map((segment, index) =>
              index % 2 !== 0 ? <em key={index}>{segment}</em> : segment
            )}
            {', '}
          </>
        ))
      }
      return Object.keys(fieldValue).join(', ')
    }
    return fieldValue?.toString()
  }

  const getPath = (object, value, path) => {
    if (typeof object !== 'object') {
      return null
    }
    const keys = Object.keys(object)
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i]
      if (typeof object[key] === 'string' && object[key].includes(value)) {
        if (Number.isNaN(Number(key))) return path ? `${path}.${key}` : key
        return path
      }
      if (Array.isArray(object[key]) && object[key].includes(value)) {
        return path ? `${path}.${key}` : key
      }
      if (typeof object[key] === 'object') {
        const result = getPath(object[key], value, path ? `${path}.${key}` : key)
        if (result) {
          return result
        }
      }
    }
    return null
  }

  const existingValue = Object.fromEntries(
    Object.keys(subInvitation.edit?.content ?? {}).map((key) => {
      const path = getPath(subInvitation.edit.invitation, key)
      const existingFieldValue = get(workflowInvitation, path)
      return [key, existingFieldValue]
    })
  )

  return (
    <ul>
      <li>
        <div>
          <span>{invitationName}</span>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a
            href="#"
            className="ml-2"
            onClick={(e) => {
              e.preventDefault()
              setShowInvitationEditor((isOpen) => !isOpen)
            }}
          >
            {showInvitationEditor ? 'Close' : 'Edit'}
          </a>
          <ul>
            {Object.keys(subInvitation.edit?.content ?? {}).map((key) => (
              <li key={key}>
                {prettyField(key)}:{' '}
                <i>
                  {getFieldDisplayValue(
                    workflowInvitation,
                    getPath(subInvitation.edit.invitation, key)
                  )}
                </i>
              </li>
            ))}
          </ul>
        </div>
        <div>
          {showInvitationEditor && (
            <InvitationContentEditor
              invitation={subInvitation}
              existingValue={existingValue}
              closeInvitationEditor={() => setShowInvitationEditor(false)}
              onInvitationEditPosted={() => loadWorkflowInvitations()}
            />
          )}
        </div>
      </li>
    </ul>
  )
}

const StageInvitationRow = ({ stageInvitation }) => {
  const [showInvitationEditor, setShowInvitationEditor] = useState(false)

  return showInvitationEditor ? (
    <div>
      {showInvitationEditor && (
        <InvitationContentEditor
          invitation={stageInvitation}
          existingValue={{}}
          closeInvitationEditor={() => setShowInvitationEditor(false)}
          onInvitationEditPosted={() => {}}
        />
      )}
    </div>
  ) : (
    <div id="invitation">
      <div className="panel">
        <strong className="item hint">Add:</strong>
        <button className="btn" onClick={() => setShowInvitationEditor(true)}>
          {prettyId(stageInvitation.id)}
        </button>
      </div>
    </div>
  )
}

const WorkFlowInvitations = ({ group, accessToken }) => {
  const groupId = group.id
  const submissionName = group.content?.submission_name?.value
  const [allInvitations, setAllInvitations] = useState([])
  const [groupsAndInvitations, setGroupsAndInvitations] = useState([])
  const workflowInvitationRegex = RegExp(`^${groupId}/-/[^/]+$`)

  const stageInvitationIds = [`${groupId}/-/Stage`]

  const loadAllInvitations = async () => {
    const getAllGroupsP = api
      .getAll(
        '/groups',
        {
          parent: groupId,
        },
        { accessToken }
      )
      .then((groups) => groups.filter((p) => !p.id.includes(submissionName)))

    const getAllInvitationsP = await api.getAll(
      '/invitations',
      { prefix: `${groupId}/-/.*`, expired: true, type: 'all' },
      { accessToken }
    )
    try {
      const [groups, invitations] = await Promise.all([getAllGroupsP, getAllInvitationsP])
      const workFlowInvitations = invitations.filter((p) => workflowInvitationRegex.test(p.id))
      const groupAndWorkflowInvitations = [
        ...groups.map((p) => ({ ...p, type: 'group' })),
        ...workFlowInvitations.map((p) => ({ ...p, type: 'invitation' })),
      ]
      setGroupsAndInvitations(sortBy(groupAndWorkflowInvitations, 'cdate'))
      setAllInvitations(invitations)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!groupId) return
    loadAllInvitations()
  }, [groupId])

  return (
    <EditorSection
      title={`Workflow Invitations (${groupsAndInvitations.length})`}
      className="workflow"
    >
      <div className="container workflow-container">
        {groupsAndInvitations.map((stepObj) => {
          if (stepObj.type === 'group') {
            return (
              <div key={stepObj.id}>
                <Link href={`/group/edit?id=${stepObj.id}`}>
                  {prettyId(stepObj.id)}({stepObj.members?.length || 0})
                </Link>
              </div>
            )
          }
          const invitationId = stepObj.id
          const subInvitations = allInvitations.filter((i) =>
            i.id.startsWith(`${invitationId}/`)
          )
          return (
            <div key={invitationId}>
              <Link href={`/invitation/edit?id=${invitationId}`}>
                {prettyId(invitationId)}
              </Link>

              {subInvitations.length > 0 &&
                subInvitations.map((subInvitation) => (
                  <WorflowInvitationRow
                    key={subInvitation.id}
                    subInvitation={subInvitation}
                    workflowInvitation={stepObj}
                    loadWorkflowInvitations={loadAllInvitations}
                  />
                ))}
            </div>
          )
        })}

        {stageInvitationIds.map((stageInvitationId) => {
          const stageInvitation = allInvitations.find((i) => i.id === stageInvitationId)
          if (!stageInvitation) return null
          return (
            <StageInvitationRow key={stageInvitation.id} stageInvitation={stageInvitation} />
          )
        })}
      </div>
    </EditorSection>
  )
}

export default WorkFlowInvitations
