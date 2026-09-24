import { CaretRightOutlined } from '@ant-design/icons'
import { Button, Flex, Popconfirm, Segmented, Tooltip, Typography, theme } from 'antd'
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

// A step's last completed run: logs arrive newest first, and queued or running logs are not runs.
const getLastRun = (invitationId, processLogs = []) =>
  processLogs.find(
    (p) => p.invitation === invitationId && (p.status === 'ok' || p.status === 'error')
  )

// Where today falls in a span, as a class and a style: `past` once it ended, `future` before it
// starts, and `current` in between, with --split marking today as a share of the span so the part
// already behind us is drawn grey and the rest blue.
// A span cut off at the axis edge is split over the part that is drawn (`drawnEnd`), so the change
// of colour stays under the today line.
const getSpanTiming = (start, end, drawnEnd = end) => {
  const now = Date.now()
  if (now < start) return { timing: 'future', style: {} }
  if (!end || now >= end) return { timing: 'past', style: {} }
  const splitPercent = ((now - start) / (Math.min(end, drawnEnd) - start)) * 100
  return { timing: 'current', style: { '--split': `${Math.min(100, splitPercent)}%` } }
}

// A dot is a step that fires on a date; its colour is that step's own state. Bars stay one colour.
const getMomentState = (invitation, processLogs = []) => {
  if (processLogs.some((p) => p.invitation === invitation.id && p.status === 'running')) {
    return 'running'
  }
  if (getLastRun(invitation.id, processLogs)?.status === 'error') return 'failed'
  return invitation.cdate > Date.now() ? 'upcoming' : 'done'
}

const getStageStatus = (allInvitationsOfWorkflowStage, processLogs = []) => {
  // A step whose last run failed overrides the date-based status: the stage needs the PC's attention.
  if (
    allInvitationsOfWorkflowStage.some(
      (p) => getLastRun(p.id, processLogs)?.status === 'error'
    )
  ) {
    return { stageStatus: 'NEEDS ATTENTION', stageStatusColor: 'warning' }
  }
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

// A stage's status is a glyph, so its column is a glyph wide.
const timelineStatusWidth = 16
const dayMs = 86400000

const stageStatusFilterLabels = {
  'NEEDS ATTENTION': 'Needs attention',
  'IN PROGRESS': 'In progress',
  COMPLETED: 'Completed',
  SCHEDULED: 'Scheduled',
}

// The glyph colour class for each status, matching getStageStatus's stageStatusColor.
const stageStatusColors = {
  'NEEDS ATTENTION': 'warning',
  'IN PROGRESS': 'processing',
  COMPLETED: 'success',
  SCHEDULED: 'default',
}

// "Sep 22", with the year only when asked for.
const formatShortDate = (timestamp, withYear = false) =>
  formatDateTime(timestamp, {
    second: undefined,
    minute: undefined,
    hour: undefined,
    year: withYear ? 'numeric' : undefined,
  })

// The axis spans whole months around the dates on which something must happen — a step's
// activation or its due date — so it never depends on hardcoded conference dates. Expirations
// do not set it: a withdrawal window left open for a year would otherwise squash every other
// stage into a corner. A window that ends past the axis trails off in dots at its edge.
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

// A window narrower than this reads as a line rather than a bar, so it is drawn as a marker.
const momentThresholdPercent = 0.4

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
    <div
      className="timeline-now"
      style={{ left: `${domain.percentOf(Date.now())}%` }}
      title={`Today · ${formatShortDate(Date.now(), true)}`}
    />
  </>
)

// One line of the venue overview: the stage's envelope with each of its steps inside, on the
// venue's own months. Selecting it opens that stage below.
const StageOverviewRow = ({
  workflowStage,
  stageIndex,
  status,
  domain,
  isOpen,
  onSelect,
  processLogs,
}) => {
  const { periodStart, periodEnd, invitationsOfWorkflowStageName, workflowStageName } =
    workflowStage
  const timedInvitations = invitationsOfWorkflowStageName.filter(
    (p) => !isOngoingInvitation(p)
  )
  const hasSpan = timedInvitations.length > 0 && periodStart
  const startPercent = hasSpan ? domain.percentOf(periodStart) : 0
  const endPercent = hasSpan ? domain.percentOf(periodEnd ?? periodStart) : 0
  const isOpenEnded = (end) => !!end && end > domain.end
  const windows = timedInvitations.map((invitation) => {
    const windowEnd = getWindowEnd(invitation)
    const left = domain.percentOf(invitation.cdate)
    const right = domain.percentOf(windowEnd ?? invitation.cdate)
    return {
      invitation,
      left,
      width: right - left,
      isMoment: right - left < momentThresholdPercent,
      isOpenEnded: isOpenEnded(windowEnd),
      ...getSpanTiming(invitation.cdate, windowEnd, domain.end),
    }
  })
  // Anything running past the axis stops short of its edge and trails off in dots, coloured like
  // the bar that continues — a step's window if one does, else the stage's span.
  const continuingWindow = windows.findLast((p) => !p.isMoment && p.isOpenEnded)
  let continuesAs = null
  if (continuingWindow) continuesAs = continuingWindow.timing
  else if (hasSpan && isOpenEnded(periodEnd)) continuesAs = 'span'

  return (
    <button
      type="button"
      className={`overview-row${isOpen ? ' current' : ''}`}
      onClick={() => onSelect(workflowStageName)}
      title={`${prettyField(workflowStageName)} — ${stageStatusFilterLabels[status.stageStatus]}`}
    >
      <span className="overview-index">{stageIndex + 1}</span>
      <span className="overview-name">{prettyField(workflowStageName)}</span>
      <span className={`timeline-track stage-track ${status.stageStatusColor} overview-track`}>
        <TimelineGrid domain={domain} />
        {hasSpan ? (
          <>
            {endPercent - startPercent >= momentThresholdPercent && (
              <span
                className={`stage-envelope${isOpenEnded(periodEnd) ? ' open-end' : ''}`}
                style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
              />
            )}
            {windows.map((p) =>
              p.isMoment ? (
                <span
                  key={p.invitation.id}
                  className={`stage-moment ${getMomentState(p.invitation, processLogs)}`}
                  style={{ left: `${p.left}%` }}
                />
              ) : (
                <span
                  key={p.invitation.id}
                  className={`stage-window ${p.timing}${p.isOpenEnded ? ' open-end' : ''}`}
                  style={{ left: `${p.left}%`, width: `${p.width}%`, ...p.style }}
                />
              )
            )}
            {continuesAs && (
              <span
                className={`track-continues ${continuesAs}`}
                title="Continues past the end of the timeline"
              />
            )}
          </>
        ) : (
          <span className="track-ongoing">No end date</span>
        )}
      </span>
      <span className="overview-period">
        <WorkflowStagePeriod workflowStage={workflowStage} />
      </span>
      <StageStatusIcon status={status} />
    </button>
  )
}

// A stage's own span, padded so a bar never touches the column edge. Inside an open stage the
// steps are drawn on this local axis rather than the venue's months, so a two-week window is a
// bar you can read. Ticks suit the span: weekly for a fortnight, fortnightly for a couple of
// months, monthly beyond that.
const getLocalDomain = (workflowStage) => {
  const timedInvitations = workflowStage.invitationsOfWorkflowStageName.filter(
    (p) => !isOngoingInvitation(p)
  )
  if (!timedInvitations.length) return null
  const boundStart = Math.min(...timedInvitations.map((p) => p.cdate))
  const boundEnd = Math.max(...timedInvitations.map((p) => getWindowEnd(p) ?? p.cdate))
  const span = Math.max(boundEnd - boundStart, 4 * dayMs)
  const start = boundStart - span * 0.1
  const end = boundEnd + span * 0.1
  const total = end - start
  const spanDays = span / dayMs
  // The smallest interval that keeps the axis to about four ticks.
  const tickDays = [7, 14, 30, 61, 91, 182].find((p) => spanDays / p <= 4) ?? 365
  const ticks = []
  for (
    let cursor = dayjs(start).startOf('day').valueOf();
    cursor < end;
    cursor += tickDays * dayMs
  ) {
    if (cursor > start) ticks.push(cursor)
  }
  return {
    start,
    end,
    ticks,
    boundStart,
    boundEnd,
    // As in the stage's own dates, years appear only when the span crosses one.
    crossesYear: dayjs(boundStart).year() !== dayjs(boundEnd).year(),
    percentOf: (timestamp) => Math.max(0, Math.min(100, ((timestamp - start) / total) * 100)),
  }
}

// The stage's start and end are solid lines with the padding outside them shaded; on the axis
// row the two boundary dates are labelled in bold, and tick labels that would collide with them
// are dropped.
const LocalGrid = ({ domain, showLabels }) => {
  const startPercent = domain.percentOf(domain.boundStart)
  const endPercent = domain.percentOf(domain.boundEnd)
  // A tick label is dropped when it would run into a boundary label or the label before it.
  // Boundary labels carry a year when the stage crosses one, so they need more room.
  const minLabelGapPercent = domain.crossesYear ? 24 : 16
  let lastLabelPercent = startPercent
  const shownLabelTicks = new Set(
    domain.ticks.filter((tick) => {
      const percent = domain.percentOf(tick)
      if (
        percent - lastLabelPercent < minLabelGapPercent ||
        endPercent - percent < minLabelGapPercent
      )
        return false
      lastLabelPercent = percent
      return true
    })
  )
  const now = Date.now()
  return (
    <>
      <span className="local-outside" style={{ left: 0, width: `${startPercent}%` }} />
      <span className="local-outside" style={{ left: `${endPercent}%`, right: 0 }} />
      {domain.ticks.map((tick) => {
        const percent = domain.percentOf(tick)
        if (percent <= startPercent || percent >= endPercent) return null
        return (
          <span key={tick} className="local-tick" style={{ left: `${percent}%` }}>
            {showLabels && shownLabelTicks.has(tick) && (
              <span className="local-tick-label">{formatShortDate(tick)}</span>
            )}
          </span>
        )
      })}
      <span className="local-bound start" style={{ left: `${startPercent}%` }}>
        {showLabels && (
          <span className="local-bound-label">
            {formatShortDate(domain.boundStart, domain.crossesYear)}
          </span>
        )}
      </span>
      {endPercent - startPercent > 0.5 && (
        <span className="local-bound end" style={{ left: `${endPercent}%` }}>
          {showLabels && (
            <span className="local-bound-label">
              {formatShortDate(domain.boundEnd, domain.crossesYear)}
            </span>
          )}
        </span>
      )}
      {now > domain.start && now < domain.end && (
        <span
          className="timeline-now"
          style={{ left: `${domain.percentOf(now)}%` }}
          title={`Today · ${formatShortDate(now, true)}`}
        />
      )}
    </>
  )
}

// A step's own bar on its stage's axis: grey where it is past, blue from today to its end, striped
// if it has not started. A dot takes its step's state: ran, running, upcoming or failed.
const WorkflowStepTrack = ({ invitation, isStageInvitation, domain, processLogs }) => {
  if (isOngoingInvitation(invitation) || !domain) {
    return (
      <div className="timeline-track step-track local-track ongoing">
        {domain && <LocalGrid domain={domain} />}
        <span className="track-ongoing">No end date</span>
      </div>
    )
  }
  const expdate = isStageInvitation ? getInvitationExpDate(invitation) : null
  const duedate = invitation.duedate ?? invitation.edit?.invitation?.duedate
  const startPercent = domain.percentOf(invitation.cdate)
  const endPercent = domain.percentOf(expdate ?? invitation.cdate)
  const isMoment = endPercent - startPercent < 1.5
  const windowTiming = getSpanTiming(invitation.cdate, expdate)
  const labelEnd = duedate ?? expdate
  // A window that crosses a year puts it on its end date, so it never reads backwards.
  const labelEndCrossesYear =
    !!labelEnd && dayjs(labelEnd).year() !== dayjs(invitation.cdate).year()
  const label = `${formatShortDate(invitation.cdate)}${
    labelEnd ? ` – ${formatShortDate(labelEnd, labelEndCrossesYear)}` : ''
  }`
  // The label goes right of the bar, else left of it; a bar spanning most of the column carries
  // its label inside, so it never spills into the step column.
  let placement = 'inside'
  if (endPercent <= 62) placement = 'right'
  else if (startPercent >= 38) placement = 'left'
  const labelStyle = {
    right: { left: `${endPercent}%` },
    left: { right: `${100 - startPercent}%` },
    inside: { left: `${startPercent}%` },
  }[placement]

  return (
    <div className="timeline-track step-track local-track">
      <LocalGrid domain={domain} />
      <span
        className={
          isMoment
            ? `step-moment ${getMomentState(invitation, processLogs)}`
            : `step-window ${windowTiming.timing}`
        }
        style={
          isMoment
            ? { left: `${startPercent}%` }
            : {
                left: `${startPercent}%`,
                width: `${endPercent - startPercent}%`,
                ...windowTiming.style,
              }
        }
      />
      <span
        className={`step-dates${placement === 'left' ? ' before-bar' : ''}${
          placement === 'inside' ? ' inside-bar' : ''
        }`}
        style={labelStyle}
      >
        <span className="cdate">{label}</span>
      </span>
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
    {statusColor === 'warning' && (
      <>
        <circle cx="7" cy="7" r="6.5" fill="currentColor" />
        <path d="M7 3.4v4.4" stroke="#2b2100" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="7" cy="10.3" r="0.95" fill="#2b2100" />
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

  const accepted = group.members?.length ?? 0
  const invited = invitedGroup?.members?.length ?? 0
  const declined = declinedGroup?.members?.length ?? 0
  const declinedIds = declinedGroup?.members ?? []
  const acceptedIds = group.members ?? []
  return {
    invited,
    declined,
    accepted,
    // Everyone still holding an invitation — what a reminder goes to. Assumes members arrived
    // through recruitment, so it floors at zero for roles whose members were added directly.
    awaiting: Math.max(0, invited - declined - accepted),
    people: {
      pending: (invitedGroup?.members ?? []).filter(
        (p) => !declinedIds.includes(p) && !acceptedIds.includes(p)
      ),
      declined: declinedIds,
      accepted: acceptedIds,
    },
  }
}

// The process log reduces to a status and, when the function said something, a message.
const getProcessLogStatus = (processLogs) => {
  // A step scheduled to run again has a queued log, which would otherwise hide a failed last run.
  const runningLog = processLogs.find((p) => p.status === 'running')
  const lastRun = processLogs.find((p) => p.status === 'ok' || p.status === 'error')
  const log = runningLog ?? (lastRun?.status === 'error' ? lastRun : processLogs[0])
  if (!log) return null
  return {
    status: log.status,
    message: log.log?.[log.log.length - 1] ?? null,
    // A failed run keeps its error apart from the log lines it printed.
    error: log.error ? [log.error.name, log.error.message].filter(Boolean).join(': ') : null,
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
  // A failed run's error gets a line of its own under the schedule, so it shows on the collapsed
  // step without opening it.
  const errorText = isError ? (log.error ?? log.message) : null
  const statusText = `${phrase}.${message && !errorText ? ` ${message}` : ''}`
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
      {errorText && (
        <span className="step-status-error" title={errorText}>
          <span className="step-status-error-text">{errorText}</span>
        </span>
      )}
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
  descriptionSlot = null,
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
          {descriptionSlot}
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
// A section that opens and closes (PC Actions) gets a caret before its title; both toggle it.
const WorkflowSectionHeading = ({ title, action, description, isOpen, onToggle }) => {
  const { token } = theme.useToken()
  return (
    <>
      <div className="workflow-section-heading">
        {onToggle ? (
          <div
            className="section-toggle"
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            onClick={onToggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onToggle()
              }
            }}
          >
            <CaretRightOutlined rotate={isOpen ? 90 : 0} style={{ color: token.colorLink }} />
            <h4>{title}</h4>
          </div>
        ) : (
          <h4>{title}</h4>
        )}
        {action}
      </div>
      {description && <p className="workflow-section-intro">{description}</p>}
    </>
  )
}

// Every link that leaves the workflow configuration carries it as the referrer, so the page it
// lands on offers a way back.
const getWorkflowReferrer = (domain) =>
  `[${prettyId(domain)} Workflow Configuration](/group/edit?id=${domain}#workflowInvitations)`
const groupUrl = (groupId, domain, { edit = false } = {}) =>
  `/group${edit ? '/edit' : ''}?id=${groupId}&referrer=${encodeURIComponent(
    getWorkflowReferrer(domain)
  )}`

const formatCount = (count) => count.toLocaleString('en-US')

// Proportion of invitations by answer. Each segment is also stated in the text beside it.
const RecruitmentMeter = ({ accepted, awaiting, declined }) => {
  const total = Math.max(accepted + awaiting + declined, 1)
  const toPercent = (count) => `${(count / total) * 100}%`
  return (
    <div className="rec-meter" aria-hidden="true">
      <span className="rec-seg accepted" style={{ width: toPercent(accepted) }} />
      <span className="rec-seg awaiting" style={{ width: toPercent(awaiting) }} />
      <span className="rec-seg declined" style={{ width: toPercent(declined) }} />
    </div>
  )
}

const RecruitmentCounts = ({ counts }) => (
  <p className="rec-legend">
    <span>
      <span className="rec-key accepted" aria-hidden="true" />
      <strong>{formatCount(counts.accepted)}</strong> accepted
    </span>
    <span>
      <span className="rec-key awaiting" aria-hidden="true" />
      <strong>{formatCount(counts.awaiting)}</strong> not replied
    </span>
    <span>
      <span className="rec-key declined" aria-hidden="true" />
      <strong>{formatCount(counts.declined)}</strong> declined
    </span>
    <span className="rec-of">of {formatCount(counts.invited)} invited</span>
  </p>
)

const peopleListTabs = [
  { value: 'pending', label: 'Not replied' },
  { value: 'declined', label: 'Declined' },
  { value: 'accepted', label: 'Accepted' },
]

const PeopleList = ({ people, onClose }) => {
  const [activeTab, setActiveTab] = useState('pending')
  const shownPeople = people[activeTab]
  return (
    <div className="rec-panel">
      <div className="rec-panel-head">
        <Segmented
          className="stage-filter"
          size="small"
          options={peopleListTabs}
          value={activeTab}
          onChange={setActiveTab}
        />
        <button type="button" className="rec-link" onClick={onClose}>
          Close
        </button>
      </div>
      {shownPeople.length ? (
        <ul className="rec-people">
          {shownPeople.slice(0, 8).map((p) => (
            <li key={p}>
              <a href={p.startsWith('~') ? `/profile?id=${p}` : undefined}>{p}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rec-empty">Nobody here yet.</p>
      )}
      {shownPeople.length > 8 && (
        <p className="rec-note">
          Showing 8 of {formatCount(shownPeople.length)}. The full list is on the group page.
        </p>
      )}
    </div>
  )
}

// Groups: a view of every group in the venue with its size. A recruited group also shows how its
// invitations stand; inviting and reminding are PC actions, so the row links there.
const GroupRow = ({ group, counts, onOpenRecruitment }) => {
  const [showPeople, setShowPeople] = useState(false)
  const memberCount = group.members?.length ?? 0
  return (
    <article className="rec-card">
      <div className="rec-head">
        <h5 className="rec-title">
          <a href={groupUrl(group.id, group.domain, { edit: true })}>
            {prettyId(group.id, true)}
          </a>
        </h5>
        <span className="rec-members">{inflect(memberCount, 'member', 'members', true)}</span>
        <a className="rec-open" href={groupUrl(group.id, group.domain, { edit: true })}>
          Open group page
        </a>
      </div>
      {group.description && (
        <div className="rec-desc">
          <Markdown text={group.description} />
        </div>
      )}
      {counts && (
        <div className="rec-counts">
          <div className="rec-counts-label">Recruitment invitations</div>
          {counts.invited ? (
            <>
              <RecruitmentMeter {...counts} />
              <RecruitmentCounts counts={counts} />
            </>
          ) : (
            <p className="rec-body">Nobody has been invited yet.</p>
          )}
          <div className="rec-actions">
            {counts.invited > 0 && (
              <button
                type="button"
                className="rec-link"
                aria-expanded={showPeople}
                onClick={() => setShowPeople((isShown) => !isShown)}
              >
                {showPeople ? 'Hide who' : 'See who'}
              </button>
            )}
            <button
              type="button"
              className="rec-link"
              onClick={() => onOpenRecruitment(group.id)}
            >
              Invite or remind in PC Actions
            </button>
          </div>
          {showPeople && (
            <PeopleList people={counts.people} onClose={() => setShowPeople(false)} />
          )}
        </div>
      )}
    </article>
  )
}

// PC Actions: one row per recruited role. Invite and Remind open the role's own recruitment
// invitations in the shared editor.
const RecruitmentActionRow = ({ group, groupInvitations, counts, reloadGroup, focusTick }) => {
  const [activeGroupInvitation, setActiveGroupInvitation] = useState(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const rowRef = useRef(null)
  const roleName = prettyId(group.id, true)
  const getActionLabel = (invitationId) => {
    if (!isReminderInvitation(invitationId)) {
      return getGroupInvitationLabel(invitationId, roleName.toLowerCase())
    }
    return counts?.awaiting ? `Remind ${formatCount(counts.awaiting)}` : 'Remind'
  }

  useEffect(() => {
    if (!focusTick || !rowRef.current) return undefined
    const element = rowRef.current
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - 120,
      behavior: 'smooth',
    })
    element.querySelector('button')?.focus({ preventScroll: true })
    setIsFlashing(true)
    const timeout = setTimeout(() => setIsFlashing(false), 1200)
    return () => clearTimeout(timeout)
  }, [focusTick])

  return (
    <div className={`rec-action-row${isFlashing ? ' rec-flash' : ''}`} ref={rowRef}>
      <div className="rec-action-head">
        <span className="rec-action-name">Recruit {roleName}</span>
        <span className="rec-action-state">
          {counts?.invited
            ? `${formatCount(counts.accepted)} accepted · ${formatCount(counts.awaiting)} not replied`
            : 'Nobody invited yet'}
        </span>
        <div className="rec-actions inline">
          {groupInvitations.map((groupInvitation) => {
            const isActive = activeGroupInvitation?.id === groupInvitation.id
            const isReminder = isReminderInvitation(groupInvitation.id)
            // Nothing to remind when nobody is holding an unanswered invitation.
            const isDisabled = isReminder && !counts?.awaiting
            return (
              <Button
                key={groupInvitation.id}
                size="small"
                type={isActive || isReminder ? 'default' : 'primary'}
                disabled={isDisabled}
                title={prettyInvitationId(groupInvitation.id)}
                onClick={() => setActiveGroupInvitation(isActive ? null : groupInvitation)}
              >
                {isActive ? 'Close' : getActionLabel(groupInvitation.id)}
              </Button>
            )
          })}
          {groupInvitations.some((p) => isReminderInvitation(p.id)) && !counts?.awaiting && (
            <span className="rec-why">Nobody is waiting on a reply.</span>
          )}
        </div>
      </div>
      {activeGroupInvitation && (
        <div className="rec-panel">
          <div className="group-description">
            <Markdown text={activeGroupInvitation.description} />
          </div>
          <InvitationEditor
            className="workflow-editor"
            invitation={activeGroupInvitation}
            existingValue={{}}
            closeInvitationEditor={() => setActiveGroupInvitation(null)}
            onInvitationEditPosted={() => {
              promptMessage('Edit is posted')
              reloadGroup()
            }}
            isGroupInvitation={true}
          />
        </div>
      )}
    </div>
  )
}

// Venue information and emergency shutdown each have their own tab — one is a long form, the
// other needs its warning and typed confirmation — so these rows switch to it.
const openGroupTab = (tabId) => {
  document.querySelector(`a[role="tab"][href="#${tabId}"]`)?.click()
  window.scrollTo({ top: 0 })
}

const VenueActions = () => (
  <div className="ongoing-step rec-action-group">
    <div className="ongoing-stage">Venue</div>
    <div className="rec-action-row">
      <div className="rec-action-head">
        <span className="rec-action-name">Venue information</span>
        <span className="rec-action-state">
          Title, dates, location, contact and the venue&apos;s settings
        </span>
        <div className="rec-actions inline">
          <Button size="small" onClick={() => openGroupTab('groupContent')}>
            Edit venue information
          </Button>
        </div>
      </div>
    </div>
    <div className="rec-action-row">
      <div className="rec-action-head">
        <span className="rec-action-name">Emergency shutdown</span>
        <span className="rec-action-state">
          Suspends all access for everyone except the organizers
        </span>
        <div className="rec-actions inline">
          <Button size="small" danger onClick={() => openGroupTab('emergencyShutdown')}>
            Emergency shutdown…
          </Button>
        </div>
      </div>
    </div>
  </div>
)

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
        No end date
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
  // PC Actions can run long, so it starts collapsed.
  const [isOngoingOpen, setIsOngoingOpen] = useState(false)
  // Which recruited role PC Actions should scroll to, and a tick so a repeat request re-fires.
  const [recruitmentFocus, setRecruitmentFocus] = useState({ groupId: null, tick: 0 })

  // Built from every stage, not the filtered ones, so the axis does not rescale while filtering.
  const timelineDomain = getTimelineDomain(workflowStages)
  const getWorkflowStageStatus = (workflowStage) =>
    getStageStatus(workflowStage.invitationsOfWorkflowStageName, processLogs)

  const stageStatusCounts = workflowStages.reduce((counts, p) => {
    const { stageStatus } = getWorkflowStageStatus(p)
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
          (p) => getWorkflowStageStatus(p).stageStatus === stageStatusFilter
        )

  const getGroupInvitations = (targetGroupId) =>
    sortBy(
      allInvitations.filter((p) => isRecruitmentInvitation(p, targetGroupId)),
      (p) => groupInvitationOrder.indexOf(p.id.split('/-/')[1])
    )
  const committeeGroups = Array.from(workflowGroups.values()).map((committeeGroup) => ({
    group: committeeGroup,
    counts: getRecruitmentCounts(committeeGroup),
    groupInvitations: getGroupInvitations(committeeGroup.id),
  }))
  const recruitedGroups = committeeGroups.filter((p) => p.groupInvitations.length > 0)

  // PC Actions: steps with no end date, still listed in their stage but off the timeline, plus
  // recruitment and the venue-level actions.
  // Recruitment and assignment steps stay in their stages only: recruiting already has its own
  // rows here, and assignments are configured where their stage sits on the timeline.
  const isStageKeptOutOfPcActions = (workflowStageName) =>
    /^(recruitment|assignment)\b/i.test(workflowStageName)
  const ongoingSteps = workflowStages
    .filter((p) => !isStageKeptOutOfPcActions(p.workflowStageName))
    .flatMap((p) => p.invitationsOfWorkflowStageName.filter((q) => isOngoingInvitation(q)))
  const pcActionCount = ongoingSteps.length + recruitedGroups.length + 2

  const { token } = theme.useToken()
  const [activeStageKeys, setActiveStageKeys] = useState(null)
  const defaultOpenStageKey = workflowStages.find(
    (p) => getWorkflowStageStatus(p).stageStatus === 'IN PROGRESS'
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
  const toggleWorkflowStage = (workflowStageName) =>
    setActiveStageKeys(
      openStageKeys.includes(workflowStageName)
        ? openStageKeys.filter((p) => p !== workflowStageName)
        : [...openStageKeys, workflowStageName]
    )

  // The overview strip, and the mini strip once the overview has scrolled away.
  const overviewRef = useRef(null)
  const [isMiniStripVisible, setIsMiniStripVisible] = useState(false)
  const scrollToElement = (element, offset) =>
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth',
    })
  // Picking a stage from the timeline shows only that stage, then scrolls to it once the
  // others have collapsed, since closing a stage above shifts the target.
  const selectWorkflowStage = (workflowStageName) => {
    setActiveStageKeys([workflowStageName])
    setTimeout(() => {
      const element = document.getElementById(`stage-${workflowStageName}`)
      if (element) scrollToElement(element, 64)
    }, 0)
  }
  const openRecruitment = (targetGroupId) => {
    setIsOngoingOpen(true)
    setRecruitmentFocus(({ tick }) => ({ groupId: targetGroupId, tick: tick + 1 }))
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
          select: 'id,sdate,edate,invitation,status,log,error',
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
    { inOngoing = false, localDomain = null } = {}
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
    // A step in a stage, or under PC Actions, is a two-column row: the step, then its bar on the
    // stage's own axis. The description stays visible collapsed or not; opening the step adds
    // only its configuration, spanning both columns.
    const isHybridRow = isInWorkflowStage || inOngoing
    const description = stepObj.instructions ?? stepObj.description
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
    const invitationRow = (
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
        showDescription={!isHybridRow}
        descriptionSlot={
          isHybridRow && (
            <div className="invitation-description step-blurb">
              <a
                href="#"
                className="edit-close-button"
                onClick={(e) => {
                  e.preventDefault()
                  handleExpandCollapseSubInvitations(id)
                }}
              >
                {isRowCollapsed ? 'Edit' : 'Close'}
              </a>
              {description && <Markdown text={description} />}
            </div>
          )
        }
      />
    )
    return (
      <motion.div
        layout="position"
        key={id}
        transition={{ duration: 0.5 }}
        ref={(el) => {
          // The copy in PC Actions must not take the ref used to scroll back to a step.
          if (!inOngoing) workflowInvitationsRef.current[id] = el
        }}
        className="motion-div"
      >
        {isHybridRow ? (
          <div
            className={`workflow-invitation-container hybrid-row${isExpired ? ' expired' : ''}`}
          >
            <div className="edit-invitation-info">{invitationRow}</div>
            <WorkflowStepTrack
              invitation={stepObj}
              isStageInvitation={isStageInvitation}
              domain={localDomain}
              processLogs={processLogs}
            />
            {!isRowCollapsed && subInvitations.length > 0 && (
              <div className="edit-invitation-info step-expanded">{subInvitationsBlock}</div>
            )}
          </div>
        ) : (
          <div
            className={`workflow-invitation-container${isExpired ? ' expired' : ''}${sectionClass}`}
          >
            <div className="invitation-cdate">{formattedDate}</div>
            <div className="edit-invitation-info">
              {invitationRow}
              {subInvitationsBlock}
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  useEffect(() => {
    if (!workflowInvitations?.length || !overviewRef.current) return undefined
    const observer = new IntersectionObserver(([entry]) =>
      setIsMiniStripVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    )
    observer.observe(overviewRef.current)
    return () => observer.disconnect()
  }, [workflowInvitations?.length])

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

  const hasTimeline = workflowStages.length > 0 && !!timelineDomain

  return (
    <>
      {hasTimeline && (
        <nav
          className={`mini-strip${isMiniStripVisible ? ' visible' : ''}`}
          aria-label="Stages"
          aria-hidden={!isMiniStripVisible}
        >
          <div className="mini-strip-inner">
            <button
              type="button"
              className="mini-strip-label"
              tabIndex={isMiniStripVisible ? 0 : -1}
              onClick={() => scrollToElement(overviewRef.current, 16)}
            >
              Timeline ↑
            </button>
            <div className="mini-strip-stages">
              {workflowStages.map((workflowStage, index) => {
                const { workflowStageName } = workflowStage
                const status = getWorkflowStageStatus(workflowStage)
                const isOpen = openStageKeys.includes(workflowStageName)
                return (
                  <button
                    type="button"
                    key={workflowStageName}
                    className={`mini-stage${isOpen ? ' current' : ''}`}
                    tabIndex={isMiniStripVisible ? 0 : -1}
                    aria-current={isOpen ? 'true' : undefined}
                    onClick={() => selectWorkflowStage(workflowStageName)}
                    title={`${prettyField(workflowStageName)} — ${stageStatusFilterLabels[status.stageStatus]}`}
                  >
                    <span
                      className={`stage-status-glyph ${status.stageStatusColor}`}
                      aria-hidden="true"
                    >
                      <StageStatusGlyph statusColor={status.stageStatusColor} />
                    </span>
                    <span className="mini-stage-index">{index + 1}</span>
                    <span className="mini-stage-name">{prettyField(workflowStageName)}</span>
                  </button>
                )
              })}
            </div>
            <span className="mini-strip-today">Today · {formatShortDate(Date.now())}</span>
          </div>
          <div className="mini-strip-progress" aria-hidden="true">
            <span style={{ width: `${timelineDomain.percentOf(Date.now())}%` }} />
          </div>
        </nav>
      )}
      <WorkflowTasks
        workflowTasks={workflowTasks}
        setCollapsedWorkflowInvitationIds={setCollapsedWorkflowInvitationIds}
        openWorkflowStage={openWorkflowStage}
      />
      {workflowInvitations ? (
        workflowInvitations.length > 0 && (
          <>
            <EditorSection className="workflow stage-overview-section">
              <div ref={overviewRef}>
                {/* The heading counts the stages listed, so a filter reads as "3 of 7 stages". */}
                <div className="workflow-section-heading">
                  <h4>{`Timeline (${
                    stageStatusFilter === 'all'
                      ? inflect(workflowStages.length, 'stage', 'stages', true)
                      : `${visibleWorkflowStages.length} of ${inflect(workflowStages.length, 'stage', 'stages', true)}`
                  })`}</h4>
                  {workflowStages.length > 0 && (
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
                  )}
                  {stageFilterOptions.length > 2 && (
                    <Segmented
                      className="stage-filter heading-filter"
                      size="small"
                      options={stageFilterOptions}
                      value={stageStatusFilter}
                      onChange={setStageStatusFilter}
                    />
                  )}
                </div>
                {hasTimeline && (
                  <div className="stage-overview">
                    <div className="overview-axis-row">
                      <span className="overview-index" />
                      <span className="overview-name" />
                      <span className="timeline-track with-labels overview-track">
                        <TimelineGrid domain={timelineDomain} showLabels={true} />
                      </span>
                      <span className="overview-period" />
                      <span className="overview-status-spacer" />
                    </div>
                    {visibleWorkflowStages.map((workflowStage) => (
                      <StageOverviewRow
                        key={workflowStage.workflowStageName}
                        workflowStage={workflowStage}
                        stageIndex={workflowStages.indexOf(workflowStage)}
                        status={getWorkflowStageStatus(workflowStage)}
                        domain={timelineDomain}
                        isOpen={openStageKeys.includes(workflowStage.workflowStageName)}
                        onSelect={selectWorkflowStage}
                        processLogs={processLogs}
                      />
                    ))}
                    <div className="overview-legend">
                      <span>
                        <span className="legend-swatch legend-envelope" />
                        stage span
                      </span>
                      <span>
                        <span className="legend-swatch legend-window past" />
                        past
                      </span>
                      <span>
                        <span className="legend-swatch legend-window current" />
                        ongoing
                      </span>
                      <span>
                        <span className="legend-swatch legend-window future" />
                        not started
                      </span>
                      <span>
                        <span className="legend-swatch legend-moment done" />
                        ran
                      </span>
                      <span>
                        <span className="legend-swatch legend-moment running" />
                        running
                      </span>
                      <span>
                        <span className="legend-swatch legend-moment upcoming" />
                        scheduled to run
                      </span>
                      <span>
                        <span className="legend-swatch legend-moment failed" />
                        failed
                      </span>
                      <span>
                        <span className="legend-swatch legend-now" />
                        today, {formatShortDate(Date.now(), true)}
                      </span>
                      <span className="legend-hint">
                        Select a stage — its steps open below on the stage&apos;s own dates
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </EditorSection>

            <EditorSection className="workflow stage-detail-section">
              <div className="invitation-workflow-container">
                {visibleWorkflowStages.map((workflowStage) => {
                  const stageIndex = workflowStages.indexOf(workflowStage)
                  const { workflowStageName, invitationsOfWorkflowStageName } = workflowStage
                  const stageStatus = getWorkflowStageStatus(workflowStage)
                  const isOpen = openStageKeys.includes(workflowStageName)
                  const localDomain = getLocalDomain(workflowStage)
                  return (
                    <div
                      className="stage-detail"
                      id={`stage-${workflowStageName}`}
                      key={workflowStageName}
                    >
                      <div
                        className={`stage-detail-header${isOpen ? ' open' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                        onClick={() => toggleWorkflowStage(workflowStageName)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggleWorkflowStage(workflowStageName)
                          }
                        }}
                      >
                        <CaretRightOutlined
                          rotate={isOpen ? 90 : 0}
                          style={{ color: token.colorLink }}
                        />
                        <div className="stage-detail-header-text">
                          <WorkflowStageHeader
                            workflowStage={workflowStage}
                            stageIndex={stageIndex}
                          />
                        </div>
                        {/* The dates sit beside the status glyph, as in the overview above. */}
                        <span className="stage-period-text">
                          <WorkflowStagePeriod workflowStage={workflowStage} />
                        </span>
                        <StageStatusIcon status={stageStatus} />
                      </div>
                      {isOpen && (
                        <div className="stage-detail-body">
                          {localDomain && (
                            <div className="local-axis-row">
                              <span className="local-axis-caption">
                                Stage Timeline ·{' '}
                                {formatShortDate(
                                  workflowStage.periodStart,
                                  localDomain.crossesYear
                                )}{' '}
                                –{' '}
                                {formatShortDate(
                                  workflowStage.periodEnd,
                                  localDomain.crossesYear
                                )}
                              </span>
                              <span className="timeline-track with-labels local-track local-axis">
                                <LocalGrid domain={localDomain} showLabels={true} />
                              </span>
                            </div>
                          )}
                          {invitationsOfWorkflowStageName.map((stepObj) =>
                            renderWorkflowInvitation(stepObj, true, { localDomain })
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
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
          </>
        )
      ) : (
        <LoadingSpinner />
      )}

      {workflowInvitations && (
        <EditorSection className="workflow">
          <WorkflowSectionHeading
            title={`PC Actions (${inflect(pcActionCount, 'action', 'actions', true)})`}
            isOpen={isOngoingOpen}
            onToggle={() => setIsOngoingOpen((isOpen) => !isOpen)}
            action={
              <Typography.Link onClick={() => setIsOngoingOpen((isOpen) => !isOpen)}>
                {isOngoingOpen ? 'Collapse PC actions' : 'Expand PC actions'}
              </Typography.Link>
            }
            description="Tools the program chairs use whenever they need them: available for as long as the venue runs. These have no end date, so they are not on the timeline."
          />
          {isOngoingOpen && (
            <div className="ongoing-container">
              <VenueActions />
              {recruitedGroups.length > 0 && (
                <div className="ongoing-step rec-action-group">
                  <div className="ongoing-stage">Recruitment</div>
                  {recruitedGroups.map(
                    ({ group: committeeGroup, counts, groupInvitations }) => (
                      <RecruitmentActionRow
                        key={committeeGroup.id}
                        group={committeeGroup}
                        counts={counts}
                        groupInvitations={groupInvitations}
                        reloadGroup={loadAllInvitations}
                        focusTick={
                          recruitmentFocus.groupId === committeeGroup.id
                            ? recruitmentFocus.tick
                            : 0
                        }
                      />
                    )
                  )}
                </div>
              )}
              {ongoingSteps.map((stepObj) => (
                <div key={stepObj.id} className="ongoing-step">
                  <div className="ongoing-stage">
                    {prettyField(stepObj.content.workflow_stage_name.value)}
                  </div>
                  {renderWorkflowInvitation(stepObj, false, { inOngoing: true })}
                </div>
              ))}
            </div>
          )}
        </EditorSection>
      )}

      {workflowGroups.size > 0 && (
        <EditorSection className="workflow rec-section">
          <WorkflowSectionHeading
            title={`Groups (${workflowGroups.size})`}
            description="The groups that take part in the venue, each with its size. Where a group has recruitment invitations, you can see how they stand. Everything else about a group is on its own page."
          />
          <div className="rec-list">
            {committeeGroups.map(({ group: committeeGroup, counts }) => (
              <GroupRow
                key={committeeGroup.id}
                group={committeeGroup}
                counts={counts}
                onOpenRecruitment={openRecruitment}
              />
            ))}
          </div>
        </EditorSection>
      )}
    </>
  )
}

export default WorkFlowInvitations
