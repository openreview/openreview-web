import { CaretRightOutlined } from '@ant-design/icons'
import {
  Button,
  Collapse,
  Flex,
  Popconfirm,
  Segmented,
  Tooltip,
  Typography,
  theme,
} from 'antd'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { motion } from 'framer-motion'
import { orderBy, sortBy, get, minBy, max } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import useSocket from '../../hooks/useSocket'
import useUser from '../../hooks/useUser'
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
import Dropdown from '../Dropdown'
import Markdown from '../EditorComponents/Markdown'
import EditorSection from '../EditorSection'
import Icon from '../Icon'
import LoadingSpinner from '../LoadingSpinner'
import InvitationEditor from './InvitationEditor'

dayjs.extend(isSameOrBefore)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(relativeTime)

const isDateInFuture = (cdate) => cdate > Date.now()
const isDateInPast = (expDateOrCDate) => expDateOrCDate <= Date.now()
const getInvitationExpDate = (invitation) =>
  invitation.expdate ?? invitation.edit?.invitation?.expdate

// A window is a step people act inside: it has a due date, or the invitations it creates are
// handed to invitees (reviews, rebuttals, comments, withdrawal). An invitation that only edits
// existing invitations — a release — fires once at its activation date, even though it edits
// invitations and carries an expiration of its own.
const isWindowInvitation = (invitation) =>
  !!(invitation.duedate || invitation.edit?.invitation?.invitees)

// Where a step ends on the timeline: a window at its expiration; anything else is a moment.
const getWindowEnd = (invitation) =>
  isWindowInvitation(invitation) ? getInvitationExpDate(invitation) : undefined

// Ongoing: available with no end date — no expiration, no due date — and not a one-shot step that
// fires on a date. Recruitment requests, deploying assignments, and (by openreview-py's default)
// withdrawal and desk rejection. They stay in their stage but leave the timeline: they have no
// span to draw, and would otherwise stretch a stage or hold it open forever.
const isOngoingInvitation = (invitation) => {
  const isStageInvitation = isWindowInvitation(invitation)
  const duedate = invitation.duedate ?? invitation.edit?.invitation?.duedate
  const hasDateProcess = invitation.dateprocesses?.length > 0
  return (
    !getInvitationExpDate(invitation) && !duedate && (isStageInvitation || !hasDateProcess)
  )
}

const getStageStatus = (allInvitationsOfWorkflowStage) => {
  // Ongoing invitations never expire, so they would keep a stage from ever completing.
  const timedInvitations = allInvitationsOfWorkflowStage.filter((p) => !isOngoingInvitation(p))
  const invitationsOfWorkflowStage = timedInvitations.length
    ? timedInvitations
    : allInvitationsOfWorkflowStage
  if (invitationsOfWorkflowStage.every((p) => isDateInFuture(p.cdate))) {
    return { stageStatus: 'SCHEDULED', stageStatusColor: 'default' }
  }

  const stageInvitations = invitationsOfWorkflowStage.filter((p) => p.isStageInvitation)
  const runInvitations = invitationsOfWorkflowStage.filter((p) => !p.isStageInvitation)

  if (
    stageInvitations.every((p) => isDateInPast(getInvitationExpDate(p))) &&
    runInvitations.every((p) => isDateInPast(p.cdate))
  ) {
    return { stageStatus: 'COMPLETED', stageStatusColor: 'success' }
  }

  return { stageStatus: 'IN PROGRESS', stageStatusColor: 'processing' }
}

const workflowGroupKeys = [
  {
    field: 'program_chairs_id',
    subGroupSuffixes: [],
  },
  {
    field: 'authors_id',
    subGroupSuffixes: ['/Accepted'],
  },
  {
    field: 'reviewers_id',
    rolesField: 'reviewer_roles',
    subGroupSuffixes: ['/Invited', '/Declined'],
  },
  {
    field: 'area_chairs_id',
    rolesField: 'area_chair_roles',
    subGroupSuffixes: ['/Invited', '/Declined'],
  },
  {
    field: 'senior_area_chairs_id',
    rolesField: 'senior_area_chair_roles',
    subGroupSuffixes: ['/Invited', '/Declined'],
  },
  {
    field: 'ethics_reviewers_id',
    rolesField: 'ethics_reviewer_roles',
    subGroupSuffixes: ['/Invited', '/Declined'],
  },
  {
    field: 'ethics_chairs_id',
    subGroupSuffixes: ['/Invited', '/Declined'],
  },
  {
    field: 'publication_chairs_id',
    subGroupSuffixes: [],
  },
]

// Width of the shared date axis, matched by the stage rows so every bar lines up under it.
const timelineTrackWidth = 700
// A stage's status is a glyph, so its column is a glyph wide; the rest went to the bars.
const timelineStatusWidth = 16
const timelineGap = 8
// Rough width of a "Sep 09 – Dec 02" label, used to decide which side of the bar it fits on.
const timelineLabelPercent = (100 * 104) / timelineTrackWidth

const stageStatusFilterLabels = {
  'IN PROGRESS': 'In progress',
  COMPLETED: 'Completed',
  SCHEDULED: 'Scheduled',
}

// The glyph colour class for each status, matching getStageStatus's stageStatusColor.
const stageStatusColors = {
  'IN PROGRESS': 'processing',
  COMPLETED: 'success',
  SCHEDULED: 'default',
}

// The axis spans whole months around the dates on which something must happen — a step's
// activation or its due date — so it never depends on hardcoded conference dates. Expirations
// do not set it: a withdrawal window left open for a year would otherwise squash every other
// stage into a corner. A window that ends past the axis runs off its edge, open-ended.
// Positions are percentages, so the track stays responsive.
const getTimelineDomain = (workflowStages) => {
  const timestamps = workflowStages.flatMap((p) =>
    p.invitationsOfWorkflowStageName
      .filter((q) => !isOngoingInvitation(q))
      .flatMap((q) => [q.cdate, q.duedate ?? q.edit?.invitation?.duedate])
      .filter(Boolean)
  )
  if (!timestamps.length) return null

  const start = dayjs(Math.min(...timestamps)).startOf('month')
  const end = dayjs(Math.max(...timestamps)).endOf('month')
  const totalMs = end.valueOf() - start.valueOf()
  if (totalMs <= 0) return null

  const months = []
  let cursor = start
  while (cursor.valueOf() < end.valueOf()) {
    const next = cursor.add(1, 'month').startOf('month')
    months.push({
      key: cursor.format('YYYY-MM'),
      label: cursor.format('MMM'),
      leftPercent: ((cursor.valueOf() - start.valueOf()) / totalMs) * 100,
      widthPercent:
        ((Math.min(next.valueOf(), end.valueOf()) - cursor.valueOf()) / totalMs) * 100,
    })
    cursor = next
  }

  return {
    months,
    end: end.valueOf(),
    percentOf: (timestamp) =>
      Math.max(0, Math.min(100, ((timestamp - start.valueOf()) / totalMs) * 100)),
  }
}

// A window that ends after the axis is drawn to the edge and fades out there.
const openEndClass = (endTimestamp, domain) =>
  endTimestamp && endTimestamp > domain.end ? ' open-end' : ''

// A window narrower than this reads as a line rather than a bar, so it is drawn as a marker.
const momentThresholdPercent = 0.4

// A track's date label goes after its last mark when there is room, else before its first mark,
// else just before its last mark over whatever sits there — a stage can run from Sep into Jan.
const getTrackLabelPlacement = (firstPercent, lastPercent) => {
  if (lastPercent + timelineLabelPercent < 100) {
    return { className: '', style: { left: `${lastPercent}%` } }
  }
  if (firstPercent - timelineLabelPercent > 0) {
    return { className: ' before-bar', style: { right: `${100 - firstPercent}%` } }
  }
  return { className: ' before-bar over-bar', style: { right: `${100 - lastPercent}%` } }
}

const TimelineGrid = ({ domain, showLabels }) => (
  <>
    {domain.months.map((month) => (
      <div
        key={month.key}
        className="timeline-month"
        style={{ left: `${month.leftPercent}%`, width: `${month.widthPercent}%` }}
      >
        {showLabels && <span className="timeline-month-label">{month.label}</span>}
      </div>
    ))}
    <div className="timeline-now" style={{ left: `${domain.percentOf(Date.now())}%` }} />
  </>
)

const WorkflowTimelineAxis = ({ domain }) => (
  <div
    className="timeline-axis"
    style={{
      width: timelineTrackWidth,
      flex: `0 0 ${timelineTrackWidth}px`,
      marginRight: timelineStatusWidth + timelineGap,
    }}
  >
    <div className="timeline-track with-labels">
      <TimelineGrid domain={domain} showLabels={true} />
    </div>
  </div>
)

// The stage envelope is min(activation) to max(expiration) of its step invitations; each step is
// drawn inside it, so a long stage visibly belongs to one step rather than all of them.
const WorkflowStageTrack = ({ workflowStage, domain, statusColor }) => {
  const { periodStart, periodEnd, invitationsOfWorkflowStageName } = workflowStage
  const timedInvitations = invitationsOfWorkflowStageName.filter(
    (p) => !isOngoingInvitation(p)
  )
  if (!timedInvitations.length || !periodStart) {
    return (
      <div
        className={`timeline-track stage-track ${statusColor}`}
        style={{ width: timelineTrackWidth, flex: `0 0 ${timelineTrackWidth}px` }}
      >
        <TimelineGrid domain={domain} />
        <div className="track-ongoing">Ongoing</div>
      </div>
    )
  }
  const startPercent = domain.percentOf(periodStart)
  const endPercent = domain.percentOf(periodEnd ?? periodStart)
  const isMoment = endPercent - startPercent < momentThresholdPercent
  const markPercents = timedInvitations.flatMap((invitation) => [
    domain.percentOf(invitation.cdate),
    domain.percentOf(getWindowEnd(invitation) ?? invitation.cdate),
  ])
  const labelPlacement = getTrackLabelPlacement(
    Math.min(startPercent, ...markPercents),
    Math.max(endPercent, ...markPercents)
  )

  return (
    <div
      className={`timeline-track stage-track ${statusColor}`}
      style={{ width: timelineTrackWidth, flex: `0 0 ${timelineTrackWidth}px` }}
    >
      <TimelineGrid domain={domain} />
      {!isMoment && (
        <div
          className={`stage-envelope${openEndClass(periodEnd, domain)}`}
          style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
        />
      )}
      <div className={`stage-period${labelPlacement.className}`} style={labelPlacement.style}>
        <WorkflowStagePeriod workflowStage={workflowStage} />
      </div>
      {timedInvitations.map((invitation) => {
        const stepStart = domain.percentOf(invitation.cdate)
        const stepExpDate = getWindowEnd(invitation)
        const stepEnd = domain.percentOf(stepExpDate ?? invitation.cdate)
        const stepWidth = stepEnd - stepStart
        const tooltip = `${prettyInvitationId(invitation.id)}: ${formatDateTime(
          invitation.cdate,
          { second: undefined, minute: undefined, hour: undefined }
        )}${
          stepExpDate
            ? ` – ${formatDateTime(stepExpDate, {
                second: undefined,
                minute: undefined,
                hour: undefined,
              })}`
            : ''
        }`

        return stepWidth < momentThresholdPercent ? (
          <div
            key={invitation.id}
            className="stage-moment"
            style={{ left: `${stepStart}%` }}
            title={tooltip}
          />
        ) : (
          <div
            key={invitation.id}
            className={`stage-window${openEndClass(stepExpDate, domain)}`}
            style={{ left: `${stepStart}%`, width: `${stepWidth}%` }}
            title={tooltip}
          />
        )
      })}
    </div>
  )
}

// A step's own bar, on the same axis as the stage envelope above it. Solid means its window
// contains today, hollow means it has not started, muted means it is done — so what is running
// is legible from position alone, without a status chip on every row.
const WorkflowStepTrack = ({ invitation, isStageInvitation, domain, dateContent }) => {
  if (isOngoingInvitation(invitation)) {
    return (
      <div
        className="timeline-track step-track ongoing"
        style={{ width: timelineTrackWidth, flex: `0 0 ${timelineTrackWidth}px` }}
      >
        <TimelineGrid domain={domain} />
        <div className="track-ongoing" title="No end date — listed under Ongoing">
          Ongoing
        </div>
      </div>
    )
  }
  const expdate = isStageInvitation ? getInvitationExpDate(invitation) : null
  const startPercent = domain.percentOf(invitation.cdate)
  const endPercent = domain.percentOf(expdate ?? invitation.cdate)
  const isMoment = endPercent - startPercent < momentThresholdPercent
  const labelPlacement = getTrackLabelPlacement(startPercent, endPercent)
  const now = Date.now()
  const state =
    invitation.cdate > now ? 'upcoming' : expdate && expdate > now ? 'running' : 'done'

  return (
    <div
      className={`timeline-track step-track ${state}`}
      style={{ width: timelineTrackWidth, flex: `0 0 ${timelineTrackWidth}px` }}
    >
      <TimelineGrid domain={domain} />
      <div
        className={isMoment ? 'step-moment' : `step-window${openEndClass(expdate, domain)}`}
        style={
          isMoment
            ? { left: `${startPercent}%` }
            : { left: `${startPercent}%`, width: `${endPercent - startPercent}%` }
        }
      />
      <div className={`step-dates${labelPlacement.className}`} style={labelPlacement.style}>
        {dateContent}
      </div>
    </div>
  )
}

// The status glyph itself, shared by the stage rows and the status filter (where it doubles as
// the legend). Colour comes from the wrapper's class through currentColor.
const StageStatusGlyph = ({ statusColor }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    {statusColor === 'success' && (
      <>
        <circle cx="7" cy="7" r="6.5" fill="currentColor" />
        <path
          d="M4 7.2 6.1 9.2 10 5"
          fill="none"
          stroke="#fffdfa"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )}
    {statusColor === 'processing' && (
      <>
        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 1a6 6 0 0 1 0 12z" fill="currentColor" />
      </>
    )}
    {statusColor === 'default' && (
      <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    )}
  </svg>
)

// A stage's status as a glyph in the timeline's own language: hollow = scheduled, half = in
// progress, filled with a check = completed. It carries an accessible name and a styled tooltip,
// since the text label is gone, and only renders when every status is on screen — under a status
// filter each row would carry the same one.
const StageStatusIcon = ({ status }) => {
  const label = stageStatusFilterLabels[status.stageStatus] ?? status.stageStatus
  return (
    <Tooltip title={label}>
      <span
        className={`stage-status-icon ${status.stageStatusColor}`}
        role="img"
        aria-label={label}
        style={{ width: timelineStatusWidth, flex: `0 0 ${timelineStatusWidth}px` }}
      >
        <StageStatusGlyph statusColor={status.stageStatusColor} />
      </span>
    </Tooltip>
  )
}

// A group card carries recruitment only — invite, then remind. Everything else about a group
// (members, home page, reassignment) is done on the group's own page, so the cards stay one
// row no matter how many invitations a group has. Nouns in the API, verbs for organizers.
const groupInvitationLabels = {
  Recruitment_Request: (roleName) => `Invite ${roleName}`,
  Recruitment_Request_Reminder: () => 'Send reminder',
}
const groupInvitationOrder = Object.keys(groupInvitationLabels)

const getGroupInvitationLabel = (invitationId, roleName) =>
  groupInvitationLabels[invitationId.split('/-/')[1]](roleName)

const isReminderInvitation = (invitationId) => invitationId.endsWith('_Reminder')
// This group's recruitment invitations: they edit the group, and are one of the two above.
const isRecruitmentInvitation = (invitation, targetGroupId) =>
  invitation.edit?.group?.id === targetGroupId &&
  groupInvitationOrder.includes(invitation.id.split('/-/')[1])
// A recruited role keeps its pending and refused invitees in /Invited and /Declined child groups;
// the card header shows each with its size, and a member of the role is an accepted invitee.
// Returns null for groups that are not recruited at all (Program Chairs, Authors).
const getRecruitmentCounts = (group) => {
  const invitedGroup = group.subGroups?.find((p) => p.id.endsWith('/Invited'))
  const declinedGroup = group.subGroups?.find((p) => p.id.endsWith('/Declined'))
  if (!invitedGroup && !declinedGroup) return null

  const members = group.members?.length ?? 0
  const invited = invitedGroup?.members?.length ?? 0
  const declined = declinedGroup?.members?.length ?? 0
  return {
    // Everyone still holding an invitation — what a reminder goes to. Assumes members arrived
    // through recruitment, so it floors at zero for roles whose members were added directly.
    awaiting: Math.max(0, invited - declined - members),
  }
}

// The process log reduces to a status and, when the function said something, a message.
const getProcessLogStatus = (processLogs) => {
  const runningLog = processLogs.find((p) => p.status === 'running')
  const log = runningLog ?? processLogs[0]
  if (!log) return null
  return {
    status: log.status,
    message: log.log?.[log.log.length - 1] ?? null,
    logUrl: `${process.env.API_V2_URL}/logs/process?id=${log.id}`,
  }
}

// "When the next thing happens", phrased for the kind of step it is.
const getSchedulePhrase = (invitation, isStageInvitation, lastRun, hasDateProcess) => {
  const now = dayjs()
  const cdate = dayjs(invitation.cdate)
  const dateOptions = {
    second: undefined,
    minute: undefined,
    hour: undefined,
    year: undefined,
  }
  const expdate = getInvitationExpDate(invitation)

  if (isStageInvitation && expdate) {
    if (cdate.isAfter(now))
      return `Scheduled to start ${formatDateTime(invitation.cdate, dateOptions)}`
    return dayjs(expdate).isAfter(now)
      ? `Scheduled to finish ${formatDateTime(expdate, dateOptions)}`
      : `Finished ${formatDateTime(expdate, dateOptions)}`
  }
  // A step with no date process is a tool people use — sending recruitment requests, deploying
  // assignments. Nothing fires on its activation date, so there is no run to report or miss.
  if (!hasDateProcess) {
    return cdate.isAfter(now)
      ? `Available from ${formatDateTime(invitation.cdate, dateOptions)}`
      : `Available since ${formatDateTime(invitation.cdate, dateOptions)}`
  }
  // An automatic step has run only if a completed process log says so — a past activation date
  // is not proof, the process may never have fired.
  if (cdate.isAfter(now))
    return `Scheduled to run ${formatDateTime(invitation.cdate, dateOptions)}`
  return lastRun
    ? `Ran ${formatDateTime(lastRun.edate ?? invitation.cdate, dateOptions)}`
    : `Due ${formatDateTime(invitation.cdate, dateOptions)}, not run yet`
}

// One sentence per step: the schedule, then whatever the process function logged. Red is
// reserved for an errored log — a missing configuration surfaces as a failed process function.
const WorkflowStepStatus = ({
  invitation,
  isStageInvitation,
  hasDateProcess,
  processLogs,
  onRunNow,
}) => {
  const log = getProcessLogStatus(processLogs)
  const isError = log?.status === 'error'
  // Logs arrive newest first, so the first completed one is the latest run. Queued or running
  // logs are not runs.
  const lastRun = processLogs.find((p) => p.status === 'ok' || p.status === 'error')
  const phrase = getSchedulePhrase(invitation, isStageInvitation, lastRun, hasDateProcess)
  const message = log?.status === 'running' ? 'Running…' : log?.message
  const statusText = `${phrase}.${message ? ` ${message}` : ''}`
  // Running is a real action — it moves the step's activation date to now — so it is one link
  // whose label says what it will do in this state, behind a confirmation. "Run again" only
  // once a completed run exists; a step rescheduled after running is still a re-run.
  const runLabel =
    !onRunNow || log?.status === 'running'
      ? null
      : isError
        ? 'Retry'
        : lastRun
          ? 'Run again'
          : 'Run now'

  return (
    <div className={`step-status${isError ? ' error' : ''}`}>
      <span className="step-status-text" title={statusText}>
        {statusText}
      </span>
      {runLabel && (
        <Popconfirm
          title={`${runLabel}?`}
          description="This sets the step's activation date to now, so its process runs immediately with the current configuration."
          okText={runLabel}
          cancelText="Cancel"
          onConfirm={onRunNow}
        >
          <a>{runLabel}</a>
        </Popconfirm>
      )}
      {log && (
        <a href={log.logUrl} target="_blank" rel="noopener noreferrer">
          logs
        </a>
      )}
    </div>
  )
}

const WorkflowTasks = ({
  workflowTasks,
  setCollapsedWorkflowInvitationIds,
  openWorkflowStage,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const { token } = theme.useToken()
  const numPending = workflowTasks.filter((p) => !p.isCompleted).length
  const numCompleted = workflowTasks.filter((p) => p.isCompleted).length

  const openSubInvitation = (task) => {
    openWorkflowStage(task.workflowInvitation.content?.workflow_stage_name?.value)
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
          <CaretRightOutlined
            rotate={isCollapsed ? 0 : 90}
            style={{ color: token.colorLink, cursor: 'pointer' }}
          />
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
  isStageInvitation,
  showDescription = true,
}) => {
  const [showEditor, setShowEditor] = useState(false)
  const { user } = useUser()
  const { token } = theme.useToken()
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
        api.post('/invitations/edits', {
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
        })
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

  const activationDateInvitation = subInvitations.find((p) => {
    const contentFields = Object.keys(p.edit?.content ?? {})
    return contentFields.length === 1 && contentFields[0] === 'activation_date'
  })

  const setCDateToNow = async () => {
    try {
      await api.post('/invitations/edits', {
        content: { activation_date: { value: dayjs().valueOf() } },
        invitations: activationDateInvitation.id,
      })
      loadWorkflowInvitations()
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <>
      <div className="edit-invitation-container">
        <div className="invitation-content">
          <Flex
            justify="left"
            align="center"
            gap="small"
            className="invitation-id-container"
            style={{ paddingTop: '0.25rem' }}
          >
            <div
              className="collapse-invitation"
              onClick={() => handleExpandCollapseSubInvitations(invitation.id)}
            >
              <CaretRightOutlined
                rotate={isCollapsed ? 0 : 90}
                style={{ color: token.colorLink, cursor: 'pointer' }}
              />
            </div>
            <span
              className="workflow-invitation-id"
              onClick={() => handleExpandCollapseSubInvitations(invitation.id)}
            >
              {/* naming keeps the original rule: steps that edit invitations were never "Create …" */}
              {invitation.duedate || invitation.edit?.invitation ? '' : 'Create '}
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
          </Flex>
          <WorkflowStepStatus
            invitation={invitation}
            isStageInvitation={isStageInvitation}
            hasDateProcess={isCreatingSubInvitations}
            processLogs={processLogs.filter((p) => p.invitation === invitation.id)}
            onRunNow={
              !isStageInvitation && activationDateInvitation && !isExpired
                ? setCDateToNow
                : null
            }
          />
          {/* The description is why organizers come to this page, but it is a constant —
              it belongs with the configuration, revealed by the same caret. */}
          {showDescription &&
            !isCollapsed &&
            (invitation.instructions ?? invitation.description) && (
              <div className="invitation-description">
                <Markdown text={invitation.instructions ?? invitation.description} />
              </div>
            )}
          {earliestDueDate && (
            <span className="missing-value">
              Configuration tasks due {dayjs(earliestDueDate).fromNow()}
            </span>
          )}
        </div>

        {showEditor && (
          <div className="content-editor-container">
            <InvitationEditor
              className="workflow-editor"
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
  workflowTasks,
}) => {
  const [showInvitationEditor, setShowInvitationEditor] = useState(false)
  const invitationName = prettyField(subInvitation.id.split('/').pop())
  const [subInvitationContentFieldValues, setSubInvitationContentFieldValues] = useState({})
  const isGroupInvitation = subInvitation.edit?.group // sub invitation can be group invitation too
  const isTask = workflowTasks.find((p) => p.id === subInvitation.id)
  const isTaskCompleted = isTask && subInvitation.isCompleted

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
        displayValue = isTask ? (
          <span className="missing-value">Configuration tasks are pending</span>
        ) : null
        hasMissingValue = isTask && true
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
                <a
                  href="#"
                  className="edit-close-button"
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
                className="workflow-editor"
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

// Timeline, Ongoing and Groups open the same way: the title, an optional action beside it, and a
// line on what the section holds.
const WorkflowSectionHeading = ({ title, action, description }) => (
  <>
    <div className="workflow-section-heading">
      <h4>{title}</h4>
      {action}
    </div>
    {description && <p className="workflow-section-intro">{description}</p>}
  </>
)

// Every link that leaves the workflow configuration carries it as the referrer, so the page it
// lands on offers a way back.
const getWorkflowReferrer = (domain) =>
  `[${prettyId(domain)} Workflow Configuration](/group/edit?id=${domain}#workflowInvitations)`
const groupUrl = (groupId, domain, { edit = false } = {}) =>
  `/group${edit ? '/edit' : ''}?id=${groupId}&referrer=${encodeURIComponent(
    getWorkflowReferrer(domain)
  )}`

const GroupLink = ({ group }) => (
  <>
    {group.web ? (
      <a href={groupUrl(group.id, group.domain)}>
        <span className="group-id">{prettyId(group.id, true)}</span>
      </a>
    ) : (
      <span className="group-id">{prettyId(group.id, true)}</span>
    )}
    <a
      className="id-icon"
      href={groupUrl(group.id, group.domain, { edit: true })}
      aria-label="Edit group"
    >
      <Icon name="new-window" />
    </a>
  </>
)

// One card per workflow group. `counts` is null for groups that are not recruited (Program Chairs,
// Authors); they get the same card without the funnel.
const CommitteeRoleCard = ({ group, groupInvitations, counts, reloadGroup }) => {
  const [activeGroupInvitation, setActivateGroupInvitation] = useState(null)
  const roleName = prettyId(group.id, true)

  return (
    <div className={`committee-card${activeGroupInvitation ? ' active' : ''}`}>
      <div className="committee-card-header">
        <GroupLink group={group} />
        <span className="member-count">
          {inflect(group.members?.length ?? 0, 'member', 'members', true)}
        </span>
        {/* Each child group with its size: Invited and Declined for a recruited role, Accepted
            for Authors. The role's own count is its accepted invitees. */}
        {group.subGroups?.map((subGroup) => (
          <span key={subGroup.id} className="committee-subgroup">
            <a href={groupUrl(subGroup.id, subGroup.domain, { edit: true })}>
              {prettyId(subGroup.id, true)}
            </a>
            <span className="member-count">{subGroup.members?.length ?? 0}</span>
          </span>
        ))}
        <div className="committee-actions">
          {groupInvitations.map((groupInvitation) => {
            const isActive = activeGroupInvitation?.id === groupInvitation.id
            // Nothing to remind when nobody is holding an unanswered invitation.
            const isDisabled = isReminderInvitation(groupInvitation.id) && !counts?.awaiting
            // Every action opens an editor in the card; none outranks the others. The one that
            // is open steps back so its Close reads as a way out, not another action.
            return (
              <Button
                key={groupInvitation.id}
                size="small"
                type={isActive ? 'default' : 'primary'}
                disabled={isDisabled}
                title={prettyInvitationId(groupInvitation.id)}
                onClick={() => setActivateGroupInvitation(isActive ? null : groupInvitation)}
              >
                {isActive ? 'Close' : getGroupInvitationLabel(groupInvitation.id, roleName)}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="group-description">
        <Markdown text={group.description} />
      </div>

      {activeGroupInvitation && (
        <div className="committee-editor">
          <div className="group-description">
            <Markdown text={activeGroupInvitation.description} />
          </div>
          <InvitationEditor
            className="workflow-editor"
            invitation={activeGroupInvitation}
            existingValue={{}}
            closeInvitationEditor={() => setActivateGroupInvitation(null)}
            onInvitationEditPosted={() => {
              promptMessage('Edit is posted')
              // Fresh counts for the funnel.
              reloadGroup()
            }}
            isGroupInvitation={true}
          />
          <div className="committee-editor-source">
            {prettyInvitationId(activeGroupInvitation.id)}
          </div>
        </div>
      )}
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
          className="workflow-editor"
          closeInvitationEditor={() => setStageToAdd(null)}
          onInvitationEditPosted={() => {
            setStageToAdd(null)
          }}
        />
      )}
    </div>
  )
}

const getSortedWorkflowStages = (invitations, workflowStageOrder = []) => {
  if (!invitations || invitations.length === 0) return []
  const getWorkflowStageName = (p) => p.content?.workflow_stage_name?.value
  const uniqueWorkflowStageNames = [
    ...new Set(invitations.map(getWorkflowStageName).filter(Boolean)),
  ]
  const sortedWorkflowStages = sortBy(
    uniqueWorkflowStageNames.map((name) => {
      const invitationsOfWorkflowStageName = invitations.filter(
        (p) => getWorkflowStageName(p) === name
      )
      // The stage's span comes from its timed steps; ongoing ones have no span to contribute.
      const timedInvitations = invitationsOfWorkflowStageName.filter(
        (p) => !isOngoingInvitation(p)
      )
      return {
        workflowStageName: name,
        invitationsOfWorkflowStageName: sortBy(invitationsOfWorkflowStageName, 'cdate'),
        periodStart: minBy(timedInvitations, 'cdate')?.cdate,
        // The last thing that happens in the stage: an expiration, or the activation of a step
        // that has none. Expirations alone ended automatic-only stages before their last step ran.
        periodEnd: max(timedInvitations.map((p) => getWindowEnd(p) ?? p.cdate)),
      }
    }),
    [
      (p) => {
        const stageIndex = workflowStageOrder.indexOf(p.workflowStageName)
        return stageIndex === -1 ? Infinity : stageIndex
      },
      'periodStart',
    ]
  )
  return sortedWorkflowStages
}

const WorkflowStageHeader = ({ workflowStage, stageIndex }) => {
  const { workflowStageName, invitationsOfWorkflowStageName } = workflowStage
  const { token } = theme.useToken()

  return (
    <Flex align="center" gap="middle">
      <Typography.Text strong style={{ color: token.colorError, fontSize: '0.75rem' }}>
        {stageIndex + 1}
      </Typography.Text>
      <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 0 }}>
        {prettyField(workflowStageName)}
      </Typography.Title>
      <Typography.Text type="secondary">
        {inflect(invitationsOfWorkflowStageName.length, 'step', 'steps', true)}
      </Typography.Text>
    </Flex>
  )
}

const WorkflowStagePeriod = ({ workflowStage }) => {
  const { periodStart, periodEnd } = workflowStage
  if (!periodStart) {
    return (
      <Typography.Text type="secondary" italic>
        Ongoing
      </Typography.Text>
    )
  }
  // Years appear only when the span crosses one; "Sep 18 – Sep 17" would read backwards.
  const crossesYear = periodEnd && dayjs(periodStart).year() !== dayjs(periodEnd).year()
  const periodDateOptions = {
    second: undefined,
    minute: undefined,
    hour: undefined,
    year: crossesYear ? 'numeric' : undefined,
  }
  const formattedPeriodStart = formatDateTime(periodStart, periodDateOptions)
  const formattedPeriodEnd = formatDateTime(periodEnd, periodDateOptions)

  return (
    <Typography.Text type="secondary" italic>
      {formattedPeriodStart}
      {formattedPeriodEnd &&
        formattedPeriodEnd !== formattedPeriodStart &&
        ` – ${formattedPeriodEnd}`}
    </Typography.Text>
  )
}

const WorkFlowInvitations = ({ group }) => {
  const groupId = group.id
  const submissionName = group.content?.submission_name?.value
  const [allInvitations, setAllInvitations] = useState([])
  const [workflowGroups, setWorkflowGroups] = useState([])
  const [workflowInvitations, setWorkflowInvitations] = useState(null)
  const [stageInvitations, setStageInvitations] = useState([])
  const [processLogs, setProcessLogs] = useState([])
  const [missingValueInvitationIds, setMissingValueInvitationIds] = useState([])
  const events = useSocket('venue/workflow', ['date-process-updated'], { venueid: groupId })
  const workflowInvitationsRef = useRef({})
  const [collapsedWorkflowInvitationIds, setCollapsedWorkflowInvitationIds] = useState([])
  const [workflowTasks, setWorkflowTasks] = useState([])

  const workflowStages = getSortedWorkflowStages(
    workflowInvitations,
    group.content?.workflow_stages?.value
  )

  const invitationsWithoutWorkflowStage = workflowInvitations?.filter(
    (p) => !p.content?.workflow_stage_name?.value
  )

  const [stageStatusFilter, setStageStatusFilter] = useState('all')
  // The Ongoing list can run long, so it starts collapsed.
  const [isOngoingOpen, setIsOngoingOpen] = useState(false)

  // Built from every stage, not the filtered ones, so the axis does not rescale while filtering.
  const timelineDomain = getTimelineDomain(workflowStages)

  const stageStatusCounts = workflowStages.reduce((counts, p) => {
    const { stageStatus } = getStageStatus(p.invitationsOfWorkflowStageName)
    return { ...counts, [stageStatus]: (counts[stageStatus] ?? 0) + 1 }
  }, {})
  // "All" carries no count: the Timeline heading shows how many stages are listed.
  const stageFilterOptions = [
    { value: 'all', label: 'All' },
    ...Object.keys(stageStatusFilterLabels)
      .filter((p) => stageStatusCounts[p])
      .map((p) => ({
        value: p,
        label: `${stageStatusFilterLabels[p]} ${stageStatusCounts[p]}`,
        icon: (
          <span className={`stage-status-glyph ${stageStatusColors[p]}`} aria-hidden="true">
            <StageStatusGlyph statusColor={stageStatusColors[p]} />
          </span>
        ),
      })),
  ]
  const visibleWorkflowStages =
    stageStatusFilter === 'all'
      ? workflowStages
      : workflowStages.filter(
          (p) =>
            getStageStatus(p.invitationsOfWorkflowStageName).stageStatus === stageStatusFilter
        )

  const getGroupInvitations = (targetGroupId) =>
    sortBy(
      allInvitations.filter((p) => isRecruitmentInvitation(p, targetGroupId)),
      (p) => groupInvitationOrder.indexOf(p.id.split('/-/')[1])
    )
  const committeeGroups = Array.from(workflowGroups.values()).map((committeeGroup) => ({
    group: committeeGroup,
    counts: getRecruitmentCounts(committeeGroup),
  }))

  // Ongoing: steps with no end date, still listed in their stage but off the timeline. The venue's
  // information and home page are edited from their own tabs, membership under Workflow Groups.
  const ongoingSteps = workflowStages.flatMap((p) =>
    p.invitationsOfWorkflowStageName.filter((q) => isOngoingInvitation(q))
  )
  const { token } = theme.useToken()
  // An open stage gets one platform tint; its status is already carried by the tag and bars.
  const openStageBackground = '#f0f1ef'

  const [activeStageKeys, setActiveStageKeys] = useState(null)
  const defaultOpenStageKey = workflowStages.find(
    (p) => getStageStatus(p.invitationsOfWorkflowStageName).stageStatus === 'IN PROGRESS'
  )?.workflowStageName
  const openStageKeys = activeStageKeys ?? [defaultOpenStageKey]
  const openWorkflowStage = (workflowStageName) => {
    if (!workflowStageName) return
    setActiveStageKeys((keys) => {
      const currentKeys = keys ?? [defaultOpenStageKey]
      return currentKeys.includes(workflowStageName)
        ? currentKeys
        : [...currentKeys, workflowStageName]
    })
  }

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

  const formatWorkflowInvitation = (stepObj, invitations, workflowInvitationIds, logs) => {
    const invitationId = stepObj.id
    const isStageInvitation = isWindowInvitation(stepObj)
    const subInvitations = invitations.flatMap((i) => {
      if (i.edit?.invitation?.id === invitationId && !workflowInvitationIds.includes(i.id)) {
        return {
          ...i,
          isCompleted: stepObj.invitations?.includes(i.id),
        }
      }
      return []
    })
    const invitationTasks = subInvitations.flatMap((p) => {
      if (!p.duedate) return []
      return p
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
      isStageInvitation,
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
        { resultsKey: 'logs' }
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
    if (!tempFilterResult.length && !skipWorkflowInvitationCheck) {
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
    // Resolve the venue's role groups once: each entry pairs a main role group id with
    // its subgroup ids (Invited/Declined/Accepted). Entries with a rolesField rely on
    // the roles array alone; the field key is the default for the remaining entries.
    const roleGroups = workflowGroupKeys.flatMap((p) => {
      const mainGroupIds = p.rolesField
        ? (group.content?.[p.rolesField]?.value ?? []).map((role) => `${groupId}/${role}`)
        : [group.content?.[p.field]?.value].filter(Boolean)
      return mainGroupIds.map((id) => ({
        id,
        subGroupIds: p.subGroupSuffixes.map((q) => `${id}${q}`),
      }))
    })
    const workflowGroupIds = roleGroups.flatMap((p) => [p.id, ...p.subGroupIds])

    const getAllGroupsP = api
      .get('/groups', {
        ids: workflowGroupIds,
      })
      .then((result) => result.groups)

    // Load only the invitations directly under the venue and its main role groups
    // (`venue_id/-/`, `role_id/-/`); a single `venue_id/` prefix would also return every
    // submission-related invitation, and the Invited/Declined/Accepted subgroups only
    // hold invitations the timeline never shows.
    const invitationPrefixes = [groupId, ...roleGroups.map((p) => p.id)].map(
      (id) => `${id}/-/`
    )
    const getAllInvitationsP = Promise.all(
      invitationPrefixes.map((prefix) =>
        api.getAll('/invitations', {
          prefix,
          expired: true,
          trash: true,
          type: 'all',
          filterStaticForum: true,
          domain: groupId,
        })
      )
    ).then((results) => results.flat())

    let getStageInvitationTemplatesP =
      group.id === group.domain
        ? api
            .getAll('/invitations', {
              prefix: `${process.env.SUPER_USER}/Support/-/.*`,
            })
            .then((invitations) => invitations.filter((p) => p.id.endsWith('_Template')))
        : Promise.resolve([])
    getStageInvitationTemplatesP = Promise.resolve([])
    try {
      const [groups, invitations, stageInvitations, logs] = await Promise.all([
        getAllGroupsP,
        getAllInvitationsP,
        getStageInvitationTemplatesP,
        loadProcessLogs(),
      ])

      const mainGroups = groups.filter((p) => p.parent === group.id)
      const workflowGroupMap = new Map()
      const orderedMainGroupIds = workflowGroupKeys.flatMap((p) => {
        const roles = p.rolesField ? group.content?.[p.rolesField]?.value : null
        if (roles?.length) return roles.map((role) => `${groupId}/${role}`)
        const workflowGroupId = group.content?.[p.field]?.value
        return workflowGroupId ? [workflowGroupId] : []
      })
      const orderedMainGroups = [
        ...orderedMainGroupIds.flatMap((id) => mainGroups.filter((p) => p.id === id)),
        ...mainGroups.filter((p) => !orderedMainGroupIds.includes(p.id)),
      ]
      orderedMainGroups.forEach((p) => {
        const subGroups = sortBy(
          groups.filter((q) => q.parent === p.id),
          'cdate'
        )
        workflowGroupMap.set(p.id, { ...p, subGroups })
      })
      const exclusionWorkflowInvitations = group.content?.exclusion_workflow_invitations?.value
      const filteredInvitations = filterWorkflowInvitations(
        exclusionWorkflowInvitations,
        invitations
      )
      const invitationsToShowInWorkflow = filteredInvitations.map((stepObj) => {
        return formatWorkflowInvitation(
          stepObj,
          invitations,
          filteredInvitations.map((p) => p.id),
          logs
        )
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
      setWorkflowGroups(workflowGroupMap)
      setAllInvitations(invitations)
      setStageInvitations(stageInvitations)
      // loadProcessLogs()
    } catch (error) {
      promptError(error.message)
    }
  }

  const renderWorkflowInvitation = (
    stepObj,
    isInWorkflowStage,
    { inOngoing = false } = {}
  ) => {
    const {
      id,
      isExpired,
      sectionClass,
      isMissingValue,
      formattedDate,
      subInvitations,
      isStageInvitation,
    } = stepObj
    const isRowCollapsed = collapsedWorkflowInvitationIds.includes(id)
    // On the timeline an opened step spans beneath its row, across the bar column, as in the
    // mock; left inside the narrow info column its configuration wrapped to a sliver.
    const isOnTimeline = isInWorkflowStage && !!timelineDomain
    const subInvitationsBlock = subInvitations.length > 0 && (
      <motion.div
        initial={false}
        animate={
          isRowCollapsed
            ? { height: 0, overflow: 'hidden' }
            : { height: 'auto', transitionEnd: { overflow: 'visible' } }
        }
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden' }}
      >
        {subInvitations.map((subInvitation) => (
          <SubInvitationRow
            key={subInvitation.id}
            subInvitation={subInvitation}
            workflowInvitation={stepObj}
            loadWorkflowInvitations={loadAllInvitations}
            domainObject={group.content}
            setMissingValueInvitationIds={setMissingValueInvitationIds}
            workflowInvitationsRef={workflowInvitationsRef}
            workflowTasks={workflowTasks}
          />
        ))}
      </motion.div>
    )
    return (
      <motion.div
        layout="position"
        key={id}
        transition={{ duration: 0.5 }}
        ref={(el) => {
          // The copy in the Ongoing section must not take the ref used to scroll back to a step.
          if (!inOngoing) workflowInvitationsRef.current[id] = el
        }}
        className="motion-div"
      >
        <div
          className={`workflow-invitation-container${isExpired ? ' expired' : ''}${
            inOngoing
              ? ' ongoing-step-row'
              : isInWorkflowStage && timelineDomain
                ? ' in-stage'
                : sectionClass
          }`}
          style={isInWorkflowStage || inOngoing ? { width: '100%' } : undefined}
        >
          {/* In Ongoing the status line already says "Available since …"; a second date column there
              only squeezed and wrapped. */}
          {!isOnTimeline && !inOngoing && (
            <div className="invitation-cdate">{formattedDate}</div>
          )}
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
              isStageInvitation={isStageInvitation}
              showDescription={!isOnTimeline}
            />
            {!isOnTimeline && subInvitationsBlock}
          </div>
          {isOnTimeline && (
            <>
              <WorkflowStepTrack
                invitation={stepObj}
                isStageInvitation={isStageInvitation}
                domain={timelineDomain}
                dateContent={formattedDate}
              />
              <span
                style={{
                  width: timelineStatusWidth + timelineGap,
                  flex: `0 0 ${timelineStatusWidth + timelineGap}px`,
                }}
              />
              <div className="edit-invitation-info step-expanded">
                {!isRowCollapsed && (stepObj.instructions ?? stepObj.description) && (
                  <div className="invitation-description">
                    <Markdown text={stepObj.instructions ?? stepObj.description} />
                  </div>
                )}
                {subInvitationsBlock}
              </div>
            </>
          )}
        </div>
      </motion.div>
    )
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

    return () => {
      clearTimeout(eventsHandler)
    }
  }, [events?.uniqueId])

  return (
    <>
      <WorkflowTasks
        workflowTasks={workflowTasks}
        setCollapsedWorkflowInvitationIds={setCollapsedWorkflowInvitationIds}
        openWorkflowStage={openWorkflowStage}
      />
      {workflowInvitations ? (
        workflowInvitations.length > 0 && (
          <EditorSection className="workflow">
            {/* The heading counts the stages listed, so a filter reads as "11 of 18 stages". */}
            <WorkflowSectionHeading
              title={`Timeline (${
                stageStatusFilter === 'all'
                  ? inflect(workflowStages.length, 'stage', 'stages', true)
                  : `${visibleWorkflowStages.length} of ${inflect(workflowStages.length, 'stage', 'stages', true)}`
              })`}
              action={
                workflowStages.length > 0 && (
                  <Typography.Link
                    onClick={() =>
                      setActiveStageKeys(
                        openStageKeys.length
                          ? []
                          : visibleWorkflowStages.map((p) => p.workflowStageName)
                      )
                    }
                  >
                    {openStageKeys.length ? 'Collapse all stages' : 'Expand all stages'}
                  </Typography.Link>
                )
              }
              description="The venue's stages in order. Expand a stage to see its steps, when each one runs and how it went, and to change their settings."
            />
            {/* Column headers: the filter over the stage names, the months over the bars. */}
            <div className="workflow-invitations-header">
              <div className="workflow-invitations-filter">
                {stageFilterOptions.length > 2 && (
                  <Segmented
                    className="stage-filter"
                    size="small"
                    options={stageFilterOptions}
                    value={stageStatusFilter}
                    onChange={setStageStatusFilter}
                  />
                )}
              </div>
              {timelineDomain && <WorkflowTimelineAxis domain={timelineDomain} />}
            </div>

            <div className="invitation-workflow-container">
              {workflowStages.length > 0 && (
                <Collapse
                  activeKey={openStageKeys}
                  onChange={(keys) => setActiveStageKeys(keys)}
                  bordered={false}
                  size="small"
                  collapsible="header"
                  expandIcon={({ isActive }) => (
                    <CaretRightOutlined
                      rotate={isActive ? 90 : 0}
                      style={{ color: token.colorLink }}
                    />
                  )}
                  style={{ width: '110%' }}
                  items={visibleWorkflowStages.map((workflowStage) => {
                    const stageIndex = workflowStages.indexOf(workflowStage)
                    const { workflowStageName, invitationsOfWorkflowStageName } = workflowStage
                    const stageStatus = getStageStatus(invitationsOfWorkflowStageName)
                    return {
                      key: workflowStageName,
                      label: (
                        <WorkflowStageHeader
                          workflowStage={workflowStage}
                          stageIndex={stageIndex}
                        />
                      ),
                      extra: (
                        <Flex align="center" gap={timelineGap}>
                          {timelineDomain ? (
                            <WorkflowStageTrack
                              workflowStage={workflowStage}
                              domain={timelineDomain}
                              statusColor={stageStatus.stageStatusColor}
                            />
                          ) : (
                            <WorkflowStagePeriod workflowStage={workflowStage} />
                          )}
                          {stageStatusFilter === 'all' ? (
                            <StageStatusIcon status={stageStatus} />
                          ) : (
                            <span
                              style={{
                                width: timelineStatusWidth,
                                flex: `0 0 ${timelineStatusWidth}px`,
                              }}
                            />
                          )}
                        </Flex>
                      ),
                      forceRender: true,
                      styles: {
                        header: {
                          // Status is carried by the tag and the bar; tint only marks what is open.
                          backgroundColor: openStageKeys.includes(workflowStageName)
                            ? openStageBackground
                            : 'transparent',
                          alignItems: 'center',
                          paddingInline: 0,
                        },
                        body: { padding: '2px 0 10px' },
                      },
                      children: invitationsOfWorkflowStageName.map((stepObj) =>
                        renderWorkflowInvitation(stepObj, true)
                      ),
                    }
                  })}
                />
              )}
              {invitationsWithoutWorkflowStage.map((stepObj) =>
                renderWorkflowInvitation(stepObj, false)
              )}
              {stageInvitations.length > 0 && (
                <AddStageInvitationSection
                  stageInvitations={stageInvitations}
                  venueId={group.domain}
                />
              )}
            </div>
          </EditorSection>
        )
      ) : (
        <LoadingSpinner />
      )}

      {workflowInvitations && ongoingSteps.length > 0 && (
        <EditorSection className="workflow">
          <WorkflowSectionHeading
            title={`Ongoing (${inflect(ongoingSteps.length, 'step', 'steps', true)})`}
            action={
              <Typography.Link onClick={() => setIsOngoingOpen((isOpen) => !isOpen)}>
                {isOngoingOpen ? 'Collapse ongoing' : 'Expand ongoing'}
              </Typography.Link>
            }
            description="Available for as long as the venue runs. These have no end date, so they are not on the timeline."
          />
          <div className="ongoing-container">
            {isOngoingOpen &&
              ongoingSteps.map((stepObj) => (
                <div key={stepObj.id} className="ongoing-step">
                  <div className="ongoing-stage">
                    {prettyField(stepObj.content.workflow_stage_name.value)}
                  </div>
                  {renderWorkflowInvitation(stepObj, false, { inOngoing: true })}
                </div>
              ))}
          </div>
        </EditorSection>
      )}

      {workflowGroups.size > 0 && (
        <EditorSection className="workflow">
          <WorkflowSectionHeading
            title={`Groups (${workflowGroups.size})`}
            description="The groups that take part in the venue, each with its size. Invite people to the recruited roles; a member has accepted, and the Invited and Declined groups hold the rest. Everything else about a group — its members, its home page — is on the group's own page."
          />
          <div className="committee-container">
            {committeeGroups.map(({ group: committeeGroup, counts }) => (
              <CommitteeRoleCard
                key={committeeGroup.id}
                group={committeeGroup}
                counts={counts}
                groupInvitations={getGroupInvitations(committeeGroup.id)}
                reloadGroup={loadAllInvitations}
              />
            ))}
          </div>
        </EditorSection>
      )}
    </>
  )
}

export default WorkFlowInvitations
