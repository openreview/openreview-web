/* eslint-disable arrow-body-style */
/* globals promptError,promptMessage,$: false */
import React, { useEffect, useState } from 'react'
import { get } from 'lodash'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import api from '../../lib/api-client'
import {
  formatDateTime,
  getMetaInvitationId,
  getPath,
  getSubInvitationContentFieldDisplayValue,
  prettyField,
  prettyId,
} from '../../lib/utils'
import InvitationContentEditor from './InvitationContentEditor'
import Markdown from '../EditorComponents/Markdown'
import Icon from '../Icon'
import useUser from '../../hooks/useUser'

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
  subInvitations,
  isDomainGroup,
  processLogs,
  isExpired,
  loadWorkflowInvitations,
  isCollapsed,
  isMissingValue,
  handleExpandCollapseSubInvitations,
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
            <div className="collapse-invitation" onClick={handleExpandCollapseSubInvitations}>
              <Icon name={isCollapsed ? 'triangle-bottom' : 'triangle-top'} />
            </div>
            <span
              className="workflow-invitation-id"
              onClick={handleExpandCollapseSubInvitations}
            >
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
    </>
  )
}

const WorkflowInvitationRow = ({
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

const WorkflowInvitation = ({
  stepObj,
  allInvitations,
  loadAllInvitations,
  collapsedWorkflowInvitationIds,
  setCollapsedWorkflowInvitationIds,
  missingValueInvitationIds,
  setMissingValueInvitationIds,
  oldestCDate,
  isDomainGroup,
  processLogs,
  domainContent,
  workflowInvitationsRef,
  setHoverInvitationId,
  isHovered,
}) => {
  const invitationId = stepObj.id
  const subInvitations = allInvitations.filter((i) => i.edit?.invitation?.id === invitationId)

  const getDatePassedClass = () => {
    const isBeforeToday = dayjs(stepObj.cdate).isSameOrBefore(dayjs())
    if (!isBeforeToday) return ''
    const oldestSecondsAwayFromNow = dayjs().diff(dayjs(oldestCDate))
    const secondsAwayFromNow = dayjs().diff(dayjs(stepObj.cdate))
    const part = Math.ceil(secondsAwayFromNow / (oldestSecondsAwayFromNow / 10))
    return ` date-passed-${part}`
  }
  const isExpired = stepObj.ddate

  const isCollapsed = collapsedWorkflowInvitationIds.includes(stepObj.id)
  const isMissingValue = missingValueInvitationIds.includes(invitationId)
  const isStageInvitation = stepObj.duedate || stepObj.edit?.invitation

  const handleExpandCollapseSubInvitations = () => {
    if (isCollapsed) {
      setCollapsedWorkflowInvitationIds((ids) => ids.filter((id) => id !== invitationId))
    } else {
      setCollapsedWorkflowInvitationIds((ids) => [...ids, invitationId])
    }
  }

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
      <div
        className="cdate"
        data-toggle="tooltip"
        title={formattedTooltip}
        onClick={handleExpandCollapseSubInvitations}
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
        onClick={handleExpandCollapseSubInvitations}
      >
        <span className="activation-date">{formattedCDate}</span>
      </div>
    )
  }
  const expdate = stepObj.expdate ?? stepObj.edit?.invitation?.expdate
  const isExpDateAfterNow = dayjs(expdate).isAfter(dayjs())
  const isCdateAfterNow = dayjs(stepObj.cdate).isAfter(dayjs())

  const getStartEndDateContent = () => {
    if (isStageInvitation) {
      return expdate
        ? `${isCdateAfterNow ? 'Starting' : 'Started'} ${dayjs(stepObj.cdate).fromNow()} ,${isExpDateAfterNow ? 'expiring' : 'expired'} ${dayjs(expdate).fromNow()}`
        : `${isCdateAfterNow ? 'Starting' : 'Started'} ${dayjs(stepObj.cdate).fromNow()}`
    }
    return isCdateAfterNow
      ? `Scheduled to run in ${dayjs(stepObj.cdate).fromNow()}`
      : `Executed ${dayjs(stepObj.cdate).fromNow()}`
  }

  return (
    <motion.div
      layout="position"
      key={invitationId}
      transition={{ duration: 0.5 }}
      ref={(el) => {
        // eslint-disable-next-line no-param-reassign
        workflowInvitationsRef.current[invitationId] = el
      }}
    >
      <div
        key={invitationId}
        className={`workflow-invitation-container${isExpired ? ' expired' : ''}${getDatePassedClass()}${isHovered ? ' hovered' : ''}`}
      >
        <div className={`invitation-cdate${isMissingValue ? ' missing-value' : ''}`}>
          {formattedDate}
        </div>
        <div
          className={`edit-invitation-info${isHovered ? ' hover' : ''}`}
          onMouseEnter={() => setHoverInvitationId(invitationId)}
          onMouseLeave={() => setHoverInvitationId(null)}
        >
          <EditInvitationRow
            invitation={stepObj}
            subInvitations={subInvitations}
            isDomainGroup={isDomainGroup}
            processLogs={processLogs}
            isExpired={isExpired}
            loadWorkflowInvitations={loadAllInvitations}
            isCollapsed={isCollapsed}
            isMissingValue={isMissingValue}
            handleExpandCollapseSubInvitations={handleExpandCollapseSubInvitations}
          />

          {subInvitations.length > 0 &&
            subInvitations.map((subInvitation) => (
              <WorkflowInvitationRow
                key={subInvitation.id}
                subInvitation={subInvitation}
                workflowInvitation={stepObj}
                loadWorkflowInvitations={loadAllInvitations}
                domainObject={domainContent}
                setMissingValueInvitationIds={setMissingValueInvitationIds}
                workflowInvitationsRef={workflowInvitationsRef}
                isCollapsed={isCollapsed}
              />
            ))}
        </div>
        {isHovered && <div className="start-end-date">{getStartEndDateContent()}</div>}
      </div>
    </motion.div>
  )
}

export default WorkflowInvitation
