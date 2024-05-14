import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { get } from 'lodash'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'
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
    const actualpath = path.startsWith('edit.invitation')
      ? path.replace('edit.invitation.', '')
      : path
    const fieldValue = get(invitation, actualpath)
    if (typeof fieldValue === 'object') {
      return Array.isArray(fieldValue)
        ? fieldValue.join(', ')
        : Object.keys(fieldValue).join(', ')
    }
    return fieldValue.toString()
  }

  const getPath = (object, value, path) => {
    if (typeof object !== 'object') {
      return null
    }
    const keys = Object.keys(object)
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i]
      if (typeof object[key] === 'string' && object[key].includes(value)) {
        return path ? `${path}.${key}` : key
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
      let path = getPath(subInvitation, key)
      if (path.startsWith('edit.invitation.')) path = path.replace('edit.invitation.', '')
      const existingFieldValue = get(workflowInvitation, path)
      return [key, existingFieldValue]
    })
  )

  return (
    <>
      <div>
        <span>{invitationName}</span>
        <button onClick={() => setShowInvitationEditor((isOpen) => !isOpen)}>
          {showInvitationEditor ? 'Close' : 'Edit'}
        </button>
        <ul>
          {Object.keys(subInvitation.edit?.content ?? {}).map((key) => (
            <li key={key}>
              {prettyField(key)}:{' '}
              <i>{getFieldDisplayValue(workflowInvitation, getPath(subInvitation, key))}</i>
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
    </>
  )
}

const WorkFlowInvitations = ({ group, accessToken }) => {
  const groupId = group.id
  const submissionName = group.content?.submission_name?.value
  const [allInvitations, setAllInvitations] = useState([])
  const workflowInvitationIds = [
    `${groupId}/-/${submissionName}`,
    `${groupId}/-/Post_${submissionName}`,
  ]

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
    <EditorSection title={`Workflow Invitations (2)`} className="workflow">
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
        const subInvitations = allInvitations.filter(
          (i) => i.id.startsWith(invitationId) && i.id !== invitationId
        )
        return (
          <>
            <Link href={`/invitation/edit?id=${invitationId}`}>{prettyId(invitationId)}</Link>

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
    </EditorSection>
  )
}

export default WorkFlowInvitations
