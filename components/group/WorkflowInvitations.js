import { useEffect, useState } from 'react'
import Link from 'next/link'
import { get } from 'lodash'
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
  const workflowInvitationIds = [
    `${groupId}/-/${submissionName}`,
    `${groupId}/-/Post_${submissionName}`,
    `${groupId}/-/Official_Review`,
  ]
  const stageInvitationIds = [`${groupId}/-/Stage`]

  const loadWorkflowInvitations = async (limit, offset) => {
    const queryParam = {
      prefix: `${groupId}/-/.*`,
      expired: true,
      type: 'all',
      limit,
      offset,
    }

    const result = await api.getAll('/invitations', queryParam, { accessToken })
    setAllInvitations(result)
  }

  useEffect(() => {
    if (!groupId) return
    loadWorkflowInvitations()
  }, [groupId])

  return (
    <EditorSection
      title={`Workflow Invitations (${workflowInvitationIds.length})`}
      className="workflow"
    >
      <div className="container workflow-container">
        {/* <Link href={`/invitation/edit?id=${groupId}/-/${submissionName}`}>
        {prettyId(`${groupId}/-/${submissionName}`)}
      </Link>
      <ul>
        <li>
          {prettyId(`Deadlines`)}{' '}
          <Link href={`/invitation/edit?id=${groupId}/-/${submissionName}/Deadlines`}>
            <u>{`Edit`}</u>
          </Link>
          <ul>
            <li>
              Activation Date: <i>2 April 2024 at 8:00 AM EST</i>
            </li>
            <li>
              Due Date: <i>14 April 2024 at 11:59 PM EST</i>
            </li>
            <li>
              Expiration Date: <i>14 April 2024 at 11:59 PM EST</i>
            </li>
          </ul>
        </li>
        <li>
          {prettyId(`Submission_Form`)}{' '}
          <Link href={`/invitation/edit?id=${groupId}/-/${submissionName}/Submission_Form`}>
            <u>{`Edit`}</u>
          </Link>
        </li>
        <ul>
          <li>
            Content: <i>Title, Authors, Abstract, TL;DR, Nominate reviewer, Subject areas</i>
          </li>
          <li>
            License: <i>CC-BY 4.0</i>
          </li>
        </ul>
        <li>
          {prettyId(`Notifications`)}{' '}
          <Link href={`/invitation/edit?id=${groupId}/-/${submissionName}/Notifications`}>
            <u>{`Edit`}</u>
          </Link>
        </li>
        <ul>
          <li>
            Email Authors: <i>True</i>
          </li>
          <li>
            Email PCs: <i>False</i>
          </li>
        </ul>
      </ul>
      <Link href={`/invitation/edit?id=${groupId}/-/Post_${submissionName}`}>
        {prettyId(`${groupId}/-/Post_${submissionName}`)}
      </Link> */}

        {workflowInvitationIds.map((invitationId) => {
          const workflowInvitationObj = allInvitations.find((i) => i.id === invitationId)
          const subInvitations = allInvitations.filter((i) =>
            i.id.startsWith(`${invitationId}/`)
          )
          if (!workflowInvitationObj) return null
          return (
            <>
              <Link href={`/invitation/edit?id=${invitationId}`}>
                {prettyId(invitationId)}
              </Link>

              {subInvitations.length > 0 &&
                subInvitations.map((subInvitation) => (
                  <WorflowInvitationRow
                    key={subInvitation.id}
                    subInvitation={subInvitation}
                    workflowInvitation={workflowInvitationObj}
                    loadWorkflowInvitations={loadWorkflowInvitations}
                  />
                ))}
            </>
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
