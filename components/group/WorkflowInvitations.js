import { CaretRightOutlined } from '@ant-design/icons'
import {
  Button,
  Collapse,
  Flex,
  Input,
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
import GroupMembers from './GroupMembers'
import InvitationEditor from './InvitationEditor'

dayjs.extend(isSameOrBefore)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(relativeTime)

const isDateInFuture = (cdate) => cdate > Date.now()
const isDateInPast = (expDateOrCDate) => expDateOrCDate <= Date.now()
const getInvitationExpDate = (invitation) =>
  invitation.expdate ?? invitation.edit?.invitation?.expdate

// A disabled step carries a deletion date. It stays listed in its stage, but it will not run, so
// it counts for nothing: not the stage's status, not its span, not the axis.
const isDisabledInvitation = (invitation) => !!invitation.ddate

// A step's latest process run failed. A run still in flight is not a failure.
const hasFailedRun = (invitation, processLogs) =>
  getProcessLogStatus(processLogs.filter((p) => p.invitation === invitation.id))?.status ===
  'error'

// What a step's dates will be once a sub-invitation edit is saved: the editor's values for the
// dates it edits, the step's current ones for the rest. The sub-invitation's edit template says
// which of its fields lands on cdate, duedate or expdate.
const getEditedStepDates = (subInvitation, workflowInvitation, editorData) => {
  const dates = {
    cdate: workflowInvitation.cdate,
    duedate: workflowInvitation.duedate ?? workflowInvitation.edit?.invitation?.duedate,
    expdate: getInvitationExpDate(workflowInvitation),
  }
  Object.keys(subInvitation.edit?.content ?? {}).forEach((key) => {
    const path = getPath(subInvitation.edit.invitation, key) ?? ''
    const dateKey = ['cdate', 'duedate', 'expdate'].find((p) => path.endsWith(p))
    if (dateKey && editorData[key] != null) dates[dateKey] = Number(editorData[key])
  })
  return dates
}

const dateLabel = (timestamp) => formatDateTime(timestamp, { second: undefined })

// Dates a step cannot have, named so the fix is obvious — the API only says they conflict.
const getStepDateConflict = (stepName, { cdate, duedate, expdate }) => {
  const before = (what, a, than, b) =>
    `${stepName}: the ${what} (${dateLabel(a)}) is before the ${than} (${dateLabel(b)}).`
  if (cdate && duedate && duedate < cdate)
    return before('due date', duedate, 'activation date', cdate)
  if (duedate && expdate && expdate < duedate)
    return before('expiration date', expdate, 'due date', duedate)
  if (cdate && expdate && expdate < cdate)
    return before('expiration date', expdate, 'activation date', cdate)
  return null
}

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

// A step that is drawn on the timeline and counts toward its stage.
const isTimelineStep = (invitation) =>
  !isOngoingInvitation(invitation) && !isDisabledInvitation(invitation)

const getStageStatus = (allInvitationsOfWorkflowStage, processLogs = []) => {
  // Disabled steps will not run: they decide nothing. A stage with nothing else is disabled.
  const activeInvitations = allInvitationsOfWorkflowStage.filter(
    (p) => !isDisabledInvitation(p)
  )
  if (!activeInvitations.length)
    return { stageStatus: 'DISABLED', stageStatusColor: 'disabled' }
  // A failed run outranks the schedule: it needs someone, whatever the dates say.
  if (activeInvitations.some((p) => hasFailedRun(p, processLogs)))
    return { stageStatus: 'FAILED', stageStatusColor: 'error' }
  // Ongoing invitations never expire, so they would keep a stage from ever completing.
  const timedInvitations = activeInvitations.filter((p) => !isOngoingInvitation(p))
  const invitationsOfWorkflowStage = timedInvitations.length
    ? timedInvitations
    : activeInvitations
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
  FAILED: 'Failed',
  'IN PROGRESS': 'In progress',
  COMPLETED: 'Completed',
  SCHEDULED: 'Scheduled',
  DISABLED: 'Disabled',
}

// The glyph colour class for each status, matching getStageStatus's stageStatusColor.
const stageStatusColors = {
  FAILED: 'error',
  'IN PROGRESS': 'processing',
  COMPLETED: 'success',
  SCHEDULED: 'default',
  DISABLED: 'disabled',
}

// The axis spans whole months around the dates on which something must happen — a step's
// activation or its due date — so it never depends on hardcoded conference dates. Expirations
// do not set it: a withdrawal window left open for a year would otherwise squash every other
// stage into a corner. A window that ends past the axis runs off its edge, open-ended.
// Positions are percentages, so the track stays responsive.
const getTimelineDomain = (workflowStages) => {
  const timestamps = workflowStages.flatMap((p) =>
    p.invitationsOfWorkflowStageName
      .filter(isTimelineStep)
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
  const timedInvitations = invitationsOfWorkflowStageName.filter(isTimelineStep)
  if (!timedInvitations.length || !periodStart) {
    const note = invitationsOfWorkflowStageName.every(isDisabledInvitation)
      ? 'Disabled'
      : 'Ongoing'
    return (
      <div
        className={`timeline-track stage-track ${statusColor}`}
        style={{ width: timelineTrackWidth, flex: `0 0 ${timelineTrackWidth}px` }}
      >
        <TimelineGrid domain={domain} />
        <div className="track-note">{note}</div>
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
const WorkflowStepTrack = ({
  invitation,
  isStageInvitation,
  domain,
  dateContent,
  hasError,
}) => {
  // Nothing to draw for a step that will not run — its status line says so — or one that
  // never ends, which gets a word where its bar would be.
  if (isDisabledInvitation(invitation) || isOngoingInvitation(invitation)) {
    return (
      <div
        className="timeline-track step-track ongoing"
        style={{ width: timelineTrackWidth, flex: `0 0 ${timelineTrackWidth}px` }}
      >
        <TimelineGrid domain={domain} />
        {isOngoingInvitation(invitation) && (
          <div className="track-note" title="No end date — listed under Ongoing">
            Ongoing
          </div>
        )}
      </div>
    )
  }
  const expdate = isStageInvitation ? getInvitationExpDate(invitation) : null
  const startPercent = domain.percentOf(invitation.cdate)
  const endPercent = domain.percentOf(expdate ?? invitation.cdate)
  const isMoment = endPercent - startPercent < momentThresholdPercent
  const labelPlacement = getTrackLabelPlacement(startPercent, endPercent)
  const now = Date.now()
  // A failed run is drawn red whatever its dates say; otherwise fill encodes time.
  const state = hasError
    ? 'error'
    : invitation.cdate > now
      ? 'upcoming'
      : expdate && expdate > now
        ? 'running'
        : 'done'

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
    {statusColor === 'error' && (
      <>
        <circle cx="7" cy="7" r="6.5" fill="currentColor" />
        <path d="M7 3.6v4" stroke="#fffdfa" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="7" cy="10.3" r="1" fill="#fffdfa" />
      </>
    )}
    {statusColor === 'disabled' && (
      <>
        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4.5 7h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
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
// By convention the process function's last log line is the message for the UI. A run that
// raised instead has an empty log and the exception's own message in `error` — that is the
// reason the step failed, so a failed run shows it.
const getProcessLogStatus = (processLogs) => {
  const runningLog = processLogs.find((p) => p.status === 'running')
  const log = runningLog ?? processLogs[0]
  if (!log) return null
  const lastLine = log.log?.[log.log.length - 1] ?? null
  return {
    status: log.status,
    message: log.status === 'error' ? (log.error?.message ?? lastLine) : lastLine,
    logUrl: `${process.env.API_V2_URL}/logs/process?id=${log.id}`,
  }
}

// A moment in a status sentence. Today it is relative — "in 5 minutes", "2 hours ago" — since
// that is what matters on the day; any other day it is the date. `since` is for "since …",
// where a time of day reads better than "10 minutes ago".
const whenLabel = (timestamp, { since = false } = {}) => {
  const moment = dayjs(timestamp)
  if (moment.isSame(dayjs(), 'day')) {
    return since ? moment.format('h:mm A') : moment.fromNow()
  }
  return formatDateTime(timestamp, {
    second: undefined,
    minute: undefined,
    hour: undefined,
    year: undefined,
  })
}

// "When the next thing happens", phrased for the kind of step it is.
const getSchedulePhrase = (invitation, isStageInvitation, lastRun, hasDateProcess) => {
  const now = dayjs()
  const cdate = dayjs(invitation.cdate)
  const expdate = getInvitationExpDate(invitation)

  if (isStageInvitation && expdate) {
    if (cdate.isAfter(now)) return `Scheduled to start ${whenLabel(invitation.cdate)}`
    return dayjs(expdate).isAfter(now)
      ? `Scheduled to finish ${whenLabel(expdate)}`
      : `Finished ${whenLabel(expdate)}`
  }
  // A step with no date process is a tool people use — sending recruitment requests, deploying
  // assignments. Nothing fires on its activation date, so there is no run to report or miss.
  if (!hasDateProcess) {
    return cdate.isAfter(now)
      ? `Available ${whenLabel(invitation.cdate)}`
      : `Available since ${whenLabel(invitation.cdate, { since: true })}`
  }
  // An automatic step has run only if a completed process log says so — a past activation date
  // is not proof, the process may never have fired.
  if (cdate.isAfter(now)) return `Scheduled to run ${whenLabel(invitation.cdate)}`
  return lastRun
    ? `Ran ${whenLabel(lastRun.edate ?? invitation.cdate)}`
    : `Due ${whenLabel(invitation.cdate)}, not run yet`
}

// One sentence per step: the schedule, then whatever the process function logged. Red is
// reserved for an errored log — a missing configuration surfaces as a failed process function.
// Logs arrive newest first, so the first completed one is the latest run. Queued or running
// logs are not runs.
const getLastRun = (processLogs) =>
  processLogs.find((p) => p.status === 'ok' || p.status === 'error')

// What running the step would be in its current state: "Retry" after a failure; "Run now"
// while its date is still ahead — the click means "don't wait", whatever ran before — or when
// nothing has run; "Run again" once it has run. Nothing while a run is in flight.
const getRunLabel = (invitation, processLogs) => {
  const log = getProcessLogStatus(processLogs)
  if (log?.status === 'running') return null
  if (log?.status === 'error') return 'Retry'
  if (invitation.cdate > Date.now()) return 'Run now'
  return getLastRun(processLogs) ? 'Run again' : 'Run now'
}

const WorkflowStepStatus = ({
  invitation,
  isStageInvitation,
  hasDateProcess,
  processLogs,
  isDisabled,
  runLabel,
  onRun,
}) => {
  const log = getProcessLogStatus(processLogs)
  const isError = !isDisabled && log?.status === 'error'
  const lastRun = getLastRun(processLogs)
  const phrase = getSchedulePhrase(invitation, isStageInvitation, lastRun, hasDateProcess)
  const message = log?.status === 'running' ? 'Running…' : log?.message
  // A disabled step has no schedule to report: it will not run until it is enabled again.
  const statusText = isDisabled
    ? 'Disabled — this step will not run.'
    : `${phrase}.${message ? ` ${message}` : ''}`

  return (
    <div className={`step-status${isError ? ' error' : ''}`}>
      <span className="step-status-text" title={statusText}>
        {statusText}
      </span>
      {log && (
        <a href={log.logUrl} target="_blank" rel="noopener noreferrer">
          logs
        </a>
      )}
      {runLabel && (
        <Popconfirm
          title={`${runLabel}?`}
          description="This sets the step's activation date to now, so its process runs immediately with the current configuration."
          okText={runLabel}
          cancelText="Cancel"
          onConfirm={onRun}
        >
          <a className="step-run">{runLabel}</a>
        </Popconfirm>
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

// Disable or enable a step — the row's one control, in the column the stage's status glyph
// uses, so every row has it in the same place. The ban circle is "off", not "gone".
const StepToggle = ({ invitation, subInvitations, isExpired, loadWorkflowInvitations }) => {
  const { user } = useUser()
  const profileId = user?.profile?.id
  const label = isExpired ? 'Enable' : 'Disable'

  const toggle = async () => {
    try {
      const edits = [invitation, ...subInvitations].map((p) =>
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
      await Promise.all(edits)
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
    <Tooltip title={label}>
      <Button
        size="small"
        type="text"
        className="step-toggle"
        aria-label={label}
        icon={<Icon name={isExpired ? 'ok-circle' : 'ban-circle'} />}
        onClick={toggle}
      />
    </Tooltip>
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
  showToggleInline = false,
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

  const activationDateInvitation = subInvitations.find((p) => {
    const contentFields = Object.keys(p.edit?.content ?? {})
    return contentFields.length === 1 && contentFields[0] === 'activation_date'
  })

  // Who the step's invitation goes to, as a tooltip on the step name: it is reference, not
  // something to read on every row.
  const inviteeName = (invitee) => {
    if (invitee === invitation.domain) return 'Administrators'
    if (invitee === '~') return 'Registered Users'
    return prettyId(invitee.replace(invitation.domain, ''))
  }
  const inviteeTooltip = invitees?.length
    ? `Invitation to ${invitees.map(inviteeName).join(', ')}`
    : null
  const stepLogs = processLogs.filter((p) => p.invitation === invitation.id)
  // Running is a real action — it moves the step's activation date to now — so it sits on the
  // status line with the run it repeats, behind a confirmation. Only automatic steps that are
  // enabled can be run.
  const runLabel =
    !isStageInvitation && activationDateInvitation && !isExpired
      ? getRunLabel(invitation, stepLogs)
      : null

  // A date process only fires for a date still ahead when it is scheduled, so "now" is a minute
  // from now.
  const setCDateToNow = async () => {
    try {
      await api.post('/invitations/edits', {
        content: { activation_date: { value: dayjs().add(1, 'minute').valueOf() } },
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
              data-toggle="tooltip"
              data-placement="top"
              title={inviteeTooltip}
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
            {/* Off the timeline there is no control column, so the toggle sits by the name. */}
            {showToggleInline && (
              <StepToggle
                invitation={invitation}
                subInvitations={subInvitations}
                isExpired={isExpired}
                loadWorkflowInvitations={loadWorkflowInvitations}
              />
            )}
          </Flex>
          <WorkflowStepStatus
            invitation={invitation}
            isStageInvitation={isStageInvitation}
            hasDateProcess={isCreatingSubInvitations}
            processLogs={stepLogs}
            isDisabled={isExpired}
            runLabel={runLabel}
            onRun={setCDateToNow}
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
  const stepName = prettyId(workflowInvitation.id.replace(workflowInvitation.domain, ''))

  // What a save does, said after the fact. A window step (reviews, rebuttals) propagates a
  // settings change to the per-submission invitations it already created — its process runs
  // on edit by design. A one-shot step runs only on its activation date, so a change after it
  // ran reaches nothing until the step is run again.
  const getSavedMessage = () => {
    if (isGroupInvitation || isDisabledInvitation(workflowInvitation)) return null
    if (!workflowInvitation.dateprocesses?.length || workflowInvitation.cdate > Date.now())
      return null
    return workflowInvitation.isStageInvitation
      ? `Saved. The change is being applied to the ${stepName} invitations already created.`
      : `Saved. ${stepName} has already run; use Run again to apply the change to what it created.`
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
                validateSubmit={
                  isGroupInvitation
                    ? undefined
                    : (editorData) =>
                        getStepDateConflict(
                          stepName,
                          getEditedStepDates(subInvitation, workflowInvitation, editorData)
                        )
                }
                errorPrefix={`${stepName} · ${invitationName}`}
                closeInvitationEditor={() => setShowInvitationEditor(false)}
                onInvitationEditPosted={() => {
                  const savedMessage = getSavedMessage()
                  if (savedMessage) promptMessage(savedMessage, { scrollToTop: false })
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
// Authors); they get the same card without the funnel. Besides recruiting, a card can message
// the group's members through its Message invitation.
const CommitteeRoleCard = ({
  group,
  domainGroup,
  groupInvitations,
  messageInvitations,
  counts,
  reloadGroup,
}) => {
  const [activeGroupInvitation, setActivateGroupInvitation] = useState(null)
  // The group whose members are being messaged. Child groups (Invited, Declined, Accepted) are
  // messaged from their own page, which their link opens.
  const [messageGroup, setMessageGroup] = useState(null)
  const roleName = prettyId(group.id, true)
  const getMessageInvitation = (groupId) =>
    messageInvitations.find((p) => p.id === `${groupId}/-/Message`)
  // As on the group page: "Message All" goes through the venue's own Message invitation, and
  // messaging selected members through the group's. Either one is enough to offer messaging.
  const venueMessageInvitation = getMessageInvitation(domainGroup.id)
  const canMessage = (groupId) => !!(venueMessageInvitation || getMessageInvitation(groupId))
  const messageInvitation =
    messageGroup && (getMessageInvitation(messageGroup.id) ?? venueMessageInvitation)

  // One editor open at a time.
  const toggleInvitation = (groupInvitation) => {
    setMessageGroup(null)
    setActivateGroupInvitation((current) =>
      current?.id === groupInvitation.id ? null : groupInvitation
    )
  }
  const toggleMessages = (target) => {
    setActivateGroupInvitation(null)
    setMessageGroup((current) => (current?.id === target.id ? null : target))
  }
  const isOpen = !!(activeGroupInvitation || messageGroup)

  return (
    <div className={`committee-card${isOpen ? ' active' : ''}`}>
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
                onClick={() => toggleInvitation(groupInvitation)}
              >
                {isActive ? 'Close' : getGroupInvitationLabel(groupInvitation.id, roleName)}
              </Button>
            )
          })}
          {canMessage(group.id) && (
            <Button
              size="small"
              type={messageGroup?.id === group.id ? 'default' : 'primary'}
              title={prettyInvitationId(
                (getMessageInvitation(group.id) ?? venueMessageInvitation).id
              )}
              onClick={() => toggleMessages(group)}
            >
              {messageGroup?.id === group.id ? 'Close' : 'Message members'}
            </Button>
          )}
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

      {messageGroup && (
        <div className="committee-editor">
          <div className="committee-editor-heading">
            Message {prettyId(messageGroup.id, true)}
          </div>
          {/* The members page's own list and compose flow. It expects the group as that page
              loads it, with its domain in details. */}
          <GroupMembers
            key={messageGroup.id}
            group={{
              ...messageGroup,
              details: messageGroup.details ?? { domain: domainGroup },
            }}
            reloadGroup={reloadGroup}
            messageAllMembersInvitation={venueMessageInvitation}
            messageSingleMemberInvitation={messageInvitation}
          />
          <div className="committee-editor-source">
            {prettyInvitationId(messageInvitation.id)}
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
      // The stage's span comes from its timed steps; ongoing ones have no span to contribute,
      // and disabled ones will not run.
      const timedInvitations = invitationsOfWorkflowStageName.filter(isTimelineStep)
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

// The venue's role groups: each entry pairs a main role group id with its subgroup ids
// (Invited/Declined/Accepted). Entries with a rolesField rely on the roles array alone; the
// field key is the default for the remaining entries. Shared with the Activity tab.
export const getWorkflowGroupIds = (group) => {
  const roleGroups = workflowGroupKeys.flatMap((p) => {
    const mainGroupIds = p.rolesField
      ? (group.content?.[p.rolesField]?.value ?? []).map((role) => `${group.id}/${role}`)
      : [group.content?.[p.field]?.value].filter(Boolean)
    return mainGroupIds.map((id) => ({
      id,
      subGroupIds: p.subGroupSuffixes.map((q) => `${id}${q}`),
    }))
  })
  return { roleGroups, workflowGroupIds: roleGroups.flatMap((p) => [p.id, ...p.subGroupIds]) }
}

const WorkFlowInvitations = ({ group }) => {
  const groupId = group.id
  const submissionName = group.content?.submission_name?.value
  const [allInvitations, setAllInvitations] = useState([])
  const [workflowGroups, setWorkflowGroups] = useState([])
  const [workflowInvitations, setWorkflowInvitations] = useState(null)
  const [stageInvitations, setStageInvitations] = useState([])
  // The Message invitation of each workflow group and child group, for messaging members here.
  const [messageInvitations, setMessageInvitations] = useState([])
  const [processLogs, setProcessLogs] = useState([])
  const [missingValueInvitationIds, setMissingValueInvitationIds] = useState([])
  const events = useSocket('venue/workflow', ['date-process-updated'], { venueid: groupId })
  const workflowInvitationsRef = useRef({})
  const invitationIdsWithLogsRef = useRef([])
  const pendingRefreshIdsRef = useRef(new Set())
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
  // Search narrows the list to stages whose name, or one of whose steps, contains the term —
  // a step matches on its name, its description or one of its settings' names. A stage matched
  // by its own name keeps every step.
  const [stepSearch, setStepSearch] = useState('')
  const searchTerm = stepSearch.trim().toLowerCase()
  const matchesSearch = (text) => (text ?? '').toLowerCase().includes(searchTerm)
  const stepMatchesSearch = (stepObj) =>
    !searchTerm ||
    matchesSearch(prettyId(stepObj.id.replace(stepObj.domain, ''))) ||
    matchesSearch(stepObj.instructions ?? stepObj.description) ||
    (stepObj.subInvitations ?? []).some((p) =>
      matchesSearch(prettyField(p.id.split('/').pop()))
    )
  const stageNameMatchesSearch = (workflowStage) =>
    !searchTerm || matchesSearch(prettyField(workflowStage.workflowStageName))
  const stageMatchesSearch = (workflowStage) =>
    stageNameMatchesSearch(workflowStage) ||
    workflowStage.invitationsOfWorkflowStageName.some(stepMatchesSearch)
  // The Ongoing list can run long, so it starts collapsed.
  const [isOngoingOpen, setIsOngoingOpen] = useState(false)

  // Built from every stage, not the filtered ones, so the axis does not rescale while filtering.
  const timelineDomain = getTimelineDomain(workflowStages)

  const stageStatusCounts = workflowStages.reduce((counts, p) => {
    const { stageStatus } = getStageStatus(p.invitationsOfWorkflowStageName, processLogs)
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
  const isFiltered = stageStatusFilter !== 'all' || !!searchTerm
  const visibleWorkflowStages = workflowStages.filter(
    (p) =>
      (stageStatusFilter === 'all' ||
        getStageStatus(p.invitationsOfWorkflowStageName, processLogs).stageStatus ===
          stageStatusFilter) &&
      stageMatchesSearch(p)
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
    (p) =>
      getStageStatus(p.invitationsOfWorkflowStageName, processLogs).stageStatus ===
      'IN PROGRESS'
  )?.workflowStageName
  const openStageKeys = activeStageKeys ?? [defaultOpenStageKey]

  // A search opens the stages it finds, so the matching steps are in view at once.
  useEffect(() => {
    if (!searchTerm) return
    setActiveStageKeys(
      workflowStages.filter(stageMatchesSearch).map((p) => p.workflowStageName)
    )
  }, [searchTerm])
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

  // A link from the Activity tab names a step (?step=…): open its stage, expand it, bring it
  // into view. Once, when the steps are first loaded.
  const deepLinkedStepRef = useRef(false)
  useEffect(() => {
    if (deepLinkedStepRef.current || !workflowInvitations?.length) return
    const stepId = new URLSearchParams(window.location.search).get('step')
    if (!stepId) return
    deepLinkedStepRef.current = true
    const stepObj = workflowInvitations.find((p) => p.id === stepId)
    if (!stepObj) return
    openWorkflowStage(stepObj.content?.workflow_stage_name?.value)
    setCollapsedWorkflowInvitationIds((ids) => ids.filter((id) => id !== stepId))
    setTimeout(() => {
      workflowInvitationsRef.current?.[stepId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 600)
  }, [workflowInvitations])

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

  const loadProcessLogs = async (invitationIds) => {
    if (!invitationIds?.length) return []
    try {
      const results = await Promise.all(
        invitationIds.map((invitationId) =>
          api.get('/logs/process', {
            invitation: invitationId,
            select: 'id,sdate,edate,invitation,status,log,error',
          })
        )
      )
      return orderBy(
        results.flatMap((p) => p.logs ?? []),
        ['edate'],
        ['desc']
      )
    } catch (error) {
      promptError(error.message)
      return []
    }
  }

  const refreshProcessLogs = async (invitationIds) => {
    const idsToRefresh = invitationIds.filter((id) =>
      invitationIdsWithLogsRef.current.includes(id)
    )
    if (!idsToRefresh.length) return
    const logs = await loadProcessLogs(idsToRefresh)
    setProcessLogs((existingLogs) => [
      ...existingLogs.filter((p) => !idsToRefresh.includes(p.invitation)),
      ...logs,
    ])
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
    const { roleGroups, workflowGroupIds } = getWorkflowGroupIds(group)

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

    // Messaging a group runs on its own Message invitation, which lives under the group — child
    // groups (Accepted, Invited, Declined) included, which the prefixes above leave out.
    const getMessageInvitationsP = api
      .get('/invitations', {
        ids: [groupId, ...workflowGroupIds].map((id) => `${id}/-/Message`),
        expired: true,
      })
      .then((result) => result.invitations ?? [])
      .catch(() => [])

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
      const [groups, invitations, stageInvitations, groupMessageInvitations] =
        await Promise.all([
          getAllGroupsP,
          getAllInvitationsP,
          getStageInvitationTemplatesP,
          getMessageInvitationsP,
        ])
      setMessageInvitations(groupMessageInvitations)

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
      invitationIdsWithLogsRef.current = filteredInvitations.flatMap((p) =>
        p.dateprocesses?.length > 0 ? p.id : []
      )
      const logs = await loadProcessLogs(invitationIdsWithLogsRef.current)
      setProcessLogs(logs)
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
              showToggleInline={!isOnTimeline}
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
                hasError={hasFailedRun(stepObj, processLogs)}
              />
              <span
                className="step-control"
                style={{
                  width: timelineStatusWidth + timelineGap,
                  flex: `0 0 ${timelineStatusWidth + timelineGap}px`,
                }}
              >
                <StepToggle
                  invitation={stepObj}
                  subInvitations={subInvitations}
                  isExpired={isExpired}
                  loadWorkflowInvitations={loadAllInvitations}
                />
              </span>
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
    const eventInvitationId = events?.data?.invitation
    if (!eventInvitationId) return
    pendingRefreshIdsRef.current.add(eventInvitationId)
    const eventsHandler = setTimeout(() => {
      const invitationIdsToRefresh = [...pendingRefreshIdsRef.current]
      pendingRefreshIdsRef.current.clear()
      refreshProcessLogs(invitationIdsToRefresh)
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
                !isFiltered
                  ? inflect(workflowStages.length, 'stage', 'stages', true)
                  : `${visibleWorkflowStages.length} of ${inflect(workflowStages.length, 'stage', 'stages', true)}`
              })`}
              action={
                workflowStages.length > 0 && (
                  <>
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
                    {/* The status filter sits over the stage names; the search, which is free
                        text, goes up here where the heading row has the room. */}
                    <Input
                      className="step-search"
                      size="small"
                      allowClear
                      placeholder="Search steps"
                      aria-label="Search steps"
                      value={stepSearch}
                      onChange={(e) => setStepSearch(e.target.value)}
                    />
                  </>
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
                    const stageStatus = getStageStatus(
                      invitationsOfWorkflowStageName,
                      processLogs
                    )
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
                      children: invitationsOfWorkflowStageName
                        .filter(
                          (stepObj) =>
                            stageNameMatchesSearch(workflowStage) || stepMatchesSearch(stepObj)
                        )
                        .map((stepObj) => renderWorkflowInvitation(stepObj, true)),
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
                domainGroup={group}
                counts={counts}
                groupInvitations={getGroupInvitations(committeeGroup.id)}
                messageInvitations={messageInvitations}
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
