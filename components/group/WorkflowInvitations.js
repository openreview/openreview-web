/* eslint-disable arrow-body-style */
/* globals promptError,promptMessage,$: false */
import React, { useEffect, useRef, useState } from 'react'
import { orderBy, sortBy, get, set } from 'lodash'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { motion } from 'framer-motion'
import EditorSection from '../EditorSection'
import api from '../../lib/api-client'
import {
  formatDateTime,
  inflect,
  prettyId,
  prettyInvitationId,
  prettyField,
  getPath,
  getSubInvitationContentFieldDisplayValue,
  getMetaInvitationId,
} from '../../lib/utils'
import InvitationEditor from './InvitationEditor'
import Dropdown from '../Dropdown'
import Markdown from '../EditorComponents/Markdown'
import Icon from '../Icon'
import useSocket from '../../hooks/useSocket'
import useUser from '../../hooks/useUser'

dayjs.extend(isSameOrBefore)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(relativeTime)

const EditInvitationProcessLogStatus = ({ processLogs, isMissingValue }) => {
  if (isMissingValue) {
    return (
      <span className="log-status">
        <span className="fixed-text">Status:</span>
        <span className="fixed-text missing-value"> Configuration tasks are pending</span>
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

const WorkflowTasks = ({ workflowTasks, setCollapsedWorkflowInvitationIds }) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const numPending = workflowTasks.filter((p) => !p.isCompleted).length
  const numCompleted = workflowTasks.filter((p) => p.isCompleted).length

  const openSubInvitation = (task) => {
    setCollapsedWorkflowInvitationIds((ids) =>
      ids.filter((id) => id !== task.workflowInvitation.id)
    )

    setTimeout(() => {
      const element = $(`.sub-invitation-container[data-invitation-id="${task.id}"]`)
      if (element.length > 0) {
        element[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
      const editButton = element.find('a:contains("Edit")')
      if (editButton.length > 0) {
        editButton[0].click()
      }
    }, 100)
  }
  if (!workflowTasks.length) return null

  return (
    <section className="workflow">
      <div
        className="collapse-invitation"
        onClick={() => {
          setIsCollapsed((collapse) => !collapse)
        }}
      >
        <div className="task-header">
          <div className="task-title">
            <h4>Program Chairs Configuration Tasks</h4>
            <span className="text-muted">{`Show ${inflect(numPending, 'pending task', 'pending tasks', true)}${
              numCompleted
                ? ` and ${inflect(numCompleted, 'completed task', 'completed tasks', true)}`
                : ''
            }`}</span>
          </div>
          <Icon name={isCollapsed ? 'triangle-bottom' : 'triangle-top'} />
        </div>
      </div>
      {!isCollapsed && (
        <div className="tasks-list">
          {workflowTasks.map((task) => {
            return (
              <div
                className={`task-container${task.isCompleted ? ' completed' : ''}`}
                key={task.id}
              >
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a className="task-name" onClick={() => openSubInvitation(task)}>
                  {prettyInvitationId(task.id)}
                </a>
                <div className={`task-due-date`}>{`Due: ${formatDateTime(task.duedate, {
                  month: 'long',
                  timeZoneName: 'short',
                })}`}</div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

const WorkflowInvitationRow = ({
  invitation,
  subInvitations,
  isDomainGroup,
  processLogs,
  isExpired,
  loadWorkflowInvitations,
  isMissingValue,
  collapsedWorkflowInvitationIds,
  handleExpandCollapseSubInvitations,
  workflowTasks,
}) => {
  const [showEditor, setShowEditor] = useState(false)
  const { user, accessToken } = useUser()
  const profileId = user?.profile?.id

  const innerInvitationInvitee = invitation.edit?.invitation?.invitees
  const invitees = innerInvitationInvitee ?? invitation.invitees
  const isCreatingSubInvitations = invitation.dateprocesses?.length > 0
  const isCollapsed = collapsedWorkflowInvitationIds.includes(invitation.id)
  const pendingTasks = workflowTasks.filter(
    (p) => p.workflowInvitation.id === invitation.id && !p.isCompleted
  )
  const earliestDueDate =
    pendingTasks.length > 0 ? Math.min(...pendingTasks.map((p) => p.duedate)) : null

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
      const expireRestoreInvitationPs = [invitation, ...subInvitations].map((p) =>
        api.post(
          '/invitations/edits',
          {
            invitation: {
              cdate: p.cdate,
              ddate: isExpired ? { delete: true } : dayjs().valueOf(),
              id: p.id,
              signatures: p.signatures,
              bulk: p.bulk,
              duedate: p.duedate,
              expdate: p.expdate,
              invitees: p.invitees,
              noninvitees: p.noninvitees,
              nonreaders: p.nonreaders,
              readers: p.readers,
              writers: p.writers,
            },
            readers: [profileId],
            writers: [profileId],
            signatures: [profileId],
            invitations: getMetaInvitationId(p),
          },
          { accessToken }
        )
      )
      await Promise.all(expireRestoreInvitationPs)
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
    <>
      <div className="edit-invitation-container">
        <div className="invitation-content">
          <div className="invitation-id-container">
            <div
              className="collapse-invitation"
              onClick={() => handleExpandCollapseSubInvitations(invitation.id)}
            >
              <Icon name={isCollapsed ? 'triangle-bottom' : 'triangle-top'} />
            </div>
            <span
              className="workflow-invitation-id"
              onClick={() => handleExpandCollapseSubInvitations(invitation.id)}
            >
              {prettyId(invitation.id.replace(invitation.domain, ''))}
            </span>
            {/* <a className="id-icon" href={`/invitation/edit?id=${invitation.id}`}>
              <Icon name="new-window" />
            </a> */}
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
          {invitation.description && (
            <div className="invitation-description">
              <Markdown text={invitation.description} />
            </div>
          )}
          {earliestDueDate && (
            <span className="missing-value">
              Configuration tasks due {dayjs(earliestDueDate).fromNow()}
            </span>
          )}
          {isCreatingSubInvitations && (
            <EditInvitationProcessLogStatus
              processLogs={processLogs.filter((p) => p.invitation === invitation.id)}
              isMissingValue={isMissingValue}
            />
          )}
        </div>

        {showEditor && (
          <div className="content-editor-container">
            <InvitationEditor
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
    </>
  )
}

const SubInvitationRow = ({
  subInvitation,
  workflowInvitation,
  loadWorkflowInvitations,
  domainObject,
  setMissingValueInvitationIds,
  workflowInvitationsRef,
  collapsedWorkflowInvitationIds,
  workflowTasks,
}) => {
  const [showInvitationEditor, setShowInvitationEditor] = useState(false)
  const invitationName = prettyField(subInvitation.id.split('/').pop())
  const [subInvitationContentFieldValues, setSubInvitationContentFieldValues] = useState({})
  const isGroupInvitation = subInvitation.edit?.group // sub invitation can be group invitation too
  const isCollapsed = collapsedWorkflowInvitationIds.includes(workflowInvitation.id)
  const isTaskCompleted = workflowTasks.find((p) => p.id === subInvitation.id && p.isCompleted)

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
        displayValue = <span className="missing-value">Configuration tasks are pending</span>
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
    <div className="sub-invitation-container" data-invitation-id={subInvitation.id}>
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
              {subInvitation.duedate && !isTaskCompleted && (
                <span className="sub-invitation-due-date">
                  Configure by{' '}
                  {formatDateTime(subInvitation.duedate, {
                    month: 'long',
                    timeZoneName: 'short',
                  })}
                </span>
              )}
            </div>
            <div className="sub-invitation-description">
              <Markdown text={subInvitation.description} />
            </div>

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
              <InvitationEditor
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

const WorkflowGroupRow = ({ group, groupInvitations }) => {
  const [activeGroupInvitation, setActivateGroupInvitation] = useState(null)
  return (
    <div className="group-workflow">
      <div className="group-content">
        <div>
          {group.web ? (
            <a
              href={`/group?id=${group.id}&referrer=${encodeURIComponent(
                `[${prettyId(group.domain)} Workflow Step Timeline](/group/info?id=${group.domain})`
              )}`}
            >
              <span className="group-id">{prettyId(group.id, true)}</span>
            </a>
          ) : (
            <span className="group-id">{prettyId(group.id, true)}</span>
          )}
          <a className="id-icon" href={`/group/info?id=${group.id}`}>
            <Icon name="new-window" />
          </a>
          <span className="member-count">Group of {group.members?.length}</span>
          <div className="group-description">
            <Markdown text={group.description} />
          </div>
        </div>
        <div className="group-invitations">
          {groupInvitations.map((groupInvitation) => {
            return (
              <div key={groupInvitation.id} className="mb-1">
                <span className="item">Add:</span>
                <button
                  className="btn btn-xs mr-2"
                  onClick={() =>
                    setActivateGroupInvitation(activeGroupInvitation ? null : groupInvitation)
                  }
                >
                  {prettyInvitationId(groupInvitation.id)}
                </button>
              </div>
            )
          })}
        </div>
        <div className="group-description">
          <Markdown text={activeGroupInvitation?.description} />
        </div>
        <div>
          {activeGroupInvitation && (
            <>
              <InvitationEditor
                invitation={activeGroupInvitation}
                existingValue={{}}
                closeInvitationEditor={() => setActivateGroupInvitation(null)}
                onInvitationEditPosted={() => {
                  promptMessage('Edit is posted')
                }}
                isGroupInvitation={true}
              />
            </>
          )}
        </div>
      </div>
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
        <InvitationEditor
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
  const [workflowTasks, setWorkflowTasks] = useState([])

  const sortWorkflowInvitations = (invitations) => {
    // return sortBy(invitations, 'cdate')
    const passedInvitations = invitations.filter((p) =>
      p.sectionClass.includes('section-passed')
    )
    const activeInvitations = invitations.filter((p) =>
      p.sectionClass.includes('section-active')
    )
    const scheduledInvitations = invitations.filter((p) =>
      p.sectionClass.includes('section-scheduled')
    )
    const noSectionInvitations = invitations.filter((p) => !p.sectionClass)
    return [
      ...sortBy(passedInvitations, 'expdate'),
      ...sortBy(activeInvitations, 'cdate'),
      ...sortBy(scheduledInvitations, 'cdate'),
      ...sortBy(noSectionInvitations, 'cdate'),
    ]
  }

  const handleExpandCollapseSubInvitations = (invitationId) => {
    if (collapsedWorkflowInvitationIds.includes(invitationId)) {
      setCollapsedWorkflowInvitationIds((ids) => ids.filter((id) => id !== invitationId))
    } else {
      setCollapsedWorkflowInvitationIds((ids) => [...ids, invitationId])
    }
  }

  const formatWorkflowInvitation = (stepObj, invitations, logs) => {
    const invitationId = stepObj.id
    const isStageInvitation = stepObj.duedate || stepObj.edit?.invitation
    const subInvitations = invitations.filter((i) => i.edit?.invitation?.id === invitationId)
    const invitationTasks = subInvitations.flatMap((p) => {
      if (!p.duedate) return []
      return {
        ...p,
        isCompleted: stepObj.invitations?.includes(p.id),
      }
    })
    const isExpired = stepObj.ddate

    // const isCollapsed = collapsedWorkflowInvitationIds.includes(stepObj.id)
    const isMissingValue = missingValueInvitationIds.includes(invitationId)

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
    const handleHover = (fieldName, e) => {
      const container = e.target.closest('.workflow-invitation-container')
      if (container) {
        const subInvitationContentValueFields =
          container.querySelectorAll('.existing-value-field')
        const matchingElement = [...subInvitationContentValueFields]?.find((node) =>
          node.textContent.startsWith(prettyField(fieldName))
        )
        if (matchingElement) {
          matchingElement.classList.add('highlight')
        }
      }
    }

    const handleHoverEnd = (fieldName, e) => {
      const container = e.target.closest('.workflow-invitation-container')
      if (container) {
        const subInvitationContentValueFields =
          container.querySelectorAll('.existing-value-field')
        const matchingElement = [...subInvitationContentValueFields]?.find((node) =>
          node.textContent.startsWith(prettyField(fieldName))
        )
        if (matchingElement) {
          matchingElement.classList.remove('highlight')
        }
      }
    }

    if (isStageInvitation) {
      formattedDate = (
        <div
          className="cdate"
          data-toggle="tooltip"
          title={formattedTooltip}
          onClick={() => handleExpandCollapseSubInvitations(invitationId)}
        >
          <span
            className="activation-date"
            onMouseEnter={(e) => handleHover('activation_date', e)}
            onMouseLeave={(e) => handleHoverEnd('activation_date', e)}
          >
            {formattedCDate}
          </span>
          <br />
          <span
            className="due-date"
            onMouseEnter={(e) => handleHover('due_date', e)}
            onMouseLeave={(e) => handleHoverEnd('due_date', e)}
          >{`${formattedDueDate ?? 'no deadline'}`}</span>
        </div>
      )
    } else {
      formattedDate = (
        <div
          className="cdate"
          data-toggle="tooltip"
          title={formattedTooltip}
          onClick={() => handleExpandCollapseSubInvitations(invitationId)}
        >
          <span className="activation-date">{formattedCDate}</span>
        </div>
      )
    }
    const expdate = stepObj.expdate ?? stepObj.edit?.invitation?.expdate
    const isExpDateAfterNow = dayjs(expdate).isAfter(dayjs())
    const isCDateAfterNow = dayjs(stepObj.cdate).isAfter(dayjs())
    const isMDateAfterCDate = dayjs(stepObj.mdate).isAfter(dayjs(stepObj.cdate))
    const getStartEndDateContent = () => {
      if (isStageInvitation) {
        return expdate
          ? `${isCDateAfterNow ? 'Starting' : 'Started'} ${dayjs(stepObj.cdate).fromNow()} ,${isExpDateAfterNow ? 'expiring' : 'expired'} ${dayjs(expdate).fromNow()}`
          : `${isCDateAfterNow ? 'Starting' : 'Started'} ${dayjs(stepObj.cdate).fromNow()}`
      }
      const isInvitationModified = !isCDateAfterNow && isMDateAfterCDate
      return isCDateAfterNow
        ? `Scheduled to run in ${dayjs(stepObj.cdate).fromNow()}`
        : `Executed ${dayjs(isInvitationModified ? stepObj.mdate : stepObj.cdate).fromNow()}`
    }
    const getSectionClass = () => {
      const isCDateInThePast = dayjs(stepObj.cdate).isSameOrBefore(dayjs())
      const isExpDateInThePast = dayjs(expdate).isSameOrBefore(dayjs())
      const hasRunningProcess = logs.find(
        (p) => p.invitation === stepObj.id && p.status === 'running'
      )

      if (isStageInvitation) {
        if (isCDateInThePast && isExpDateInThePast) return ' section-passed'
        if (isCDateInThePast && isExpDateAfterNow) return ' section-active'
        if (isCDateAfterNow && isExpDateAfterNow) return ' section-scheduled'
      } else {
        if (isCDateInThePast) return ' section-passed'
        if (hasRunningProcess) return ' section-active'
        if (isCDateAfterNow) return ' section-scheduled'
      }
      return ''
      // const isBeforeToday = dayjs(stepObj.cdate).isSameOrBefore(dayjs())
      // if (!isBeforeToday) return ''
      // const oldestSecondsAwayFromNow = dayjs().diff(dayjs(oldestCDate))
      // const secondsAwayFromNow = dayjs().diff(dayjs(stepObj.cdate))
      // const part = Math.ceil(secondsAwayFromNow / (oldestSecondsAwayFromNow / 10))
      // return ` date-passed-${part}`
    }
    return {
      ...stepObj,
      isExpired,
      sectionClass: getSectionClass(),
      invitationTasks,
      isMissingValue,
      formattedDate,
      subInvitations,
      startEndDateContent: getStartEndDateContent(),
    }
  }

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
      const logs = orderBy(response, ['edate'], ['desc'])
      setProcessLogs(logs)
      return logs
    } catch (error) {
      promptError(error.message)
      return []
    }
  }

  const filterWorkflowInvitations = (
    exclusionWorkflowInvitations,
    workflowAndSubInvitations,
    skipWorkflowInvitationCheck = false
  ) => {
    if (!workflowAndSubInvitations?.length) return []
    if (!exclusionWorkflowInvitations?.length) {
      const tempFilterResult = workflowAndSubInvitations.flatMap((stepObj) => {
        const isWorkflowInvitation = skipWorkflowInvitationCheck
          ? true
          : workflowAndSubInvitations.find((p) => p.edit?.invitation?.id === stepObj.id)
        if (!isWorkflowInvitation) return []
        return stepObj
      })
      if (!tempFilterResult.length) {
        return workflowAndSubInvitations
      }
      return tempFilterResult
    }
    const tempFilterResult = workflowAndSubInvitations.flatMap((stepObj) => {
      const isWorkflowInvitation = skipWorkflowInvitationCheck
        ? true
        : workflowAndSubInvitations.find((p) => p.edit?.invitation?.id === stepObj.id)
      if (!isWorkflowInvitation) return []
      if (
        exclusionWorkflowInvitations.find((p) => {
          const isRegex = /^\/.*\/$/.test(p)
          if (isRegex) {
            return new RegExp(p.slice(1, -1)).test(stepObj.id)
          }
          return p === stepObj.id
        })
      )
        return []
      return stepObj
    })
    if (!tempFilterResult.length) {
      // skip workflow invitation check
      return filterWorkflowInvitations(
        exclusionWorkflowInvitations,
        workflowAndSubInvitations,
        true
      )
    }
    return tempFilterResult
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
      { prefix: groupId, expired: true, trash: true, type: 'all', details: 'writableWith' },
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
      const [groups, invitations, stageInvitations, logs] = await Promise.all([
        getAllGroupsP,
        getAllInvitationsP,
        getStageInvitationTemplatesP,
        loadProcessLogs(),
      ])

      const exclusionWorkflowInvitations = group.content?.exclusion_workflow_invitations?.value
      const invitationsToShowInWorkflow = filterWorkflowInvitations(
        exclusionWorkflowInvitations,
        invitations
      ).map((stepObj) => {
        return formatWorkflowInvitation(stepObj, invitations, logs)
      })

      setWorkflowTasks(
        sortBy(
          invitationsToShowInWorkflow.reduce(
            (prev, curr) => [
              ...prev,
              ...curr.invitationTasks.map((taskSubInvitation) => {
                return {
                  ...taskSubInvitation,
                  workflowInvitation: curr,
                }
              }),
            ],
            []
          ),
          'duedate'
        )
      )
      setCollapsedWorkflowInvitationIds(invitationsToShowInWorkflow.map((p) => p.id))
      setWorkflowInvitations(sortWorkflowInvitations(invitationsToShowInWorkflow))
      setWorkflowGroups(sortBy(groups, 'cdate'))
      setAllInvitations(invitations)
      setStageInvitations(stageInvitations)
      // loadProcessLogs()
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
      <div className="workflow-instruction">
        Add members of the Program Chairs and to the Reviewers invited group, then start
        configuring pending tasks
      </div>
      {workflowGroups.length > 0 && (
        <EditorSection
          title={`Workflow Groups (${workflowGroups.length})`}
          className="workflow"
        >
          <div className=" group-workflow-container">
            {workflowGroups.map((stepObj) => {
              const groupInvitationsForGroup = allInvitations.filter(
                (p) =>
                  p.edit?.group?.id === stepObj.id &&
                  Object.values(p.edit?.content ?? {}).some((q) => q.value?.param)
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

      <WorkflowTasks
        workflowTasks={workflowTasks}
        setCollapsedWorkflowInvitationIds={setCollapsedWorkflowInvitationIds}
      />

      {workflowInvitations.length > 0 && (
        <EditorSection
          title={`Workflow Configurations (${workflowInvitations.length})`}
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
              <span>Workflow Step Invitations</span>
            </div>
          </div>

          <hr />
          <div className="invitation-workflow-container">
            {workflowInvitations.map((stepObj) => {
              const {
                id,
                isExpired,
                sectionClass,
                invitationTasks,
                isMissingValue,
                formattedDate,
                subInvitations,
                startEndDateContent,
              } = stepObj
              return (
                <motion.div
                  layout="position"
                  key={id}
                  transition={{ duration: 0.5 }}
                  ref={(el) => {
                    // eslint-disable-next-line no-param-reassign
                    workflowInvitationsRef.current[id] = el
                  }}
                  className="motion-div"
                >
                  <div
                    className={`workflow-invitation-container${isExpired ? ' expired' : ''}${sectionClass}`}
                  >
                    <div
                      className={`invitation-cdate${isMissingValue ? ' missing-value' : ''}`}
                    >
                      {formattedDate}
                    </div>
                    <div className="edit-invitation-info">
                      <WorkflowInvitationRow
                        invitation={stepObj}
                        subInvitations={subInvitations}
                        isDomainGroup={group.id !== group.domain}
                        processLogs={processLogs}
                        isExpired={isExpired}
                        loadWorkflowInvitations={loadAllInvitations}
                        isMissingValue={isMissingValue}
                        collapsedWorkflowInvitationIds={collapsedWorkflowInvitationIds}
                        handleExpandCollapseSubInvitations={handleExpandCollapseSubInvitations}
                        workflowTasks={workflowTasks}
                      />

                      {subInvitations.length > 0 &&
                        subInvitations.map((subInvitation) => (
                          <SubInvitationRow
                            key={subInvitation.id}
                            subInvitation={subInvitation}
                            workflowInvitation={stepObj}
                            loadWorkflowInvitations={loadAllInvitations}
                            domainObject={group.content}
                            setMissingValueInvitationIds={setMissingValueInvitationIds}
                            workflowInvitationsRef={workflowInvitationsRef}
                            collapsedWorkflowInvitationIds={collapsedWorkflowInvitationIds}
                            workflowTasks={workflowTasks}
                          />
                        ))}
                    </div>
                    <div className="start-end-date">{startEndDateContent}</div>
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
