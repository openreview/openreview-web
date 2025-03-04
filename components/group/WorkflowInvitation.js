/* eslint-disable arrow-body-style */
/* globals promptError,promptMessage,$: false */
import React, { useEffect, useState, useRef } from 'react'
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
      <div className="wf-status-badge error">
        <Icon name="alert-triangle" className="wf-status-icon" />
        <span>Missing Value</span>
      </div>
    )
  }

  if (processLogs && processLogs.length > 0) {
    const latestLog = processLogs[processLogs.length - 1]
    const { status } = latestLog

    let statusClass = 'default'
    if (status === 'ok') statusClass = 'success'
    else if (status === 'error') statusClass = 'error'
    else if (status === 'running') statusClass = 'info'
    else statusClass = 'warning'

    let iconName = 'alert-circle'
    if (status === 'ok') iconName = 'check-circle'
    else if (status === 'error') iconName = 'x-circle'
    else if (status === 'running') iconName = 'loader'

    const isSpinning = status === 'running'

    return (
      <div className={`wf-status-badge ${statusClass}`}>
        <Icon
          name={iconName}
          className={`wf-status-icon ${isSpinning ? 'spinning' : ''}`}
        />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
        {status === 'error' && latestLog.error && (
          <span className="wf-error-details tooltip-wrapper" data-tooltip={latestLog.error}>
            <Icon name="info" />
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="wf-status-badge default">
      <Icon name="circle" className="wf-status-icon" />
      <span>No Status</span>
    </div>
  )
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
      <div className="wf-invitation-section">
        <div className="wf-invitation-section-header">
          <div className="wf-invitation-title" onClick={handleExpandCollapseSubInvitations}>
            <Icon
              name={isCollapsed ? 'chevron-right' : 'chevron-down'}
              className="wf-collapse-icon"
            />
            <h4>{prettyId(invitation.id.replace(invitation.domain, ''))}</h4>
          </div>

          <div className="wf-invitation-actions">
            <a
              className="wf-action-button tooltip-wrapper"
              href={`/invitation/edit?id=${invitation.id}`}
              data-tooltip="Edit in new window"
            >
              <Icon name="external-link" />
            </a>

            {invitation.edit?.content && isDomainGroup && !showEditor && (
              <button
                className="wf-action-button primary tooltip-wrapper"
                onClick={() => setShowEditor(true)}
                data-tooltip="Add content"
              >
                <Icon name="plus" />
              </button>
            )}

            <button
              className={`wf-action-button ${isExpired ? 'success' : 'danger'} tooltip-wrapper`}
              onClick={expireRestoreInvitation}
              data-tooltip={isExpired ? 'Enable' : 'Disable'}
            >
              <Icon name={isExpired ? 'play' : 'pause'} />
            </button>
          </div>
        </div>

        <div className="wf-invitation-section-body">
          <div className="wf-invitee-section">
            <span className="wf-invitee-label">Invited:</span>
            <div
              className="wf-invitee-list"
              data-toggle="tooltip"
              title={invitees?.join('<br/>')}
            >
              {invitees.map((p, index) => (
                <span key={index} className="wf-invitee-tag">
                  {renderInvitee(p)}
                  {index < invitees.length - 1 && ', '}
                </span>
              ))}
            </div>
          </div>

          {invitation.description && (
            <div className="wf-invitation-description">
              <Markdown text={invitation.description} />
            </div>
          )}

          {isCreatingSubInvitations && (
            <div className="wf-invitation-status">
              <EditInvitationProcessLogStatus
                processLogs={processLogs.filter((p) => p.invitation === invitation.id)}
                isMissingValue={isMissingValue}
              />
            </div>
          )}
        </div>
      </div>

      {showEditor && (
        <div className="wf-content-editor-container">
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
    </>
  )
}

const WorkflowInvitationRow = ({
  invitation,
  workflowInvitation,
  loadWorkflowInvitations,
  domainObject,
  setMissingValueInvitationIds,
  workflowInvitationsRef,
  isCollapsed,
}) => {
  const [showInvitationEditor, setShowInvitationEditor] = useState(false)
  const invitationName = prettyField(invitation.id.split('/').pop())
  const [subInvitationContentFieldValues, setSubInvitationContentFieldValues] = useState({})
  const isGroupInvitation = invitation.edit?.group // sub invitation can be group invitation too

  const existingValue = isGroupInvitation
    ? {}
    : Object.fromEntries(
        Object.keys(invitation.edit?.content ?? {}).map((key) => {
          const path = getPath(invitation.edit.invitation, key)
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
        `.wf-cdate ${isHoverActivationDate ? '.wf-activation-date' : '.wf-due-date'}`
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
        `.wf-cdate ${isHoverActivationDate ? '.wf-activation-date' : '.wf-due-date'}`
      )
      if (cdateElement) {
        cdateElement.classList.remove('highlight')
      }
    }
  }

  useEffect(() => {
    let hasMissingValue = false
    const contentFieldValueMap = {}
    Object.keys(invitation.edit?.content ?? {}).forEach((key) => {
      const fieldPath = getPath(invitation.edit.invitation, key)
      let displayValue = getSubInvitationContentFieldDisplayValue(
        fieldPath
          ? workflowInvitation
          : { ...domainObject, domain: workflowInvitation.domain },
        fieldPath ?? `${key}.value`,
        invitation.edit.content?.[key]?.value?.param?.type
      )
      if (displayValue === 'value missing') {
        displayValue = <span className="wf-missing-value">Missing</span>
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
  }, [invitation])

  if (isCollapsed) return <div className="wf-sub-invitation-container" />
  return (
    <div className="wf-sub-invitation-container">
      <div className="wf-sub-invitation-content">
        <div className="wf-sub-invitation-header">
          <h5>{invitation.id.replace(/.*\//, '')}</h5>

          {!showInvitationEditor && (
            <button
              className="wf-action-button primary tooltip-wrapper"
              onClick={() => setShowInvitationEditor(true)}
              data-tooltip="Edit values"
            >
              <Icon name="edit" />
            </button>
          )}
        </div>

        <div className="wf-existing-values-container">
          {Object.keys(subInvitationContentFieldValues).map((key) => (
            <div
              key={key}
              className="wf-existing-value-field-row"
              onMouseEnter={(e) => handleHover(key, e)}
              onMouseLeave={(e) => handleHoverEnd(key, e)}
            >
              <span className="wf-existing-value-field">{prettyField(key)}:</span>
              <span className="wf-existing-value-field-value">{subInvitationContentFieldValues[key]}</span>
            </div>
          ))}
        </div>

        {showInvitationEditor && (
          <div className="wf-editor-container">
            <InvitationContentEditor
              invitation={invitation}
              existingValue={existingValue}
              closeInvitationEditor={() => setShowInvitationEditor(false)}
              onInvitationEditPosted={() => {
                loadWorkflowInvitations()
                setTimeout(() => {
                  const ref = workflowInvitationsRef.current?.[invitation.id]
                  if (ref) {
                    const rect = ref.getBoundingClientRect()
                    if (rect.top < 0 || rect.bottom > window.innerHeight)
                      ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }, 500)
              }}
              isGroupInvitation={isGroupInvitation}
            />
          </div>
        )}
      </div>
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
  const [isHovering, setIsHovering] = useState(false)
  const { user, accessToken } = useUser()
  const profileId = user?.profile?.id
  const relevantProcessLogs = processLogs.filter((p) => p.invitation === invitationId)
  const latestProcessLog = relevantProcessLogs.length > 0 ? relevantProcessLogs[0] : null
  const isCreatingSubInvitations = stepObj.dateprocesses?.length > 0

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
        container.querySelectorAll('.wf-existing-value-field')
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
        container.querySelectorAll('.wf-existing-value-field')
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

  const formattedLastRunTime = latestProcessLog ? formatDateTime(latestProcessLog.edate, {
    second: undefined,
    year: undefined,
    weekday: 'short',
  }) : null

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

  const expireRestoreInvitation = async () => {
    try {
      const expireRestoreInvitationPs = [stepObj, ...subInvitations].map((p) =>
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
        `${prettyId(stepObj.id)} has been ${isExpired ? 'restored' : 'skipped'}.`,
        { scrollToTop: false }
      )
      loadAllInvitations()
    } catch (error) {
      promptError(error.message)
    }
  }

  const innerInvitationInvitee = stepObj.edit?.invitation?.invitees
  const invitees = innerInvitationInvitee ?? stepObj.invitees

  const renderInvitee = (invitee) => {
    if (invitee === stepObj.domain) return 'Administrators'
    if (invitee === '~') return 'Registered Users'
    return prettyId(invitee.replace(stepObj.domain, ''))
      .split(/\{(\S+\s*\S*)\}/g)
      .map((segment, segmentIndex) =>
        segmentIndex % 2 !== 0 ? <em key={segmentIndex}>{segment}</em> : segment
      )
  }

  return (
    <motion.div
      layout="position"
      key={invitationId}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.5
      }}
      ref={(el) => {
        // eslint-disable-next-line no-param-reassign
        workflowInvitationsRef.current[invitationId] = el
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="workflow-card-container"
      onMouseEnter={() => {
        setIsHovering(true)
        setHoverInvitationId(invitationId)
      }}
      onMouseLeave={() => {
        setIsHovering(false)
        setHoverInvitationId(null)
      }}
    >
      <div
        key={invitationId}
        className={`workflow-card${isExpired ? ' expired' : ''}${getDatePassedClass()}`}
      >
        <div className="workflow-card-header">
          <button
            className={`wf-action-button ${isExpired ? 'success' : 'danger'} tooltip-wrapper`}
            onClick={expireRestoreInvitation}
            data-tooltip={isExpired ? 'Enable' : 'Disable'}
          >
            <Icon name={isExpired ? 'play' : 'pause'} />
          </button>

          <div className="workflow-card-title" onClick={handleExpandCollapseSubInvitations}>
            <div className="workflow-card-title-content">
              <h3>{prettyId(stepObj.id.replace(stepObj.domain, ''))}</h3>
              <div className="workflow-card-dates">
                <span>{formattedCDate} - {formattedDueDate || 'No deadline'}</span>
              </div>
            </div>
          </div>

          <div className={`workflow-card-status${isMissingValue ? ' missing-value' : ''}`}>
            <div className="wf-status-indicator">
              {isExpired && <Icon name="x-circle" className="wf-status-icon expired" title="Expired" />}
              {isMissingValue && <Icon name="alert-circle" className="wf-status-icon warning" title="Missing Value" />}
              {!isExpired && !isMissingValue && <Icon name="check-circle" className="wf-status-icon active" title="Active" />}
            </div>
            <div className="workflow-card-status-content">
              <span className="workflow-card-status-text">
                {(() => {
                  if (isExpired) return 'Disabled'
                  if (isMissingValue) return 'Missing Values'
                  return 'Active'
                })()}
              </span>
              {latestProcessLog && (
                <span className="workflow-card-status-time">
                  Last run: {formattedLastRunTime}
                  {latestProcessLog.status && (
                    <span className={`workflow-card-status-result ${latestProcessLog.status}`}>
                      ({latestProcessLog.status})
                    </span>
                  )}
                </span>
              )}
              {isCreatingSubInvitations && !latestProcessLog && (
                <span className="workflow-card-status-time">Never run</span>
              )}
            </div>
          </div>

          <div className="workflow-card-actions">
            <a href={`/invitation/edit?id=${stepObj.id}`} className="tooltip-wrapper" data-tooltip="Edit">
              <Icon name="edit" className="wf-action-icon" />
            </a>
            <div className="tooltip-wrapper" data-tooltip={isCollapsed ? 'Expand' : 'Collapse'}>
              <Icon
                name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                className="wf-collapse-icon"
                onClick={handleExpandCollapseSubInvitations}
              />
            </div>
          </div>
        </div>

        {isHovering && isCollapsed && (
          <div className="workflow-card-preview">
            {stepObj.description && (
              <div className="wf-invitation-description">
                <Markdown text={stepObj.description} />
              </div>
            )}
            <div className="wf-invitee-section">
              <span className="wf-invitee-label">Invited:</span>
              <div
                className="wf-invitee-list"
                data-toggle="tooltip"
                title={invitees?.join('<br/>')}
              >
                {invitees.map((p, index) => (
                  <span key={index} className="wf-invitee-tag">
                    {renderInvitee(p)}
                    {index < invitees.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={`workflow-card-content ${!isCollapsed ? 'expanded' : ''}`}>
          {!isCollapsed && (
            <>
              {stepObj.description && (
                <div className="wf-invitation-description">
                  <Markdown text={stepObj.description} />
                </div>
              )}
              <div className="wf-invitee-section">
                <span className="wf-invitee-label">Invited:</span>
                <div
                  className="wf-invitee-list"
                  data-toggle="tooltip"
                  title={invitees?.join('<br/>')}
                >
                  {invitees.map((p, index) => (
                    <span key={index} className="wf-invitee-tag">
                      {renderInvitee(p)}
                      {index < invitees.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>

              <div className="wf-edit-invitation-section">
                {subInvitations.length > 0 &&
                  subInvitations.map((subInvitation) => (
                    <WorkflowInvitationRow
                      key={subInvitation.id}
                      invitation={subInvitation}
                      workflowInvitation={stepObj}
                      loadWorkflowInvitations={loadAllInvitations}
                      domainObject={domainContent}
                      setMissingValueInvitationIds={setMissingValueInvitationIds}
                      workflowInvitationsRef={workflowInvitationsRef}
                      isCollapsed={isCollapsed}
                    />
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default WorkflowInvitation
