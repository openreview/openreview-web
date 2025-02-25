/* eslint-disable arrow-body-style */
/* globals promptError,promptMessage,$: false */
import React, { useEffect, useRef, useState } from 'react'
import { orderBy, sortBy } from 'lodash'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import EditorSection from '../EditorSection'
import api from '../../lib/api-client'
import { formatDateTime, inflect, prettyId, prettyInvitationId } from '../../lib/utils'
import InvitationContentEditor from './InvitationContentEditor'
import Dropdown from '../Dropdown'
import Markdown from '../EditorComponents/Markdown'
import Icon from '../Icon'
import useSocket from '../../hooks/useSocket'
import WorkflowInvitation from './WorkflowInvitation'

dayjs.extend(isSameOrBefore)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(relativeTime)

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
  const [hoveredInvitationId, setHoverInvitationId] = useState(null)

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
                      {`  You must enter missing values in ${inflect(missingValueInvitationIds.length, 'step', 'steps', true)} in order to be ready to run`}
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
              return (
                <WorkflowInvitation
                  key={index}
                  stepObj={stepObj}
                  allInvitations={allInvitations}
                  loadAllInvitations={loadAllInvitations}
                  collapsedWorkflowInvitationIds={collapsedWorkflowInvitationIds}
                  setCollapsedWorkflowInvitationIds={setCollapsedWorkflowInvitationIds}
                  missingValueInvitationIds={missingValueInvitationIds}
                  setMissingValueInvitationIds={setMissingValueInvitationIds}
                  oldestCDate={workflowInvitations[0].cdate}
                  isDomainGroup={group.id !== group.domain}
                  processLogs={processLogs}
                  domainContent={group.content}
                  workflowInvitationsRef={workflowInvitationsRef}
                  setHoverInvitationId={setHoverInvitationId}
                  isHovered={hoveredInvitationId === stepObj.id}
                />
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
