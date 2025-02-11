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

dayjs.extend(isSameOrBefore)
dayjs.extend(timezone)
dayjs.extend(utc)

const WorkflowGroupRow = ({ group, groupInvitations }) => {
  const [activeGroupInvitation, setActivateGroupInvitation] = useState(null)
  return (
    <div className="group-workflow">
      <span className="group-cdate">{group.formattedCDate} </span>
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
              <button
                key={groupInvitation.id}
                className="btn btn-xs mr-2"
                onClick={() => setActivateGroupInvitation(groupInvitation)}
              >
                Add {prettyInvitationId(groupInvitation.id)}
              </button>
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
}) => {
  const [showInvitationEditor, setShowInvitationEditor] = useState(false)
  const invitationName = prettyField(subInvitation.id.split('/').pop())
  const isGroupInvitation = subInvitation.edit?.group // sub invitation can be group invitation too
  const [subInvitationContentFieldValues, setSubInvitationContentFieldValues] = useState({})

  const existingValue = isGroupInvitation
    ? {}
    : Object.fromEntries(
        Object.keys(subInvitation.edit?.content ?? {}).map((key) => {
          const path = getPath(subInvitation.edit.invitation, key)
          const existingFieldValue = get(workflowInvitation, path)
          return [key, existingFieldValue]
        })
      )
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
      setMissingValueInvitationIds((invitationIds) => [
        ...invitationIds,
        workflowInvitation.id,
      ])
    }
    setSubInvitationContentFieldValues(contentFieldValueMap)
  }, [subInvitation])

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
                    <span className="existing-value-field">{prettyField(key)}: </span>
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

const EditInvitationProcessLogStatus = ({ processLogs }) => {
  const runningProcessLog = processLogs.find((p) => p.status === 'running')
  if (runningProcessLog) {
    const formattedDate = runningProcessLog?.sdate
      ? formatDateTime(runningProcessLog.sdate, {
          second: undefined,
          timeZoneName: 'short',
          hour12: false,
          locale: 'en-GB',
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
        locale: 'en-GB',
      })
    : null
  switch (lastProcessLog?.status) {
    case 'ok':
      return (
        <span className="log-status">
          {' '}
          <span className="fixed-text">Status:</span> {formattedDate}{' '}
          <span className="fixed-text">. {lastLogMessage ?? 'OK'}.</span>
        </span>
      )
    case 'error':
      return (
        <span className="log-status">
          <span className="fixed-text">Status:</span> {formattedDate}{' '}
          <span className="fixed-text">. ERROR</span>
          {lastLogMessage ? `: ${lastLogMessage}` : '.'}
        </span>
      )
    case 'queued':
      return (
        <span className="log-status">
          <span className="fixed-text">Status:</span> {formattedDate}{' '}
          <span className="fixed-text">. QUEUED</span>
        </span>
      )
    default:
      return null
  }
}

const EditInvitationRow = ({ invitation, isDomainGroup, processLogs }) => {
  const [showEditor, setShowEditor] = useState(false)

  const innerInvitationInvitee = invitation.edit?.invitation?.invitees
  const invitees = innerInvitationInvitee ?? invitation.invitees

  const renderInvitee = (invitee) => {
    if (invitee === invitation.domain) return 'Administrators'
    if (invitee === '~') return 'Registered Users'
    return prettyId(invitee.replace(invitation.domain, ''))
      .split(/\{(\S+\s*\S*)\}/g)
      .map((segment, segmentIndex) =>
        segmentIndex % 2 !== 0 ? <em key={segmentIndex}>{segment}</em> : segment
      )
  }

  return (
    <div className="edit-invitation-container">
      <div className="invitation-content">
        <div className="invitation-id-container">
          <span className="workflow-invitation-id">
            {prettyId(invitation.id.replace(invitation.domain, ''), true)}
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
        </div>
        {invitation.description && <Markdown text={invitation.description} />}
        <EditInvitationProcessLogStatus
          processLogs={processLogs.filter((p) => p.invitation === invitation.id)}
        />
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
  const [groupInvitations, setGroupInvitations] = useState([])
  const [processLogs, setProcessLogs] = useState([])
  const [missingValueInvitationIds, setMissingValueInvitationIds] = useState([])
  const events = useSocket('venue/workflow', ['date-process-updated'], { venueid: groupId })
  const workflowInvitationsRef = useRef({})
  const workflowInvitationRegex = RegExp(`^${groupId}/-/[^/]+$`)

  const loadProcessLogs = async () => {
    try {
      const response = await api.getAll(
        '/logs/process',
        {
          invitation: `${groupId}/-/.*`,
          select: 'sdate,edate,invitation,status,log',
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

    const getGroupInvitationsP = api.getAll(
      '/invitations',
      {
        prefix: groupId,
        type: 'group',
      },
      { accessToken }
    )

    try {
      // eslint-disable-next-line no-shadow
      const [groups, invitations, stageInvitations, groupInvitaitons] = await Promise.all([
        getAllGroupsP,
        getAllInvitationsP,
        getStageInvitationTemplatesP,
        getGroupInvitationsP,
      ])
      const workFlowInvitations = invitations.filter(
        (p) => workflowInvitationRegex.test(p.id) && p.type !== 'meta'
      )
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
      setGroupInvitations(groupInvitaitons)
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
          <div className="container group-workflow-container">
            {workflowGroups.map((stepObj) => {
              const groupInvitationsForGroup = groupInvitations.filter(
                (p) => p.edit.group.id === stepObj.id
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
              const isExpired = dayjs(stepObj.expdate).isBefore(dayjs())
              const isNextStepAfterToday = dayjs(
                workflowInvitations[index + 1]?.cdate
              ).isAfter(dayjs())

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
                        className={`workflow-invitation-container${isExpired ? ' expired' : ''}`}
                      >
                        <div
                          className={`invitation-cdate${missingValueInvitationIds.includes(invitationId) ? ' missing-value' : ''}`}
                        >
                          {stepObj.formattedCDate}
                        </div>
                        <div className="edit-invitation-info">
                          <EditInvitationRow
                            invitation={stepObj}
                            isDomainGroup={group.id !== group.domain}
                            processLogs={processLogs}
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
                              />
                            ))}
                        </div>
                      </div>
                      <div key="today" className="workflow-invitation-container">
                        <div className="invitation-cdate ">
                          {formatDateTime(dayjs().valueOf(), {
                            second: undefined,
                            locale: 'en-GB',
                            timeZoneName: 'short',
                            hour12: false,
                          })}{' '}
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
                    className={`workflow-invitation-container${isExpired ? ' expired' : ''}`}
                  >
                    <div
                      className={`invitation-cdate${missingValueInvitationIds.includes(invitationId) ? ' missing-value' : ''}`}
                    >
                      {stepObj.formattedCDate}
                    </div>
                    <div className="edit-invitation-info">
                      <EditInvitationRow
                        invitation={stepObj}
                        isDomainGroup={group.id !== group.domain}
                        processLogs={processLogs}
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
