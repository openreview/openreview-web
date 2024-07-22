/* globals promptError: false */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { get, sortBy } from 'lodash'
import EditorSection from '../EditorSection'
import api from '../../lib/api-client'
import { formatDateTime, prettyField, prettyId } from '../../lib/utils'
import InvitationContentEditor from './InvitationContentEditor'
import Dropdown from '../Dropdown'

const WorflowInvitationRow = ({
  subInvitation,
  workflowInvitation,
  loadWorkflowInvitations,
}) => {
  const [showInvitationEditor, setShowInvitationEditor] = useState(false)
  const invitationName = prettyField(subInvitation.id.split('/').pop())
  const isGroupInvitation = subInvitation.edit?.group // sub invitation can be group invitation too

  const getFieldDisplayValue = (invitation, path, type) => {
    if (!path) return null
    const fieldValue = get(invitation, path)
    if (typeof fieldValue === 'object') {
      if (Array.isArray(fieldValue)) {
        if (typeof fieldValue[0] === 'object') {
          // enum
          return fieldValue.map((p) => p.description).join(', ')
        }
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
    if (type === 'date') {
      return formatDateTime(fieldValue, { second: undefined })
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

  const existingValue = isGroupInvitation
    ? {}
    : Object.fromEntries(
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
          {isGroupInvitation ? (
            <button className="btn btn-xs ml-2" onClick={() => setShowInvitationEditor(true)}>
              Add
            </button>
          ) : (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
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
          )}

          {!isGroupInvitation && (
            <ul>
              {Object.keys(subInvitation.edit?.content ?? {}).map((key) => (
                <li key={key}>
                  {prettyField(key)}:{' '}
                  <i>
                    {getFieldDisplayValue(
                      workflowInvitation,
                      getPath(subInvitation.edit.invitation, key),
                      subInvitation.edit.content?.[key]?.value?.param?.type
                    )}
                  </i>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          {showInvitationEditor && (
            <InvitationContentEditor
              invitation={subInvitation}
              existingValue={existingValue}
              closeInvitationEditor={() => setShowInvitationEditor(false)}
              onInvitationEditPosted={() => loadWorkflowInvitations()}
              isGroupInvitation={isGroupInvitation}
            />
          )}
        </div>
      </li>
    </ul>
  )
}

const AddStageInvitationSection = ({ stageInvitations, venueId }) => {
  const [stageToAdd, setStageToAdd] = useState(null)
  const addStageOptions = stageInvitations.map((p) => ({
    value: p.id,
    label: prettyId(p.id),
  }))

  const existingValue = stageToAdd?.edit?.content?.venue_id ? { venue_id: venueId } : {}

  return (
    <div id="invitation">
      <div className="panel add-stage">
        <strong className="item hint">Add:</strong>
        <Dropdown
          options={addStageOptions}
          value={addStageOptions.find((p) => p.value === stageToAdd?.id) ?? null}
          placeholder="Select a template to add stage"
          onChange={(e) => setStageToAdd(stageInvitations.find((p) => p.id === e.value))}
        />
      </div>
      {stageToAdd && (
        <InvitationContentEditor
          invitation={stageToAdd}
          existingValue={existingValue}
          className="panel"
          closeInvitationEditor={() => setStageToAdd(null)}
          onInvitationEditPosted={() => {
            setStageToAdd(null)
          }}
        />
      )}
    </div>
  )
}

const EditInvitationRow = ({ invitation, isDomainGroup }) => {
  const [showEditor, setShowEditor] = useState(false)
  return (
    <div className="edit-invitation-container">
      <div className="invitation-info">
        <span className={invitation.passed ? 'text-muted cdate' : 'cdate'}>
          {invitation.formattedCDate}{' '}
        </span>
        <Link href={`/invitation/edit?id=${invitation.id}`}>{prettyId(invitation.id)}</Link>
        {invitation.edit?.content && isDomainGroup && !showEditor && (
          <button className="btn btn-xs ml-2" onClick={() => setShowEditor(true)}>
            Add
          </button>
        )}
      </div>
      {showEditor && (
        <div className="content-editor-container">
          <InvitationContentEditor
            invitation={invitation}
            existingValue={{}}
            isGroupInvitation={true}
            closeInvitationEditor={() => {
              setShowEditor(false)
            }}
            onInvitationEditPosted={() => {}}
          />
        </div>
      )}
    </div>
  )
}

const WorkFlowInvitations = ({ group, accessToken }) => {
  const groupId = group.id
  const submissionName = group.content?.submission_name?.value
  const [allInvitations, setAllInvitations] = useState([])
  const [groupsAndInvitations, setGroupsAndInvitations] = useState([])
  const [stageInvitations, setStageInvitations] = useState([])
  const workflowInvitationRegex = RegExp(`^${groupId}/-/[^/]+$`)

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

    const getStageInvitationTemplatesP =
      group.id === group.domain
        ? api
            .getAll(
              '/invitations',
              {
                prefix: `${process.env.SUPER_USER}/Support/-/.*`,
              },
              { accessToken }
            )
            .then((invitations) => invitations.filter((p) => p.id.endsWith('_Template')))
        : Promise.resolve([])

    try {
      // eslint-disable-next-line no-shadow
      const [groups, invitations, stageInvitations] = await Promise.all([
        getAllGroupsP,
        getAllInvitationsP,
        getStageInvitationTemplatesP,
      ])
      const workFlowInvitations = invitations.filter((p) => workflowInvitationRegex.test(p.id))
      const currentTimeStamp = new Date()
      const groupAndWorkflowInvitations = [
        ...groups.map((p) => ({
          ...p,
          type: 'group',
          formattedCDate: formatDateTime(p.cdate, { second: undefined }),
          passed: p.cdate < currentTimeStamp,
        })),
        ...workFlowInvitations.map((p) => ({
          ...p,
          type: 'invitation',
          formattedCDate: formatDateTime(p.cdate, { second: undefined }),
          passed: p.cdate < currentTimeStamp,
        })),
      ]
      setGroupsAndInvitations(sortBy(groupAndWorkflowInvitations, 'cdate'))
      setAllInvitations(invitations)
      setStageInvitations(stageInvitations)
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
                <span className={stepObj.passed ? 'text-muted' : ''}>
                  {stepObj.formattedCDate}{' '}
                </span>
                <Link href={`/group/edit?id=${stepObj.id}`}>{prettyId(stepObj.id)}</Link>
                <ul>
                  {stepObj.members?.length > 0 && (
                    <li>Member Count : {stepObj.members?.length || 0}</li>
                  )}
                </ul>
              </div>
            )
          }
          const invitationId = stepObj.id
          const subInvitations = allInvitations.filter((i) =>
            i.id.startsWith(`${invitationId}/`)
          )
          return (
            <div key={invitationId}>
              <EditInvitationRow
                invitation={stepObj}
                isDomainGroup={group.id !== group.domain}
              />

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

        {stageInvitations.length > 0 && (
          <AddStageInvitationSection
            stageInvitations={stageInvitations}
            venueId={group.domain}
          />
        )}
      </div>
    </EditorSection>
  )
}

export default WorkFlowInvitations
