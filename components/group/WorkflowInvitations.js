/* globals promptError,promptMessage,$: false */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { get, sortBy } from 'lodash'
import timezone from 'dayjs/plugin/timezone'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import EditorSection from '../EditorSection'
import api from '../../lib/api-client'
import {
  formatDateTime,
  getPath,
  getSubInvitationContentFieldDisplayValue,
  prettyField,
  prettyId,
} from '../../lib/utils'
import InvitationContentEditor from './InvitationContentEditor'
import Dropdown from '../Dropdown'
import Markdown from '../EditorComponents/Markdown'
import Icon from '../Icon'
import useInterval from '../../hooks/useInterval'
import LoadingSpinner from '../LoadingSpinner'

dayjs.extend(isSameOrBefore)
dayjs.extend(timezone)
dayjs.extend(utc)

const WorflowInvitationRow = ({
  subInvitation,
  workflowInvitation,
  loadWorkflowInvitations,
  domainObject,
}) => {
  const [showInvitationEditor, setShowInvitationEditor] = useState(false)
  const invitationName = prettyField(subInvitation.id.split('/').pop())
  const isGroupInvitation = subInvitation.edit?.group // sub invitation can be group invitation too

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
    <div className="sub-invitation-container">
      <ul>
        <li>
          <div>
            <div>
              {isGroupInvitation ? (
                <button
                  className="btn btn-xs mr-2"
                  onClick={() => setShowInvitationEditor(true)}
                >
                  Add
                </button>
              ) : (
                // eslint-disable-next-line jsx-a11y/anchor-is-valid
                <a
                  href="#"
                  className="mr-2"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowInvitationEditor((isOpen) => !isOpen)
                  }}
                >
                  {showInvitationEditor ? 'Close' : 'Edit'}
                </a>
              )}
              <span>{invitationName}</span>
            </div>
            <Markdown text={subInvitation.description} />

            {!isGroupInvitation && (
              <ul>
                {Object.keys(subInvitation.edit?.content ?? {}).map((key) => {
                  const fieldPath = getPath(subInvitation.edit.invitation, key)
                  return (
                    <li key={key}>
                      <span className="existing-value-field">{prettyField(key)}: </span>
                      <span className="existing-value-field-value">
                        {getSubInvitationContentFieldDisplayValue(
                          fieldPath
                            ? workflowInvitation
                            : { ...domainObject, domain: workflowInvitation.domain },
                          fieldPath ?? `${key}.value`,
                          subInvitation.edit.content?.[key]?.value?.param?.type
                        )}
                      </span>
                    </li>
                  )
                })}
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
    </div>
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

const EditInvitationRow = ({ invitation, isDomainGroup, isRunningProcessFunctions }) => {
  const [showEditor, setShowEditor] = useState(false)

  const innerInvitationInvitee = invitation.edit?.invitation?.invitees
  const invitees = innerInvitationInvitee ?? invitation.invitees

  return (
    <div className="edit-invitation-container">
      <div className="invitation-content">
        <div className="invitation-id-container">
          <Link
            href={`/invitation/edit?id=${invitation.id}`}
            className="workflow-invitation-id"
          >
            {prettyId(invitation.id.replace(invitation.domain, ''), true)}
          </Link>
          <a className="id-icon" href={`/invitation/edit?id=${invitation.id}`}>
            <Icon name="new-window" />
          </a>
          {invitation.edit?.content && isDomainGroup && !showEditor && (
            <button className="btn btn-xs ml-2" onClick={() => setShowEditor(true)}>
              Add
            </button>
          )}
          {/* TODO: won't know inner invitation is per submission or per what */}
          <div
            className="invitation-invitee"
            data-toggle="tooltip"
            title={invitees?.join('<br/>')}
          >
            invitation to{' '}
            {invitees.map((p, index) => (
              <span key={index}>
                {p === invitation.domain
                  ? 'Administrators'
                  : prettyId(p.replace(invitation.domain, ''))
                      .split(/\{(\S+\s*\S*)\}/g)
                      .map((segment, segmentIndex) =>
                        segmentIndex % 2 !== 0 ? (
                          <em key={segmentIndex}>{segment}</em>
                        ) : (
                          segment
                        )
                      )}
                {index < invitees.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
        {invitation.description && <Markdown text={invitation.description} />}
        {isRunningProcessFunctions && <LoadingSpinner inline text={null} />}
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
  const [workflowGroups, setWorkflowGroups] = useState([])
  const [workflowInvitations, setWorkflowInvitations] = useState([])
  const [stageInvitations, setStageInvitations] = useState([])
  const [runningInvitations, setRunningInvitations] = useState([])
  const workflowInvitationRegex = RegExp(`^${groupId}/-/[^/]+$`)

  const loadProcessLogs = async () => {
    try {
      const processLogs = await api.getAll(
        '/logs/process',
        {
          invitation: `${groupId}/-/.*`,
          status: 'running',
          select: 'invitation',
        },
        { accessToken, resultsKey: 'logs' }
      )
      setRunningInvitations(processLogs.map((p) => p.invitation))
    } catch (error) {
      promptError(error.message)
    }
  }

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
      { prefix: `${groupId}/-/.*`, expired: true, type: 'all', details: 'writableWith' },
      { accessToken }
    )

    let getStageInvitationTemplatesP =
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
    getStageInvitationTemplatesP = Promise.resolve([])

    try {
      // eslint-disable-next-line no-shadow
      const [groups, invitations, stageInvitations] = await Promise.all([
        getAllGroupsP,
        getAllInvitationsP,
        getStageInvitationTemplatesP,
      ])
      const workFlowInvitations = invitations.filter(
        (p) => workflowInvitationRegex.test(p.id) && p.type !== 'meta'
      )
      const currentTimeStamp = new Date()
      setWorkflowInvitations(
        sortBy(
          workFlowInvitations.map((p) => ({
            ...p,
            formattedCDate: formatDateTime(p.cdate, {
              second: undefined,
              locale: 'en-GB',
              timeZoneName: 'short',
              hour12: false,
            }),
          })),
          'cdate'
        )
      )
      setWorkflowGroups(
        sortBy(
          groups.map((p) => ({
            ...p,
            formattedCDate: formatDateTime(p.cdate, {
              second: undefined,
              minute: undefined,
              hour: undefined,
              locale: 'en-GB',
            }),
          })),
          'cdate'
        )
      )
      setAllInvitations(invitations)
      setStageInvitations(stageInvitations)
      loadProcessLogs()
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (workflowInvitations?.length > 0) {
      $('[data-toggle="tooltip"]').tooltip({ html: true })
    }
  }, [workflowInvitations])

  useEffect(() => {
    if (!groupId) return
    loadAllInvitations()
  }, [groupId])

  useInterval(() => {
    if (!workflowInvitations.length) return
    loadProcessLogs()
  }, 5000)

  return (
    <>
      {workflowGroups.length > 0 && (
        <EditorSection
          title={`Workflow Groups (${workflowGroups.length})`}
          className="workflow"
        >
          <div className="container group-workflow-container">
            {workflowGroups.map((stepObj) => (
              <div key={stepObj.id} className="group-workflow">
                <span className="group-cdate">{stepObj.formattedCDate} </span>
                <div className="group-content">
                  <Link href={`/group/edit?id=${stepObj.id}`} className="group-id">
                    {prettyId(stepObj.id, true)}
                  </Link>
                  <a className="id-icon" href={`/group/edit?id=${stepObj.id}`}>
                    <Icon name="new-window" />
                  </a>
                  <span className="member-count">Group of {stepObj.members?.length}</span>
                  <Markdown text={stepObj.description} />
                </div>
              </div>
            ))}
          </div>
        </EditorSection>
      )}
      {workflowInvitations.length > 0 && (
        <EditorSection
          title={`Workflow Invitations (${workflowInvitations.length})`}
          className="workflow"
        >
          <div className="workflow-invitations-header">
            <span className="cdate-header">Activation Dates</span>
            <span className="invtations-header">Workflow Step Invitations</span>
          </div>

          <hr />
          <div className="container invitation-workflow-container">
            {workflowInvitations.map((stepObj, index) => {
              const invitationId = stepObj.id
              const subInvitations = allInvitations.filter((i) =>
                i.id.startsWith(`${invitationId}/`)
              )
              const isBeforeToday = dayjs(stepObj.cdate).isSameOrBefore(dayjs())
              const isNextStepAfterToday = dayjs(
                workflowInvitations[index + 1]?.cdate
              ).isAfter(dayjs())

              if (isBeforeToday && isNextStepAfterToday) {
                return (
                  <div key="today" className="workflow-invitation-container">
                    <div className="invitation-cdate">
                      {formatDateTime(dayjs().valueOf(), {
                        second: undefined,
                        minute: undefined,
                        hour: undefined,
                        locale: 'en-GB',
                      })}{' '}
                    </div>
                    <span className="invitation-content today">
                      TODAY
                      {/* eslint-disable-next-line max-len */}
                      --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
                    </span>
                  </div>
                )
              }
              return (
                <div key={invitationId} className="workflow-invitation-container">
                  <div className="invitation-cdate">{stepObj.formattedCDate}</div>
                  <div className="edit-invitation-info">
                    <EditInvitationRow
                      invitation={stepObj}
                      isDomainGroup={group.id !== group.domain}
                      isRunningProcessFunctions={runningInvitations.includes(invitationId)}
                    />

                    {subInvitations.length > 0 &&
                      subInvitations.map((subInvitation) => (
                        <WorflowInvitationRow
                          key={subInvitation.id}
                          subInvitation={subInvitation}
                          workflowInvitation={stepObj}
                          loadWorkflowInvitations={loadAllInvitations}
                          domainObject={group.content}
                        />
                      ))}
                  </div>
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
      )}
    </>
  )
}

export default WorkFlowInvitations
