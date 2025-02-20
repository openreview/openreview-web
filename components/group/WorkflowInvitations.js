/* eslint-disable arrow-body-style */
/* globals promptError,promptMessage,$: false */
import React, { useEffect, useRef, useState } from 'react'
import { get, orderBy, sortBy } from 'lodash'
import timezone from 'dayjs/plugin/timezone'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { motion } from 'framer-motion'
import EditorSection from '../EditorSection'
import api from '../../lib/api-client'
import {
  formatDateTime,
  getMetaInvitationId,
  getPath,
  getSubInvitationContentFieldDisplayValue,
  prettyField,
  prettyId,
  prettyInvitationId,
} from '../../lib/utils'
import InvitationContentEditor from './InvitationContentEditor'
import Dropdown from '../Dropdown'
import Markdown from '../EditorComponents/Markdown'
import Icon from '../Icon'
import useSocket from '../../hooks/useSocket'
import LoadingSpinner from '../LoadingSpinner'
import useUser from '../../hooks/useUser'

dayjs.extend(isSameOrBefore)
dayjs.extend(timezone)
dayjs.extend(utc)

const WorkflowGroupRow = ({ group, groupInvitations }) => {
  const [activeGroupInvitation, setActivateGroupInvitation] = useState(null)
  return (
    <div className="group-workflow">
      <div className="group-content">
        <div>
          {group.web ? (
            <a
              href={`/group?id=${group.id}&referrer=${encodeURIComponent(
                `[${prettyId(group.domain)} Workflow Step Timeline](/group/edit?id=${group.domain})`
              )}`}
            >
              <span className="group-id">{prettyId(group.id, true)}</span>
            </a>
          ) : (
            <span className="group-id">{prettyId(group.id, true)}</span>
          )}
          <a className="id-icon" href={`/group/edit?id=${group.id}`}>
            <Icon name="new-window" />
          </a>
          <span className="member-count">Group of {group.members?.length}</span>
          <Markdown text={group.description} />
        </div>
        <div className="group-invitations">
          {groupInvitations.map((groupInvitation) => {
            return (
              <div key={groupInvitation.id} className="mb-1">
                <span className="item">Add:</span>
                <button
                  className="btn btn-xs mr-2"
                  onClick={() => setActivateGroupInvitation(groupInvitation)}
                >
                  {prettyInvitationId(groupInvitation.id)}
                </button>
              </div>
            )
          })}
        </div>
        <div>
          {activeGroupInvitation && (
            <InvitationContentEditor
              invitation={activeGroupInvitation}
              existingValue={{}}
              closeInvitationEditor={() => setActivateGroupInvitation(null)}
              onInvitationEditPosted={() => {
                promptMessage('Edit is posted')
              }}
              isGroupInvitation={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const WorflowInvitationRow = ({
  subInvitation,
  workflowInvitation,
  loadWorkflowInvitations,
  domainObject,
  setMissingValueInvitationIds,
  workflowInvitationsRef,
  isCollapsed,
}) => {
  const [showInvitationEditor, setShowInvitationEditor] = useState(false)
  const invitationName = prettyField(subInvitation.id.split('/').pop())
  const [subInvitationContentFieldValues, setSubInvitationContentFieldValues] = useState({})
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
  const handleHover = (fieldName, e) => {
    if (fieldName !== 'activation_date' && fieldName !== 'due_date') return
    const isHoverActivationDate = fieldName === 'activation_date'
    const container = e.target.closest('.workflow-invitation-container')
    if (container) {
      const cdateElement = container.querySelector(
        `.cdate ${isHoverActivationDate ? '.activation-date' : '.due-date'}`
      )
      if (cdateElement) {
        cdateElement.classList.add('highlight')
      }
    }
  }

  const handleHoverEnd = (fieldName, e) => {
    if (fieldName !== 'activation_date' && fieldName !== 'due_date') return
    const isHoverActivationDate = fieldName === 'activation_date'
    const container = e.target.closest('.workflow-invitation-container')
    if (container) {
      const cdateElement = container.querySelector(
        `.cdate ${isHoverActivationDate ? '.activation-date' : '.due-date'}`
      )
      if (cdateElement) {
        cdateElement.classList.remove('highlight')
      }
    }
  }

  useEffect(() => {
    let hasMissingValue = false
    const contentFieldValueMap = {}
    Object.keys(subInvitation.edit?.content ?? {}).forEach((key) => {
      const fieldPath = getPath(subInvitation.edit.invitation, key)
      let displayValue = getSubInvitationContentFieldDisplayValue(
        fieldPath
          ? workflowInvitation
          : { ...domainObject, domain: workflowInvitation.domain },
        fieldPath ?? `${key}.value`,
        subInvitation.edit.content?.[key]?.value?.param?.type
      )
      if (displayValue === 'value missing') {
        displayValue = <span className="missing-value">Missing</span>
        hasMissingValue = true
      }
      contentFieldValueMap[key] = displayValue
    })
    if (hasMissingValue) {
      setMissingValueInvitationIds((invitationIds) => {
        if (invitationIds.includes(workflowInvitation.id)) return invitationIds
        return [...invitationIds, workflowInvitation.id]
      })
    }
    setSubInvitationContentFieldValues(contentFieldValueMap)
  }, [subInvitation])

  if (isCollapsed) return <div className="sub-invitation-container" />
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
                {Object.keys(subInvitationContentFieldValues ?? {}).map((key) => (
                  <li key={key}>
                    <span
                      className="existing-value-field"
                      onMouseEnter={(e) => handleHover(key, e)}
                      onMouseLeave={(e) => handleHoverEnd(key, e)}
                    >
                      {prettyField(key)}:{' '}
                    </span>
                    <span className="existing-value-field-value">
                      {subInvitationContentFieldValues[key]}
                    </span>
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
                onInvitationEditPosted={() => {
                  loadWorkflowInvitations()
                  setTimeout(() => {
                    const ref = workflowInvitationsRef.current?.[workflowInvitation.id]
                    if (ref) {
                      const rect = ref.getBoundingClientRect()
                      if (rect.top < 0 || rect.bottom > window.innerHeight)
                        ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }, 500)
                }}
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

const EditInvitationProcessLogStatus = ({ processLogs, isMissingValue }) => {
  if (isMissingValue) {
    return (
      <span className="log-status">
        <span className="fixed-text">Status:</span>
        <span className="fixed-text missing-value"> Missing value</span>
      </span>
    )
  }
  const runningProcessLog = processLogs.find((p) => p.status === 'running')
  if (runningProcessLog) {
    const formattedDate = runningProcessLog?.sdate
      ? formatDateTime(runningProcessLog.sdate, {
          second: undefined,
          timeZoneName: 'short',
          hour12: false,
        })
      : null
    return (
      <span className="log-status">
        <span className="fixed-text">Status:</span> {formattedDate}
        <span className="fixed-text">. Running…</span>
      </span>
    )
  }
  const lastProcessLog = processLogs?.[0]
  const lastLogMessage = lastProcessLog?.log?.length
    ? lastProcessLog.log[lastProcessLog.log.length - 1]
    : null
  const formattedDate = lastProcessLog?.edate
    ? formatDateTime(lastProcessLog.edate, {
        second: undefined,
        timeZoneName: 'short',
        hour12: false,
      })
    : null

  const lastLogUrl = `${process.env.API_V2_URL}/logs/process?id=${lastProcessLog?.id}`
  switch (lastProcessLog?.status) {
    case 'ok':
      return (
        <span className="log-status">
          {' '}
          <span className="fixed-text">Status:</span> {formattedDate}{' '}
          <span className="fixed-text">. {lastLogMessage ?? 'OK'}.</span>{' '}
          <a
            className="log-details"
            href={lastLogUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            details
          </a>
        </span>
      )
    case 'error':
      return (
        <span className="log-status">
          <span className="fixed-text">Status:</span> {formattedDate}{' '}
          <span className="fixed-text">. ERROR</span>
          {lastLogMessage ? `: ${lastLogMessage}` : '.'}{' '}
          <a
            className="log-details"
            href={lastLogUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            details
          </a>
        </span>
      )
    case 'queued':
      return (
        <span className="log-status">
          <span className="fixed-text">Status:</span> {formattedDate}{' '}
          <span className="fixed-text">. QUEUED</span>{' '}
          <a
            className="log-details"
            href={lastLogUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            details
          </a>
        </span>
      )
    default:
      return null
  }
}

const EditInvitationRow = ({
  invitation,
  isDomainGroup,
  processLogs,
  isExpired,
  loadWorkflowInvitations,
  isCollapsed,
  isMissingValue,
  setCollapsedWorkflowInvitationIds,
}) => {
  const [showEditor, setShowEditor] = useState(false)
  const { user, accessToken } = useUser()
  const profileId = user?.profile?.id

  const innerInvitationInvitee = invitation.edit?.invitation?.invitees
  const invitees = innerInvitationInvitee ?? invitation.invitees
  const isCreatingSubInvitations = invitation.dateprocesses?.length > 0

  const renderInvitee = (invitee) => {
    if (invitee === invitation.domain) return 'Administrators'
    if (invitee === '~') return 'Registered Users'
    return prettyId(invitee.replace(invitation.domain, ''))
      .split(/\{(\S+\s*\S*)\}/g)
      .map((segment, segmentIndex) =>
        segmentIndex % 2 !== 0 ? <em key={segmentIndex}>{segment}</em> : segment
      )
  }

  const expireRestoreInvitation = async () => {
    try {
      await api.post(
        '/invitations/edits',
        {
          invitation: {
            cdate: invitation.cdate,
            id: invitation.id,
            signatures: invitation.signatures,
            bulk: invitation.bulk,
            duedate: invitation.duedate,
            expdate: isExpired ? { delete: true } : dayjs().valueOf(),
            invitees: invitation.invitees,
            noninvitees: invitation.noninvitees,
            nonreaders: invitation.nonreaders,
            readers: invitation.readers,
            writers: invitation.writers,
          },
          readers: [profileId],
          writers: [profileId],
          signatures: [profileId],
          invitations: getMetaInvitationId(invitation),
        },
        { accessToken }
      )
      promptMessage(
        `${prettyId(invitation.id)} has been ${isExpired ? 'restored' : 'skipped'}.`,
        { scrollToTop: false }
      )
      loadWorkflowInvitations()
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <div className="edit-invitation-container">
      <div className="invitation-content">
        <div className="invitation-id-container">
          <div
            className="collapse-invitation"
            onClick={() => {
              if (isCollapsed) {
                setCollapsedWorkflowInvitationIds((ids) =>
                  ids.filter((id) => id !== invitation.id)
                )
              } else {
                setCollapsedWorkflowInvitationIds((ids) => [...ids, invitation.id])
              }
            }}
          >
            <Icon name={isCollapsed ? 'triangle-bottom' : 'triangle-top'} />
          </div>
          <span className="workflow-invitation-id">
            {prettyId(invitation.id.replace(invitation.domain, ''))}
          </span>
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
                {renderInvitee(p)}
                {index < invitees.length - 1 && ', '}
              </span>
            ))}
          </div>
          <div className="expire-link" onClick={expireRestoreInvitation}>
            <a>{isExpired ? 'Enable' : 'Disable'}</a>
          </div>
        </div>
        {invitation.description && <Markdown text={invitation.description} />}
        {isCreatingSubInvitations && (
          <EditInvitationProcessLogStatus
            processLogs={processLogs.filter((p) => p.invitation === invitation.id)}
            isMissingValue={isMissingValue}
          />
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
  const [workflowGroups, setWorkflowGroups] = useState([])
  const [workflowInvitations, setWorkflowInvitations] = useState([])
  const [stageInvitations, setStageInvitations] = useState([])
  const [processLogs, setProcessLogs] = useState([])
  const [missingValueInvitationIds, setMissingValueInvitationIds] = useState([])
  const events = useSocket('venue/workflow', ['date-process-updated'], { venueid: groupId })
  const workflowInvitationsRef = useRef({})
  const [collapsedWorkflowInvitationIds, setCollapsedWorkflowInvitationIds] = useState([])

  const loadProcessLogs = async () => {
    try {
      const response = await api.getAll(
        '/logs/process',
        {
          invitation: `${groupId}.*`,
          select: 'id,sdate,edate,invitation,status,log',
        },
        { accessToken, resultsKey: 'logs' }
      )

      setProcessLogs(orderBy(response, ['edate'], ['desc']))
    } catch (error) {
      promptError(error.message)
    }
  }

  const loadAllInvitations = async () => {
    setMissingValueInvitationIds([])
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
      { prefix: groupId, expired: true, type: 'all', details: 'writableWith' },
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

      const specifiedWorkflowInvitations = group.content?.workflow_invitations?.value
      const workFlowInvitations = specifiedWorkflowInvitations?.length
        ? invitations.filter((p) => specifiedWorkflowInvitations.includes(p.id))
        : []

      setCollapsedWorkflowInvitationIds(workFlowInvitations.map((p) => p.id))
      setWorkflowInvitations(sortBy(workFlowInvitations, 'cdate'))
      setWorkflowGroups(sortBy(groups, 'cdate'))
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
      $('[data-toggle="tooltip"]').attr('data-tooltip-visible', 'true')
    }
  }, [workflowInvitations])

  useEffect(() => {
    if (!groupId) return
    loadAllInvitations()
  }, [groupId])

  useEffect(() => {
    if (!events) return
    const eventsHandler = setTimeout(() => {
      loadProcessLogs()
    }, 5000)

    // eslint-disable-next-line consistent-return
    return () => {
      clearTimeout(eventsHandler)
    }
  }, [events?.uniqueId])

  return (
    <>
      {workflowGroups.length > 0 && (
        <EditorSection
          title={`Workflow Groups (${workflowGroups.length})`}
          className="workflow"
        >
          <div className=" group-workflow-container">
            {workflowGroups.map((stepObj) => {
              const groupInvitationsForGroup = allInvitations.filter(
                (p) => p.edit?.group?.id === stepObj.id
              )
              return (
                <WorkflowGroupRow
                  key={stepObj.id}
                  group={stepObj}
                  groupInvitations={groupInvitationsForGroup}
                />
              )
            })}
          </div>
        </EditorSection>
      )}
      {workflowInvitations.length > 0 && (
        <EditorSection
          title={`Workflow Invitations (${workflowInvitations.length})`}
          className="workflow"
        >
          <div className="workflow-invitations-header">
            <div className="cdate-header">Activation Dates</div>
            <div className="invtations-header">
              <div
                className="collapse-invitation"
                onClick={() => {
                  if (collapsedWorkflowInvitationIds.length) {
                    setCollapsedWorkflowInvitationIds([])
                  } else {
                    setCollapsedWorkflowInvitationIds(workflowInvitations.map((p) => p.id))
                  }
                }}
              >
                <Icon
                  name={
                    collapsedWorkflowInvitationIds.length ? 'triangle-bottom' : 'triangle-top'
                  }
                />
              </div>
              <span>
                Workflow Step Invitations
                {missingValueInvitationIds.length ? (
                  <>
                    {' '}
                    -
                    <span className="missing-value">
                      {`  ${missingValueInvitationIds.length} steps require to enter missing
                    values in order to be ready to run`}
                    </span>
                  </>
                ) : (
                  ''
                )}
              </span>
            </div>
          </div>

          <hr />
          <div className="container invitation-workflow-container">
            {workflowInvitations.map((stepObj, index) => {
              const invitationId = stepObj.id
              const subInvitations = allInvitations.filter(
                (i) => i.edit?.invitation?.id === invitationId
              )
              const isBeforeToday = dayjs(stepObj.cdate).isSameOrBefore(dayjs())
              const isExpired = dayjs(stepObj.expdate).isBefore(dayjs())
              const isNextStepAfterToday = dayjs(
                workflowInvitations[index + 1]?.cdate
              ).isAfter(dayjs())
              const isCollapsed = collapsedWorkflowInvitationIds.includes(stepObj.id)
              const isMissingValue = missingValueInvitationIds.includes(invitationId)
              const isStageInvitation = stepObj.duedate || stepObj.edit?.invitation
              const formattedCDate = formatDateTime(stepObj.cdate, {
                second: undefined,
                minute: undefined,
                hour: undefined,
                year: undefined,
                weekday: 'short',
              })
              const formattedDueDate = formatDateTime(
                isStageInvitation
                  ? (stepObj.duedate ?? stepObj.edit?.invitation?.duedate)
                  : stepObj.duedate,
                {
                  second: undefined,
                  minute: undefined,
                  hour: undefined,
                  year: undefined,
                  weekday: 'short',
                }
              )
              const formattedCDateWithTime = formatDateTime(stepObj.cdate, {
                second: undefined,
                year: undefined,
                weekday: 'short',
              })
              const formattedDueDateWithTime = formatDateTime(
                isStageInvitation
                  ? (stepObj.duedate ?? stepObj.edit?.invitation?.duedate)
                  : stepObj.duedate,
                {
                  second: undefined,
                  year: undefined,
                  weekday: 'short',
                }
              )
              const formattedExpDateWithTime = formatDateTime(
                isStageInvitation
                  ? (stepObj.expdate ?? stepObj.edit?.invitation?.expdate)
                  : stepObj.expdate,
                {
                  second: undefined,
                  year: undefined,
                  weekday: 'short',
                }
              )
              let formattedDate = null
              const formattedTooltip = `Activation Date: ${formattedCDateWithTime}${formattedDueDateWithTime ? `<br/>Due Date: ${formattedDueDateWithTime}` : ''}${formattedExpDateWithTime ? `<br/>Expiration Date: ${formattedExpDateWithTime}` : ''}`
              if (isStageInvitation) {
                formattedDate = (
                  <div className="cdate" data-toggle="tooltip" title={formattedTooltip}>
                    <span className="activation-date">{formattedCDate}</span>
                    <br />
                    <span className="due-date">{`${formattedDueDate ?? 'no deadline'}`}</span>
                  </div>
                )
              } else {
                formattedDate = (
                  <div className="cdate" data-toggle="tooltip" title={formattedTooltip}>
                    <span className="activation-date">{formattedCDate}</span>
                  </div>
                )
              }

              if (isBeforeToday && isNextStepAfterToday) {
                return (
                  <motion.div
                    layout="position"
                    key={invitationId}
                    transition={{ duration: 0.5 }}
                    ref={(el) => {
                      workflowInvitationsRef.current[invitationId] = el
                    }}
                  >
                    <React.Fragment key={invitationId}>
                      <div
                        className={`workflow-invitation-container date-passed${isExpired ? ' expired' : ''}`}
                      >
                        <div
                          className={`invitation-cdate${isMissingValue ? ' missing-value' : ''}`}
                        >
                          {formattedDate}
                        </div>
                        <div className="edit-invitation-info">
                          <EditInvitationRow
                            invitation={stepObj}
                            isDomainGroup={group.id !== group.domain}
                            processLogs={processLogs}
                            isExpired={isExpired}
                            loadWorkflowInvitations={loadAllInvitations}
                            isCollapsed={isCollapsed}
                            isMissingValue={isMissingValue}
                            setCollapsedWorkflowInvitationIds={
                              setCollapsedWorkflowInvitationIds
                            }
                          />

                          {subInvitations.length > 0 &&
                            subInvitations.map((subInvitation) => (
                              <WorflowInvitationRow
                                key={subInvitation.id}
                                subInvitation={subInvitation}
                                workflowInvitation={stepObj}
                                loadWorkflowInvitations={loadAllInvitations}
                                domainObject={group.content}
                                setMissingValueInvitationIds={setMissingValueInvitationIds}
                                workflowInvitationsRef={workflowInvitationsRef}
                                isCollapsed={isCollapsed}
                              />
                            ))}
                        </div>
                      </div>
                      <div key="today" className="workflow-invitation-container">
                        <div className="invitation-cdate ">
                          <div className="collapse-invitation" />
                          <div className="cdate">
                            {formatDateTime(dayjs().valueOf(), {
                              second: undefined,
                              minute: undefined,
                              hour: undefined,
                              year: undefined,
                              weekday: 'short',
                            })}{' '}
                          </div>
                        </div>
                        <span className="invitation-content today">
                          Now
                          {/* eslint-disable-next-line max-len */}
                          --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
                        </span>
                      </div>
                    </React.Fragment>
                  </motion.div>
                )
              }
              return (
                <motion.div
                  layout="position"
                  key={invitationId}
                  transition={{ duration: 0.5 }}
                  ref={(el) => {
                    workflowInvitationsRef.current[invitationId] = el
                  }}
                >
                  <div
                    key={invitationId}
                    className={`workflow-invitation-container${isExpired ? ' expired' : ''}${isBeforeToday ? ' date-passed' : ''}`}
                  >
                    <div
                      className={`invitation-cdate${isMissingValue ? ' missing-value' : ''}`}
                    >
                      {formattedDate}
                    </div>
                    <div className="edit-invitation-info">
                      <EditInvitationRow
                        invitation={stepObj}
                        isDomainGroup={group.id !== group.domain}
                        processLogs={processLogs}
                        isExpired={isExpired}
                        loadWorkflowInvitations={loadAllInvitations}
                        isCollapsed={isCollapsed}
                        isMissingValue={isMissingValue}
                        setCollapsedWorkflowInvitationIds={setCollapsedWorkflowInvitationIds}
                      />

                      {subInvitations.length > 0 &&
                        subInvitations.map((subInvitation) => (
                          <WorflowInvitationRow
                            key={subInvitation.id}
                            subInvitation={subInvitation}
                            workflowInvitation={stepObj}
                            loadWorkflowInvitations={loadAllInvitations}
                            domainObject={group.content}
                            setMissingValueInvitationIds={setMissingValueInvitationIds}
                            workflowInvitationsRef={workflowInvitationsRef}
                            isCollapsed={isCollapsed}
                          />
                        ))}
                    </div>
                  </div>
                </motion.div>
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
