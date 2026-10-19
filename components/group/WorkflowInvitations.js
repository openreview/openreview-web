import { CaretRightOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import {
  Button,
  Checkbox,
  Flex,
  Popconfirm,
  Segmented,
  Select,
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
import { Fragment, useEffect, useRef, useState } from 'react'
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
import BasicModal from '../BasicModal'
import Dropdown from '../Dropdown'
import Markdown from '../EditorComponents/Markdown'
import EditorSection from '../EditorSection'
import LoadingSpinner from '../LoadingSpinner'
import GroupRestrictGroup from './GroupRestrictGroup'
import InvitationEditor from './InvitationEditor'
import MessageMemberModal from './MessageMemberModal'
import WorkflowMessageActions from './WorkflowMessageActions'

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
  // A step whose last run failed overrides the date-based status. (Setup still to do is a separate
  // flag, Needs attention, shown beside the stage name.)
  if (
    allInvitationsOfWorkflowStage.some(
      (p) => getLastRun(p.id, processLogs)?.status === 'error'
    )
  ) {
    return { stageStatus: 'FAILED', stageStatusColor: 'error' }
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
const timelineStatusWidth = 18

const stageStatusFilterLabels = {
  FAILED: 'Failed',
  'IN PROGRESS': 'In progress',
  COMPLETED: 'Completed',
  SCHEDULED: 'Scheduled',
}

// The glyph colour class for each status, matching getStageStatus's stageStatusColor.
const stageStatusColors = {
  FAILED: 'error',
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
    >
      {showLabels && <span className="timeline-now-label">Today</span>}
    </div>
  </>
)

// One line of the venue overview: the stage's envelope with each of its steps inside, on the
// venue's own months. Selecting it opens that stage below.
const StageOverviewRow = ({
  workflowStage,
  status,
  domain,
  isOpen,
  onSelect,
  processLogs,
  trackCount = 0,
  trackName = null,
  attention = null,
}) => {
  const { periodStart, periodEnd, invitationsOfWorkflowStageName, workflowStageName } =
    workflowStage
  const timedInvitations = invitationsOfWorkflowStageName.filter(
    (p) => !isOngoingInvitation(p)
  )
  const hasSpan = timedInvitations.length > 0 && periodStart
  // Disabled steps stay in their stage; the stage says how many, or that all of it is off.
  const disabledCount = invitationsOfWorkflowStageName.filter((p) => p.ddate).length
  const isStageDisabled =
    disabledCount > 0 && disabledCount === invitationsOfWorkflowStageName.length
  const startPercent = hasSpan ? domain.percentOf(periodStart) : 0
  const endPercent = hasSpan ? domain.percentOf(periodEnd ?? periodStart) : 0
  // "bidding - Senior_Area_Chairs": the stage in bold, the committee it is for after it.
  const [stageName, committeeName] = workflowStageName.split(' - ')
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
      className={`overview-row${isOpen ? ' current' : ''}${isStageDisabled ? ' disabled' : ''}`}
      aria-expanded={isOpen}
      onClick={() => onSelect(workflowStageName)}
      title={`${prettyField(workflowStageName)} — ${stageStatusFilterLabels[status.stageStatus]}`}
    >
      <span className="overview-caret" aria-hidden="true">
        <CaretRightOutlined rotate={isOpen ? 90 : 0} />
      </span>
      <span className="overview-name">
        {/* Inside a family the stage and committee are its row's; a track row needs only its track. */}
        <span className="overview-name-text">
          {trackName ?? (
            <>
              <strong>{prettyField(stageName)}</strong>
              {committeeName && ` - ${prettyField(committeeName)}`}
            </>
          )}
        </span>
        {trackCount > 0 && <span className="overview-tracks">{trackCount} tracks</span>}
        {disabledCount > 0 && (
          <span className="step-disabled-tag">
            {isStageDisabled ? 'Disabled' : `${disabledCount} disabled`}
          </span>
        )}
        {attention && (
          <span className="stage-attention" title={attention} aria-label={attention}>
            <ExclamationCircleFilled />
          </span>
        )}
      </span>
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
          <span className="track-ongoing">Ongoing</span>
        )}
      </span>
      <span className="overview-period">
        <WorkflowStagePeriod workflowStage={workflowStage} />
      </span>
      <StageStatusIcon status={status} />
    </button>
  )
}

// A step's title keeps the original naming rule: steps that edit invitations were never "Create …".
const getStepTitle = (invitation) =>
  `${invitation.duedate || invitation.edit?.invitation ? '' : 'Create '}${prettyId(
    invitation.id.replace(invitation.domain, '')
  )}`

// The API rejects an invitation whose activation date is after its due date or expiration date.
const invitationDateLabels = {
  cdate: 'Activation Date',
  duedate: 'Due Date',
  expdate: 'Expiration Date',
}
const invitationDateOrder = [
  ['cdate', 'duedate'],
  ['cdate', 'expdate'],
]

// Which form field sets each of a step's dates, per invitation the settings write to: the step
// itself (path '') and the per-paper invitations it creates ('edit.invitation').
const getDateFieldLevels = (editInvitation, path = '') => {
  if (!editInvitation || typeof editInvitation !== 'object') return []
  const fields = {}
  Object.keys(invitationDateLabels).forEach((dateKey) => {
    const match =
      typeof editInvitation[dateKey] === 'string' &&
      editInvitation[dateKey].match(/\/content\/([^/]+)\/value/)
    if (match) fields[dateKey] = match[1]
  })
  const nested = getDateFieldLevels(
    editInvitation.edit?.invitation,
    path ? `${path}.edit.invitation` : 'edit.invitation'
  )
  return Object.keys(fields).length ? [{ path, fields }, ...nested] : nested
}

// A date as it would be after saving: from the form when the form sets it, otherwise as saved
const getProposedDate = (level, dateKey, data, workflowInvitation) => {
  const value = level.fields[dateKey]
    ? data?.[level.fields[dateKey]]
    : get(workflowInvitation, level.path ? `${level.path}.${dateKey}` : dateKey)
  return typeof value === 'number' ? value : null
}

const formatErrorDate = (value) =>
  formatDateTime(value, { month: 'short', second: undefined, timeZoneName: 'short' })

// The date a message compares against, named the way the PC sees it
const describeDate = (level, dateKey, value) => {
  const label = level.fields[dateKey]
    ? prettyField(level.fields[dateKey])
    : `the step's ${invitationDateLabels[dateKey]}`
  return value === null ? label : `${label} (${formatErrorDate(value)})`
}

// Checks a Dates form before it is saved, so out-of-order dates are caught at the field instead of
// coming back from the API.
const getDateOrderErrors = (data, subInvitation, workflowInvitation) => {
  const messagesByField = {}
  const addMessage = (fieldName, message) => {
    messagesByField[fieldName] = messagesByField[fieldName] ?? []
    if (!messagesByField[fieldName].includes(message)) messagesByField[fieldName].push(message)
  }
  getDateFieldLevels(subInvitation.edit?.invitation).forEach((level) => {
    invitationDateOrder.forEach(([earlierKey, laterKey]) => {
      const earlier = getProposedDate(level, earlierKey, data, workflowInvitation)
      const later = getProposedDate(level, laterKey, data, workflowInvitation)
      if (earlier === null || later === null || earlier <= later) return
      if (level.fields[earlierKey]) {
        addMessage(
          level.fields[earlierKey],
          `Must be on or before ${describeDate(level, laterKey, later)}.`
        )
      }
      if (level.fields[laterKey]) {
        addMessage(
          level.fields[laterKey],
          `Must be on or after ${describeDate(level, earlierKey, earlier)}.`
        )
      }
    })
  })
  return Object.entries(messagesByField).map(([fieldName, messages]) => ({
    fieldName,
    message: messages.join(' '),
  }))
}

// Rewrites the API's date error ("cdate must be less than or equal to duedate") to name the step,
// the dates and their values. Returns null for any other error.
const getDateSaveError = (
  error,
  data,
  subInvitation,
  workflowInvitation,
  workflowInvitations
) => {
  const match =
    error?.name === 'InferenceError' &&
    error.message?.match(
      /\b(cdate|duedate|expdate) must be less than or equal to (cdate|duedate|expdate)\b/
    )
  if (!match) return null
  const [, earlierKey, laterKey] = match
  const invitationId = error.details?.id
  const levels = getDateFieldLevels(subInvitation.edit?.invitation)
  const stepName = getStepTitle(workflowInvitation)
  let level = null
  let invitationName = stepName
  let isOtherStep = false
  if (!invitationId || invitationId === workflowInvitation.id) {
    level = levels.find((p) => p.path === '') ?? null
  } else if (invitationId.endsWith(`/-/${workflowInvitation.id.split('/-/').pop()}`)) {
    // one of the per-paper invitations this step creates, e.g. Submission5/-/Decision
    level = levels.find((p) => p.path === 'edit.invitation') ?? null
    invitationName = `${stepName} for ${prettyId(
      invitationId.split('/-/')[0].replace(`${workflowInvitation.domain}/`, '')
    )}`
  } else {
    const otherStep = workflowInvitations?.find((p) => p.id === invitationId)
    invitationName = otherStep ? getStepTitle(otherStep) : prettyId(invitationId)
    isOtherStep = true
  }
  const describe = (dateKey) => {
    if (!level) return invitationDateLabels[dateKey]
    const value = getProposedDate(level, dateKey, data, workflowInvitation)
    const label = level.fields[dateKey]
      ? prettyField(level.fields[dateKey])
      : invitationDateLabels[dateKey]
    return value === null ? label : `${label} (${formatErrorDate(value)})`
  }
  const message = `${invitationName}: ${describe(earlierKey)} must be on or before ${describe(laterKey)}.${
    isOtherStep
      ? ` Update the dates of ${invitationName} first, or choose a different date.`
      : ''
  }`
  const fieldNames = level
    ? [level.fields[earlierKey], level.fields[laterKey]].filter(Boolean)
    : []
  return { message, fieldNames }
}

// A step's dates as the timeline labels them: its window, or the single date it fires on. A window
// that crosses a year puts it on its end date, so it never reads backwards.
const getStepDateLabel = (invitation) => {
  if (isOngoingInvitation(invitation)) return `From ${formatShortDate(invitation.cdate)}`
  const end = isWindowInvitation(invitation)
    ? (invitation.duedate ?? invitation.edit?.invitation?.duedate ?? getWindowEnd(invitation))
    : null
  if (!end) return formatShortDate(invitation.cdate)
  const crossesYear = dayjs(end).year() !== dayjs(invitation.cdate).year()
  return `${formatShortDate(invitation.cdate)} – ${formatShortDate(end, crossesYear)}`
}

// One step of an open stage, on the same venue axis as its stage, so the timeline reads as one list.
// Its dates sit in the date column, where they stay readable however short its bar is. Selecting it
// opens the step's description, status and settings beneath it.
const StepTimelineRow = ({
  invitation,
  domain,
  processLogs,
  isOpen,
  isFailed,
  setupDueDate,
  missingSettingCount = 0,
  isDisabled = false,
  onToggle,
}) => {
  const windowEnd = getWindowEnd(invitation)
  const isOngoing = isOngoingInvitation(invitation)
  const left = domain.percentOf(invitation.cdate)
  const width = domain.percentOf(windowEnd ?? invitation.cdate) - left
  const isMoment = width < momentThresholdPercent
  const isOpenEnded = !!windowEnd && windowEnd > domain.end
  const timing = getSpanTiming(invitation.cdate, windowEnd, domain.end)
  // Hovering the step's bar or dates highlights the date settings they come from, when open.
  const markDateSettings = (e, isOn) =>
    e.currentTarget
      .closest('.timeline-step')
      ?.querySelectorAll('.timeline-step-detail li[data-field$="_date"]')
      .forEach((p) => p.classList.toggle('highlight', isOn))
  const dateHoverProps = {
    onMouseEnter: (e) => markDateSettings(e, true),
    onMouseLeave: (e) => markDateSettings(e, false),
  }
  return (
    <button
      type="button"
      className={`overview-row step-row${isOpen ? ' current' : ''}`}
      aria-expanded={isOpen}
      onClick={onToggle}
      title={`${getStepTitle(invitation)} — ${getStepDateLabel(invitation)}`}
    >
      <span className="overview-caret" />
      <span className="overview-name step-name">
        <CaretRightOutlined rotate={isOpen ? 90 : 0} className="step-caret" />
        {getStepTitle(invitation)}
        {/* Settings still to finish are flagged on the closed step, not only inside it. */}
        {setupDueDate && (
          <span className="step-setup-due">Configure by {formatShortDate(setupDueDate)}</span>
        )}
        {isDisabled && <span className="step-disabled-tag">Disabled</span>}
        {missingSettingCount > 0 && !setupDueDate && !isDisabled && (
          <span
            className="step-setup-missing"
            title={`${inflect(missingSettingCount, 'required setting is', 'required settings are', true)} empty`}
          >
            Needs setup
          </span>
        )}
      </span>
      <span className="timeline-track overview-track" {...dateHoverProps}>
        <TimelineGrid domain={domain} />
        {isOngoing && <span className="track-ongoing">Ongoing</span>}
        {!isOngoing && isMoment && (
          <span
            className={`stage-moment ${getMomentState(invitation, processLogs)}`}
            style={{ left: `${left}%` }}
          />
        )}
        {!isOngoing && !isMoment && (
          <span
            className={`stage-window ${timing.timing}${isOpenEnded ? ' open-end' : ''}`}
            style={{ left: `${left}%`, width: `${width}%`, ...timing.style }}
          />
        )}
        {!isOngoing && !isMoment && isOpenEnded && (
          <span
            className={`track-continues ${timing.timing}`}
            title="Continues past the end of the timeline"
          />
        )}
      </span>
      <span className="overview-period" {...dateHoverProps}>
        {getStepDateLabel(invitation)}
      </span>
      {isFailed ? (
        <span className="stage-status-icon error" role="img" aria-label="Last run failed">
          <StageStatusGlyph statusColor="error" />
        </span>
      ) : (
        <span className="overview-status-spacer" />
      )}
    </button>
  )
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
        <span className="track-ongoing">Ongoing</span>
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
  <svg width="17" height="17" viewBox="0 0 14 14" aria-hidden="true">
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
        <path
          d="M4.8 4.8 9.2 9.2M9.2 4.8 4.8 9.2"
          stroke="#fffdfa"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
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

// A failed run's error is a Python traceback, often after progress-bar output from tqdm. Its last
// line says what went wrong ("KeyError: 'submision_number'"), so that leads and the rest is detail.
const isProgressLine = (line) => /\d+%\|/.test(line) || /it\/s\]/.test(line)
const summarizeProcessError = (error) => {
  if (!error) return { summary: null, details: null }
  const text = error.message || error.name || ''
  const lines = text
    .split(/\r|\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !isProgressLine(line))
  const tracebackStart = lines.findIndex((line) => line.startsWith('Traceback'))
  const detailLines = tracebackStart >= 0 ? lines.slice(tracebackStart) : lines
  const summary = lines.findLast((line) => !/^\s/.test(line)) ?? lines[lines.length - 1]
  return {
    summary: summary?.trim() || error.name || 'The process failed',
    details: detailLines.length > 1 ? detailLines.join('\n') : null,
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
    error: summarizeProcessError(log.error).summary,
    errorDetails: summarizeProcessError(log.error).details,
    logUrl: `${process.env.API_V2_URL}/logs/process?id=${log.id}`,
  }
}

// "When the next thing happens", phrased for the kind of step it is.
// Every step reads "State · date", in the form that fits the kind of step it is.
const getSchedulePhrase = (invitation, isStageInvitation, lastRun, hasDateProcess) => {
  const now = Date.now()
  const expdate = getInvitationExpDate(invitation)

  // A window people act inside: scheduled, open, then closed.
  if (isStageInvitation && expdate) {
    if (invitation.cdate > now) return `Scheduled · opens ${formatShortDate(invitation.cdate)}`
    return expdate > now
      ? `Open · closes ${formatShortDate(expdate)}`
      : `Closed · ${formatShortDate(expdate)}`
  }
  // A step with no date process is a tool people use — sending recruitment requests, drafting
  // assignments. Nothing fires on its activation date, so there is no run to report or miss.
  if (!hasDateProcess) {
    return invitation.cdate > now
      ? `Scheduled · available ${formatShortDate(invitation.cdate)}`
      : `Available · since ${formatShortDate(invitation.cdate)}`
  }
  // An automatic step has run only if a completed process log says so — a past activation date
  // is not proof, the process may never have fired.
  if (invitation.cdate > now) return `Scheduled · runs ${formatShortDate(invitation.cdate)}`
  if (lastRun?.status === 'error') {
    return `Failed · ${formatShortDate(lastRun.edate ?? invitation.cdate)}`
  }
  return lastRun
    ? `Ran · ${formatShortDate(lastRun.edate ?? invitation.cdate)}`
    : `Not run · was due ${formatShortDate(invitation.cdate)}`
}

// A successful run's log line, trimmed: the step's own name and "successfully" add nothing beside
// the step title, so "10 Official Review invitations created or updated successfully" becomes
// "10 invitations updated".
const shortenSuccessMessage = (message) => {
  if (!message) return message
  const invitationCount = message.match(
    /^(\d+) .+ invitations created or updated successfully\.?$/i
  )
  if (invitationCount) {
    return `${inflect(Number(invitationCount[1]), 'invitation', 'invitations', true)} updated`
  }
  return message
    .replace(/\s+were successfully\b/i, '')
    .replace(/\s+successfully\b/i, '')
    .replace(/\.$/, '')
}

// A failed run's error: its last line, with the full traceback a click away
const ProcessErrorBox = ({ summary, details }) => {
  const [showDetails, setShowDetails] = useState(false)
  return (
    <span className="step-status-error" title={summary}>
      <span className="step-status-error-text">{summary}</span>
      {details && (
        <a
          href="#"
          className="step-status-error-toggle"
          onClick={(e) => {
            e.preventDefault()
            setShowDetails((isShown) => !isShown)
          }}
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </a>
      )}
      {showDetails && details && <pre className="step-status-error-details">{details}</pre>}
    </span>
  )
}

// The setting a failed run's error points at, when the error names one of its values: a KeyError
// for a template placeholder ("KeyError: 'submision_number'") belongs to the setting whose text
// has "{submision_number}".
const getErrorSetting = (errorSummary, workflowInvitation, subInvitations) => {
  const token = errorSummary?.match(/^KeyError: '([^']+)'/)?.[1]
  if (!token) return null
  let match = null
  subInvitations.some((subInvitation) => {
    const fieldName = Object.keys(subInvitation.edit?.content ?? {}).find((key) => {
      const path = getPath(subInvitation.edit.invitation, key)
      const value = path ? get(workflowInvitation, path) : null
      return typeof value === 'string' && value.includes(`{${token}}`)
    })
    if (fieldName) match = { subInvitationId: subInvitation.id, fieldName, token }
    return !!fieldName
  })
  return match
}

// One sentence per step: the schedule, then whatever the process function logged. Red is
// reserved for an errored log — a missing configuration surfaces as a failed process function.
const WorkflowStepStatus = ({
  invitation,
  isStageInvitation,
  hasDateProcess,
  processLogs,
  onRunNow,
  errorSettingName = null,
}) => {
  const log = getProcessLogStatus(processLogs)
  const isError = log?.status === 'error'
  // Logs arrive newest first, so the first completed one is the latest run. Queued or running
  // logs are not runs.
  const lastRun = processLogs.find((p) => p.status === 'ok' || p.status === 'error')
  const phrase = getSchedulePhrase(invitation, isStageInvitation, lastRun, hasDateProcess)
  let message = log?.message
  if (log?.status === 'running') message = 'Running…'
  else if (log?.status === 'ok') message = shortenSuccessMessage(log.message)
  // A failed run's error gets a line of its own under the schedule, so it shows on the collapsed
  // step without opening it.
  const errorText = isError ? (log.error ?? log.message) : null
  const statusText = `${phrase}${message && !errorText ? ` — ${message}` : ''}`
  // Running is a real action — it moves the step's activation date to now — so it is one link,
  // behind a confirmation. It is "Run now" whether or not the step has run before: a scheduled
  // date in the future made "Run again" read backwards.
  const runLabel = !onRunNow || log?.status === 'running' ? null : 'Run now'

  return (
    <div className={`step-status${isError ? ' error' : ''}`}>
      <span className="step-status-text" title={statusText}>
        {/* A failed run leads with "Failed" in red; the rest of the line stays as it was */}
        {isError && statusText.startsWith('Failed') ? (
          <>
            <strong className="step-status-failed">Failed</strong>
            {statusText.slice('Failed'.length)}
          </>
        ) : (
          statusText
        )}
      </span>
      {/* An error that names a setting is shown under that setting instead */}
      {errorText && !errorSettingName && (
        <ProcessErrorBox summary={errorText} details={log.errorDetails} />
      )}
      {runLabel && (
        <Popconfirm
          title={`${runLabel}?`}
          description="This sets the step's activation date to now, so its process runs immediately with the current configuration."
          okText={runLabel}
          cancelText="Cancel"
          onConfirm={onRunNow}
        >
          {/* After a failure, running again is the next thing to do, so it is a button */}
          {isError ? (
            <button type="button" className="btn btn-xs step-status-run">
              {runLabel}
            </button>
          ) : (
            <a>{runLabel}</a>
          )}
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
  errorSettingName = null,
  showDescription = true,
  descriptionSlot = null,
  hideTitle = false,
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
            {/* In the timeline the step's own row is its title and caret. */}
            {!hideTitle && (
              <>
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
                  {getStepTitle(invitation)}
                </span>
              </>
            )}
            {/* <a className="id-icon" href={`/invitation/edit?id=${invitation.id}`}>
              <Icon name="new-window" />
            </a> */}
            {invitation.edit?.content && isDomainGroup && !showEditor && (
              <button className="btn btn-xs ml-2" onClick={() => setShowEditor(true)}>
                Add
              </button>
            )}
            {/* TODO: won't know inner invitation is per submission or per what */}
            {!hideTitle && (
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
            )}
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
            errorSettingName={errorSettingName}
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
          {earliestDueDate && !hideTitle && (
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
  workflowInvitations,
  processError = null,
}) => {
  const [showInvitationEditor, setShowInvitationEditor] = useState(false)
  const runConfirmResolveRef = useRef(null)
  const runConfirmModalId = `run-confirm-${subInvitation.id.replace(/[^\w-]/g, '_')}`
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
  // In the timeline, a date setting and its step's date column point at each other on hover.
  const markStepDates = (fieldName, e, isOn) => {
    if (!fieldName.endsWith('_date')) return
    e.target
      .closest('.timeline-step')
      ?.querySelector('.step-row .overview-period')
      ?.classList.toggle('highlight', isOn)
  }
  const handleHover = (fieldName, e) => {
    markStepDates(fieldName, e, true)
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
    markStepDates(fieldName, e, false)
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

  // An automatic step runs when its activation date arrives, so saving a date that is now or past
  // runs it straight away, with whatever settings it has. Ask first.
  const confirmRunOnSave = (data) => {
    const activationDate = data?.activation_date
    if (
      !workflowInvitation.dateprocesses?.length ||
      typeof activationDate !== 'number' ||
      activationDate > Date.now()
    ) {
      return Promise.resolve(true)
    }
    return new Promise((resolve) => {
      runConfirmResolveRef.current = resolve
      $(`#${runConfirmModalId}`).modal('show')
    })
  }

  const missingRequiredFields = getMissingRequiredFields(
    subInvitation,
    workflowInvitation,
    domainObject
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
              <span className="sub-invitation-name">{invitationName}</span>
              {subInvitation.duedate && !isTaskCompleted && (
                <span
                  className="sub-invitation-due-date"
                  title={formatDateTime(subInvitation.duedate, {
                    month: 'long',
                    timeZoneName: 'short',
                  })}
                >
                  Configure by {formatShortDate(subInvitation.duedate)}
                </span>
              )}
            </div>
            <div className="sub-invitation-description">
              <Markdown text={subInvitation.description} />
            </div>

            {!isGroupInvitation && (
              <ul>
                {Object.keys(subInvitationContentFieldValues ?? {}).map((key) => (
                  <li key={key} data-field={key}>
                    <span
                      className="existing-value-field"
                      onMouseEnter={(e) => handleHover(key, e)}
                      onMouseLeave={(e) => handleHoverEnd(key, e)}
                    >
                      {prettyField(key)}:{' '}
                    </span>
                    <span className="existing-value-field-value">
                      {subInvitationContentFieldValues[key]}
                      {!isTask && missingRequiredFields.includes(key) && (
                        <span className="setting-required">Required · not set</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {processError && (
              <div className="setting-error step-status error">
                <ProcessErrorBox
                  summary={processError.summary}
                  details={processError.details}
                />
              </div>
            )}
          </div>
          <div>
            {showInvitationEditor && (
              <InvitationEditor
                className="workflow-editor"
                invitation={subInvitation}
                existingValue={existingValue}
                closeInvitationEditor={() => setShowInvitationEditor(false)}
                confirmBeforeSubmit={confirmRunOnSave}
                validate={(data) =>
                  getDateOrderErrors(data, subInvitation, workflowInvitation)
                }
                formatSubmitError={(error, data) =>
                  getDateSaveError(
                    error,
                    data,
                    subInvitation,
                    workflowInvitation,
                    workflowInvitations
                  )
                }
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
            {showInvitationEditor && (
              <BasicModal
                id={runConfirmModalId}
                title={`Saving will run ${getStepTitle(workflowInvitation)} now`}
                primaryButtonText="Save and Run"
                onPrimaryButtonClick={() => {
                  runConfirmResolveRef.current?.(true)
                  runConfirmResolveRef.current = null
                  $(`#${runConfirmModalId}`).modal('hide')
                }}
                onClose={() => {
                  runConfirmResolveRef.current?.(false)
                  runConfirmResolveRef.current = null
                }}
              >
                <p>
                  {workflowInvitation.cdate <= Date.now()
                    ? 'Its activation date is in the past, so saving can run it again right away, with its current settings.'
                    : 'The activation date is now or in the past, so the step runs as soon as you save, with its current settings.'}
                </p>
                <p>If you are still changing its other settings, save those first.</p>
              </BasicModal>
            )}
          </div>
        </li>
      </ul>
    </div>
  )
}

// Timeline, Ongoing and Groups open the same way: the title, an optional action beside it, and a
// line on what the section holds.
// A section that opens and closes (Ongoing Actions) gets a caret before its title; both toggle it.
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
// invitations stand; inviting and reminding are ongoing actions, so the row links there.
const GroupRow = ({ group, counts, onOpenRecruitment, onMessage, label = null }) => {
  const [showPeople, setShowPeople] = useState(false)
  const memberCount = group.members?.length ?? 0
  return (
    <article className="rec-card">
      <div className="rec-head">
        <h5 className="rec-title">
          <a href={groupUrl(group.id, group.domain, { edit: true })}>
            {label ?? prettyId(group.id, true)}
          </a>
        </h5>
        <span className="rec-members">{inflect(memberCount, 'member', 'members', true)}</span>
        {onMessage && memberCount > 0 && (
          <button
            type="button"
            className="btn btn-xs rec-message"
            onClick={() => onMessage(group)}
          >
            Message
          </button>
        )}
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
              Invite or remind in Ongoing Actions
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

// Ongoing Actions: one row per recruited role. Invite and Remind open the role's own recruitment
// invitations in the shared editor.
const RecruitmentActionRow = ({
  group,
  groupInvitations,
  counts,
  reloadGroup,
  focusTick,
  label = null,
}) => {
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
        <span className="rec-action-name">{label ?? `Recruit ${roleName}`}</span>
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
            // A disabled button shows no tooltip of its own, so its wrapper says why.
            return (
              <Tooltip
                key={groupInvitation.id}
                title={isDisabled ? 'Nobody is waiting on a reply.' : null}
              >
                <span className={isReminder ? 'rec-action-secondary' : 'rec-action-primary'}>
                  <Button
                    size="small"
                    type={isActive || isReminder ? 'default' : 'primary'}
                    disabled={isDisabled}
                    title={isDisabled ? undefined : prettyInvitationId(groupInvitation.id)}
                    onClick={() => setActiveGroupInvitation(isActive ? null : groupInvitation)}
                  >
                    {isActive ? 'Close' : getActionLabel(groupInvitation.id)}
                  </Button>
                </span>
              </Tooltip>
            )
          })}
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

// Ongoing Actions: one row per committee with assignments. Drafting happens on the assignments page;
// the deployment step then puts a chosen assignment in place on its activation date, so the row
// says where that stands.
const getDeploymentState = (deploymentInvitation, processLogs) => {
  if (!deploymentInvitation) return null
  const lastRun = getLastRun(deploymentInvitation.id, processLogs)
  if (lastRun?.status === 'error') return 'Deployment failed'
  if (lastRun)
    return `Deployed ${formatShortDate(lastRun.edate ?? deploymentInvitation.cdate)}`
  if (deploymentInvitation.cdate > Date.now()) {
    return `Deployment scheduled for ${formatShortDate(deploymentInvitation.cdate)}`
  }
  return 'Not deployed yet'
}

const AssignmentActionRow = ({
  role,
  venueId,
  deploymentState,
  stageName,
  onViewStage,
  label = null,
}) => (
  <div className="rec-action-row">
    <div className="rec-action-head">
      <span className="rec-action-name">{label ?? `Assign ${prettyField(role)}`}</span>
      {deploymentState && <span className="rec-action-state">{deploymentState}</span>}
      <div className="rec-actions inline">
        <span className="rec-action-primary">
          <Button size="small" type="primary" href={`/assignments?group=${venueId}/${role}`}>
            Create draft assignments
          </Button>
        </span>
        {stageName && (
          <span className="rec-action-secondary">
            <Button size="small" onClick={() => onViewStage(stageName)}>
              View stage
            </Button>
          </span>
        )}
      </div>
    </div>
  </div>
)

// Venue information and emergency shutdown are done right here: the venue's information opens its
// edit form in place, and the shutdown opens the same typed confirmation as its tab.
const VenueActions = ({ group }) => {
  const [openPanel, setOpenPanel] = useState(null)
  const [venueInformationInvitation, setVenueInformationInvitation] = useState(null)
  const togglePanel = (panel) => setOpenPanel((p) => (p === panel ? null : panel))

  // The invitation that edits the venue group's own content (title, website, dates, contact).
  const loadVenueInformationInvitation = async () => {
    try {
      const result = await api.get('/invitations', {
        'edit.group.id': group.id,
        details: 'writable',
      })
      setVenueInformationInvitation(
        (result.invitations ?? []).find(
          (p) => p.details?.writable && p.edit?.group?.content && p.edit?.content
        ) ?? null
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <div className="ongoing-step rec-action-group">
      <div className="ongoing-stage">Venue</div>
      <div className="rec-action-row">
        <div className="rec-action-head">
          <span className="rec-action-name">Venue information</span>
          <span className="rec-action-state">
            Title, dates, location, contact and the venue&apos;s settings
          </span>
          <div className="rec-actions inline">
            <span className="rec-action-primary">
              <Button
                size="small"
                type={openPanel === 'information' ? 'default' : undefined}
                onClick={() => {
                  if (!venueInformationInvitation) loadVenueInformationInvitation()
                  togglePanel('information')
                }}
              >
                {openPanel === 'information' ? 'Close' : 'Edit venue information'}
              </Button>
            </span>
          </div>
        </div>
        {openPanel === 'information' && (
          <div className="rec-panel venue-panel">
            {venueInformationInvitation ? (
              <>
                {venueInformationInvitation.description && (
                  <div className="group-description">
                    <Markdown text={venueInformationInvitation.description} />
                  </div>
                )}
                <InvitationEditor
                  className="workflow-editor"
                  invitation={venueInformationInvitation}
                  existingValue={Object.fromEntries(
                    Object.keys(venueInformationInvitation.edit.content).map((key) => [
                      key,
                      group.content?.[key]?.value,
                    ])
                  )}
                  closeInvitationEditor={() => setOpenPanel(null)}
                  onInvitationEditPosted={() => {
                    promptMessage('Venue information is updated')
                    setOpenPanel(null)
                  }}
                  isGroupInvitation={true}
                  group={group}
                />
              </>
            ) : (
              <LoadingSpinner inline text={null} />
            )}
          </div>
        )}
      </div>
      <div className="rec-action-row">
        <div className="rec-action-head">
          <span className="rec-action-name">Emergency shutdown</span>
          <span className="rec-action-state">
            Suspends all access for everyone except the organizers
          </span>
          <div className="rec-actions inline">
            <span className="rec-action-primary">
              <Button
                size="small"
                danger={openPanel !== 'shutdown'}
                onClick={() => togglePanel('shutdown')}
              >
                {openPanel === 'shutdown' ? 'Close' : 'Emergency shutdown…'}
              </Button>
            </span>
          </div>
        </div>
        {openPanel === 'shutdown' && (
          <div className="rec-panel venue-panel shutdown-panel">
            <GroupRestrictGroup group={group} title={null} />
          </div>
        )}
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

// The venue's committees, most senior first, from the role lists on its group.
const committeeRoleFields = [
  'senior_area_chair_roles',
  'area_chair_roles',
  'reviewer_roles',
  'ethics_reviewer_roles',
]
// A stage repeated for each track of a committee ("bidding - Econ_Senior_Area_Chairs") belongs to
// a family, keyed by the stage and the committee's role field. The role field's first entry is the
// committee itself; the others are its tracks.
const getCommitteeFamily = (role, group) => {
  const field = committeeRoleFields.find((p) => group.content?.[p]?.value?.includes(role))
  const roles = field ? group.content[field].value : []
  if (roles.length < 2) return null
  const baseRole = roles[0]
  return {
    key: field,
    baseRole,
    track: role === baseRole ? 'Main' : prettyField(role.replace(`_${baseRole}`, '')),
  }
}

const getStageFamily = (workflowStageName, group) => {
  const [stageName, committee] = workflowStageName.split(' - ')
  if (!committee) return null
  const family = getCommitteeFamily(committee, group)
  if (!family) return null
  return {
    key: `${stageName} - ${family.key}`,
    label: `${stageName} - ${family.baseRole}`,
    track: family.track,
  }
}

// Items of the same committee family, in their original order; a family of one stays on its own.
const groupByCommitteeFamily = (items, getRole, group) => {
  const groups = []
  const indexByKey = {}
  items.forEach((item) => {
    const family = getCommitteeFamily(getRole(item), group)
    if (!family) {
      groups.push({ family: null, items: [item] })
      return
    }
    if (indexByKey[family.key] === undefined) {
      indexByKey[family.key] = groups.length
      groups.push({ family, items: [] })
    }
    groups[indexByKey[family.key]].items.push(item)
  })
  return groups.flatMap((p) =>
    p.family && p.items.length < 2 ? p.items.map((q) => ({ family: null, items: [q] })) : [p]
  )
}

// A committee's tracks under one heading in Ongoing Actions and Groups, as on the timeline.
// `openSignal` opens it from outside, e.g. when a group's card asks to show its recruitment.
const TrackFamily = ({
  title,
  trackCount,
  summary,
  openSignal = 0,
  actions = null,
  panel = null,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    if (openSignal) setIsOpen(true)
  }, [openSignal])
  return (
    <div className={`track-family${isOpen ? ' open' : ''}`}>
      <div className="track-family-head">
        <button
          type="button"
          className="track-family-toggle"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((p) => !p)}
        >
          <CaretRightOutlined rotate={isOpen ? 90 : 0} className="track-family-caret" />
          <span className="track-family-title">{title}</span>
          <span className="overview-tracks">{trackCount} tracks</span>
          {summary && <span className="track-family-summary">{summary}</span>}
        </button>
        {actions}
      </div>
      {panel}
      {isOpen && <div className="track-family-body">{children}</div>}
    </div>
  )
}

// Recruitment for a committee with tracks, acted on from its heading: one invite box with a track
// picker, and a reminder to everyone still holding an invitation, track by track. Each track's
// reminder is sent with its own default wording, so every email names the right track.
const RecruitmentFamily = ({
  family,
  items,
  getTrack,
  summary,
  openSignal,
  reloadGroup,
  children,
}) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteGroupId, setInviteGroupId] = useState(items[0]?.group.id)
  const [remindProgress, setRemindProgress] = useState(null)
  const getReminder = (item) => item.groupInvitations.find((p) => isReminderInvitation(p.id))
  const remindItems = items.filter((p) => p.counts?.awaiting > 0 && getReminder(p))
  const remindCount = remindItems.reduce((sum, p) => sum + p.counts.awaiting, 0)
  const inviteItem = items.find((p) => p.group.id === inviteGroupId)
  const inviteInvitation = inviteItem?.groupInvitations.find(
    (p) => !isReminderInvitation(p.id)
  )

  const remindAll = async () => {
    const failed = []
    setRemindProgress({ done: 0, total: remindItems.length, failed })
    for (let i = 0; i < remindItems.length; i += 1) {
      const reminder = getReminder(remindItems[i])
      const content = Object.fromEntries(
        Object.entries(reminder.edit?.content ?? {})
          .map(([key, field]) => [key, { value: field?.value?.param?.default }])
          .filter(([, field]) => field.value !== undefined)
      )
      try {
        // eslint-disable-next-line no-await-in-loop
        await api.post('/groups/edits', {
          invitation: reminder.id,
          ...(Array.isArray(reminder.edit?.signatures)
            ? { signatures: reminder.edit.signatures }
            : {}),
          content,
        })
      } catch {
        failed.push(getTrack(remindItems[i]))
      }
      setRemindProgress({ done: i + 1, total: remindItems.length, failed: [...failed] })
    }
    reloadGroup()
  }

  const actions = (
    <div className="rec-actions inline">
      <span className="rec-action-primary">
        <Button
          size="small"
          type={isInviteOpen ? 'default' : 'primary'}
          onClick={() => setIsInviteOpen((p) => !p)}
        >
          {isInviteOpen ? 'Close' : 'Invite…'}
        </Button>
      </span>
      <span className="rec-action-secondary">
        <Tooltip title={remindCount ? null : 'Nobody is waiting on a reply.'}>
          <span>
            <Popconfirm
              title={`Remind ${formatCount(remindCount)}?`}
              description={`Sends each of ${inflect(remindItems.length, 'track', 'tracks', true)} its reminder email, to the people who haven't replied.`}
              okText="Send reminders"
              cancelText="Cancel"
              onConfirm={remindAll}
              disabled={!remindCount}
            >
              <Button
                size="small"
                disabled={!remindCount || remindProgress?.done < remindProgress?.total}
              >
                {remindCount ? `Remind all ${formatCount(remindCount)}` : 'Remind all'}
              </Button>
            </Popconfirm>
          </span>
        </Tooltip>
      </span>
    </div>
  )

  const panel = (
    <>
      {remindProgress && (
        <p className="rec-status family-status" role="status" aria-live="polite">
          {remindProgress.done < remindProgress.total
            ? `Sending reminders… ${remindProgress.done} of ${remindProgress.total} tracks`
            : `Reminders sent to ${remindProgress.total - remindProgress.failed.length} of ${inflect(remindProgress.total, 'track', 'tracks', true)}.`}
          {remindProgress.failed.length > 0 && (
            <span className="rec-error"> Failed: {remindProgress.failed.join(', ')}.</span>
          )}
        </p>
      )}
      {isInviteOpen && (
        <div className="rec-panel family-invite">
          <label className="family-invite-label">
            Invite to
            <Select
              size="small"
              className="family-invite-track"
              value={inviteGroupId}
              onChange={setInviteGroupId}
              popupMatchSelectWidth={false}
              options={items.map((p) => ({ value: p.group.id, label: getTrack(p) }))}
            />
          </label>
          {inviteInvitation && (
            <InvitationEditor
              key={inviteInvitation.id}
              className="workflow-editor"
              invitation={inviteInvitation}
              existingValue={{}}
              closeInvitationEditor={() => setIsInviteOpen(false)}
              onInvitationEditPosted={() => {
                promptMessage('Edit is posted')
                reloadGroup()
              }}
              isGroupInvitation={true}
            />
          )}
        </div>
      )}
    </>
  )

  return (
    <TrackFamily
      title={`Recruit ${prettyField(family.baseRole)}`}
      trackCount={items.length}
      summary={summary}
      openSignal={openSignal}
      actions={actions}
      panel={panel}
    >
      {children}
    </TrackFamily>
  )
}

const getCommitteeRoles = (group) => [
  ...new Set(committeeRoleFields.flatMap((field) => group.content?.[field]?.value ?? [])),
]

// The committee filter offers each committee once, with its tracks, plus Authors.
const getCommitteeFilters = (group) => [
  ...committeeRoleFields.flatMap((field) => {
    const roles = group.content?.[field]?.value ?? []
    return roles.length ? [{ value: field, label: prettyField(roles[0]), roles }] : []
  }),
  ...(group.content?.authors_id?.value
    ? [
        {
          value: 'authors',
          label: 'Authors',
          roles: [group.content.authors_id.value.split('/').pop()],
        },
      ]
    : []),
]

// A stage is for a committee when it is named for it or one of its tracks
// ("bidding - Econ_Reviewers"), or when one of its steps is handed to that committee's members on
// each submission (".../Submission{number}/Reviewers"). A step the committee may merely use, such
// as editing another committee's draft assignments, does not count. Authors also own the
// submission itself, which is open to everyone ("~").
const isStageForCommittee = (workflowStage, committeeFilter, venueId) => {
  const committee = workflowStage.workflowStageName.split(' - ')[1]
  if (committee && committeeFilter.roles.includes(committee)) return true
  return workflowStage.invitationsOfWorkflowStageName.some((invitation) => {
    const invitees = invitation.edit?.invitation?.invitees ?? invitation.invitees ?? []
    return invitees.some(
      (invitee) =>
        (invitee.startsWith(`${venueId}/Submission`) &&
          committeeFilter.roles.some((role) => invitee.endsWith(`/${role}`))) ||
        (committeeFilter.value === 'authors' && invitee === '~')
    )
  })
}

// Phases group the stages under flat headings; a stage's phase comes from its name.
const workflowPhases = [
  { key: 'recruitment', label: 'Recruitment', stages: ['recruitment', 'registration'] },
  { key: 'submission', label: 'Submission', stages: ['submission', 'withdrawal'] },
  { key: 'assignment', label: 'Assignment', stages: ['bidding', 'assignment'] },
  {
    key: 'reviewing',
    label: 'Reviewing',
    stages: ['reviewing', 'review', 'rebuttal', 'discussion', 'meta_review', 'ethics_review'],
  },
  { key: 'decision', label: 'Decision', stages: ['decision'] },
  {
    key: 'release',
    label: 'Camera-ready & release',
    stages: ['camera_ready', 'public_release', 'release'],
  },
  { key: 'statistics', label: 'Statistics', stages: ['statistics'] },
]
const getStagePhase = (workflowStageName) =>
  workflowPhases.find((p) => p.stages.includes(workflowStageName.split(' - ')[0])) ?? {
    key: 'other',
    label: 'Other',
  }

// Stages, in order, gathered under each phase they run through.
const groupStagesByPhase = (items, getName) => {
  const sections = []
  items.forEach((item) => {
    const phase = getStagePhase(getName(item))
    const last = sections[sections.length - 1]
    if (last && last.phase.key === phase.key) last.items.push(item)
    else sections.push({ phase, items: [item] })
  })
  return sections
}

const getPhaseSpanLabel = (stages) => {
  const starts = stages.map((p) => p.periodStart).filter(Boolean)
  const ends = stages.map((p) => p.periodEnd).filter(Boolean)
  if (!starts.length) return null
  const start = Math.min(...starts)
  const end = ends.length ? Math.max(...ends) : start
  const crossesYear = dayjs(start).year() !== dayjs(end).year()
  return end === start
    ? formatShortDate(start)
    : `${formatShortDate(start, crossesYear)} – ${formatShortDate(end, crossesYear)}`
}

// A setting the step needs before it can run: its field is not optional and holds no value yet.
// Values live on the step itself, or for venue-wide settings on the venue group's content.
const isEmptySettingValue = (value) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)

const getMissingRequiredFields = (subInvitation, workflowInvitation, domainContent) => {
  if (subInvitation.edit?.group) return []
  return Object.entries(subInvitation.edit?.content ?? {}).flatMap(([key, field]) => {
    if (field?.value?.param?.optional) return []
    const path = getPath(subInvitation.edit.invitation, key)
    const value = path ? get(workflowInvitation, path) : domainContent?.[key]?.value
    return isEmptySettingValue(value) ? [key] : []
  })
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
  // Ongoing Actions can run long, so it starts collapsed.
  const [isOngoingOpen, setIsOngoingOpen] = useState(false)
  // Which recruited role Ongoing Actions should scroll to, and a tick so a repeat request re-fires.
  const [recruitmentFocus, setRecruitmentFocus] = useState({ groupId: null, tick: 0 })

  // Built from every stage, not the filtered ones, so the axis does not rescale while filtering.
  const timelineDomain = getTimelineDomain(workflowStages)
  const getWorkflowStageStatus = (workflowStage) =>
    getStageStatus(workflowStage.invitationsOfWorkflowStageName, processLogs)

  const [committeeFilter, setCommitteeFilter] = useState('all')
  const [hideCompleted, setHideCompleted] = useState(false)
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false)

  // What a step still needs from the PC: settings due by a date, and required settings left empty
  const getStepSetup = (stepObj) => {
    const pendingTaskDueDates = workflowTasks
      .filter((p) => p.workflowInvitation.id === stepObj.id && !p.isCompleted)
      .map((p) => p.duedate)
    const missingSettings = (stepObj.subInvitations ?? []).flatMap((subInvitation) =>
      getMissingRequiredFields(subInvitation, stepObj, group.content).map((key) => ({
        setting: prettyField(subInvitation.id.split('/').pop()),
        field: prettyField(key),
      }))
    )
    return {
      setupDueDate: pendingTaskDueDates.length ? Math.min(...pendingTaskDueDates) : null,
      missingSettings,
    }
  }

  // Needs attention is setup the PC still has to do, flagged on the stage row so a closed stage
  // still shows it. A failed run is the stage's Failed status instead. Disabled steps don't count.
  const getStageAttention = (invitations) => {
    const setupCount = invitations.filter((p) => {
      if (p.ddate) return false
      const { setupDueDate, missingSettings } = getStepSetup(p)
      return setupDueDate || missingSettings.length > 0
    }).length
    return setupCount > 0
      ? inflect(setupCount, 'step needs setup', 'steps need setup', true)
      : null
  }

  const committeeFilters = getCommitteeFilters(group)
    .map((filter) => ({
      ...filter,
      count: workflowStages.filter((p) => isStageForCommittee(p, filter, group.domain)).length,
    }))
    .filter((p) => p.count > 0)
  const committeeFilterOptions = [
    { value: 'all', label: 'All committees' },
    ...committeeFilters.map((p) => ({ value: p.value, label: p.label })),
  ]
  const activeCommitteeFilter = committeeFilters.find((p) => p.value === committeeFilter)
  const committeeWorkflowStages = activeCommitteeFilter
    ? workflowStages.filter((p) => isStageForCommittee(p, activeCommitteeFilter, group.domain))
    : workflowStages

  const stageStatusCounts = committeeWorkflowStages.reduce((counts, p) => {
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
  // Hide completed leaves a finished phase as just its heading. Asking for completed stages wins.
  const attentionStageCount = committeeWorkflowStages.filter((p) =>
    getStageAttention(p.invitationsOfWorkflowStageName)
  ).length
  const visibleWorkflowStages = committeeWorkflowStages.filter((p) => {
    if (needsAttentionOnly && !getStageAttention(p.invitationsOfWorkflowStageName))
      return false
    const { stageStatus } = getWorkflowStageStatus(p)
    if (stageStatusFilter !== 'all') return stageStatus === stageStatusFilter
    return !(hideCompleted && stageStatus === 'COMPLETED')
  })

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

  // Ongoing Actions: steps with no end date, still listed in their stage but off the timeline, plus
  // recruitment and the venue-level actions.
  // Recruitment and assignment steps stay in their stages only: recruiting already has its own
  // rows here, and assignments are configured where their stage sits on the timeline.
  const isStageKeptOutOfPcActions = (workflowStageName) =>
    /^(recruitment|assignment)\b/i.test(workflowStageName)
  const ongoingSteps = workflowStages
    .filter((p) => !isStageKeptOutOfPcActions(p.workflowStageName))
    .flatMap((p) => p.invitationsOfWorkflowStageName.filter((q) => isOngoingInvitation(q)))
  // Committees whose draft assignments are made on the assignments page.
  const assignedCommittees = getCommitteeRoles(group).flatMap((role) => {
    const assignmentInvitationId = `${group.domain}/${role}/-/Assignment`
    if (!workflowInvitations?.some((p) => p.id === assignmentInvitationId)) return []
    const deploymentInvitation = workflowInvitations.find(
      (p) => p.id === `${group.domain}/-/${role}_Assignment_Deployment`
    )
    const stageName = workflowStages.find((p) =>
      p.invitationsOfWorkflowStageName.some((q) => q.id === assignmentInvitationId)
    )?.workflowStageName
    return [{ role, deploymentInvitation, stageName }]
  })
  const pcActionCount =
    ongoingSteps.length + recruitedGroups.length + assignedCommittees.length + 2

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
  // Families of track stages open on their own, so a stage list of 150 reads as about 20 rows.
  const [openFamilyKeys, setOpenFamilyKeys] = useState([])
  const toggleFamily = (familyKey) =>
    setOpenFamilyKeys((keys) =>
      keys.includes(familyKey) ? keys.filter((p) => p !== familyKey) : [...keys, familyKey]
    )
  const openFamilyOf = (workflowStageName) => {
    const family = getStageFamily(workflowStageName, group)
    if (family)
      setOpenFamilyKeys((keys) => (keys.includes(family.key) ? keys : [...keys, family.key]))
  }
  const toggleWorkflowStage = (workflowStageName) =>
    setActiveStageKeys(
      openStageKeys.includes(workflowStageName)
        ? openStageKeys.filter((p) => p !== workflowStageName)
        : [...openStageKeys, workflowStageName]
    )

  // The overview strip, and the mini strip once the overview has scrolled away.
  const overviewRef = useRef(null)
  // Today is one dashed line down the whole timeline, from the month axis to the legend.
  const stageOverviewRef = useRef(null)
  const [nowLine, setNowLine] = useState(null)
  // Measured once per timeline range: today's position only moves when the axis does.
  useEffect(() => {
    const container = stageOverviewRef.current
    if (!container || !timelineDomain) return undefined
    const nowPercent = timelineDomain.percentOf(Date.now())
    const measure = () => {
      const axisRow = container.querySelector('.overview-axis-row')
      const track = axisRow?.querySelector('.overview-track')
      const legend = container.querySelector('.overview-legend')
      if (!track || !legend) return
      const trackRect = track.getBoundingClientRect()
      const left = Math.round(
        trackRect.left -
          container.getBoundingClientRect().left +
          (nowPercent / 100) * trackRect.width
      )
      const top = axisRow.offsetTop + axisRow.offsetHeight
      const height = Math.max(legend.offsetTop - top, 0)
      setNowLine((current) =>
        current?.left === left && current?.top === top && current?.height === height
          ? current
          : { left, top, height }
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineDomain?.months[0]?.key, timelineDomain?.end, workflowStages.length])
  const [isMiniStripVisible, setIsMiniStripVisible] = useState(false)
  // Phase headings pin just under the sticky month axis (Group.module.scss .phase-divider top)
  const phaseDividerTop = 34
  // A sticky phase heading reports where it is pinned, so measure it where it sits in the list.
  const scrollToElement = (element, offset) => {
    const { position } = element.style
    element.style.position = 'static'
    const top = element.getBoundingClientRect().top + window.scrollY
    element.style.position = position
    window.scrollTo({ top: top - offset, behavior: 'smooth' })
  }
  // Picking a stage from the timeline shows only that stage, then scrolls to it once the
  // others have collapsed, since closing a stage above shifts the target.
  const selectWorkflowStage = (workflowStageName) => {
    setActiveStageKeys([workflowStageName])
    openFamilyOf(workflowStageName)
    setTimeout(() => {
      const element = document.getElementById(`stage-${workflowStageName}`)
      if (element) scrollToElement(element, 64)
    }, 0)
  }
  const jumpToPhase = (phaseKey) => {
    const scrollToPhase = () => {
      const element = document.getElementById(`phase-${phaseKey}`)
      // the heading lands where it pins, just under the sticky month axis
      if (element) scrollToElement(element, phaseDividerTop)
      return !!element
    }
    if (scrollToPhase()) return
    setCommitteeFilter('all')
    setStageStatusFilter('all')
    setHideCompleted(false)
    setNeedsAttentionOnly(false)
    setTimeout(scrollToPhase, 0)
  }
  // A group card's Message writes to everyone in the group, through the site's own modal
  const [groupToMessage, setGroupToMessage] = useState(null)
  const openGroupMessage = (targetGroup) => {
    setGroupToMessage(targetGroup)
    setTimeout(() => $('#message-group-members').modal('show'), 0)
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
    // A step in a stage, or under Ongoing Actions, is a two-column row: the step, then its bar on the
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
            workflowInvitations={workflowInvitations}
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
          // The copy in Ongoing Actions must not take the ref used to scroll back to a step.
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

  const renderTimelineStep = (stepObj) => {
    const { id, isExpired, isMissingValue, subInvitations, isStageInvitation } = stepObj
    const isCollapsed = collapsedWorkflowInvitationIds.includes(id)
    const log = getProcessLogStatus(processLogs.filter((p) => p.invitation === id))
    // A failed run stays visible on the collapsed step, so nobody has to open it to find out.
    const errorText = log?.status === 'error' ? (log.error ?? log.message) : null
    const errorSetting = errorText ? getErrorSetting(errorText, stepObj, subInvitations) : null
    const description = stepObj.instructions ?? stepObj.description
    const { setupDueDate, missingSettings } = getStepSetup(stepObj)
    return (
      <div
        key={id}
        className={`timeline-step${isCollapsed ? '' : ' open'}${isExpired ? ' expired' : ''}`}
        ref={(el) => {
          workflowInvitationsRef.current[id] = el
        }}
      >
        <StepTimelineRow
          invitation={stepObj}
          domain={timelineDomain}
          processLogs={processLogs}
          isOpen={!isCollapsed}
          isFailed={!!errorText}
          setupDueDate={setupDueDate}
          missingSettingCount={missingSettings.length}
          isDisabled={!!isExpired}
          onToggle={() => handleExpandCollapseSubInvitations(id)}
        />
        {isCollapsed && errorText && (
          <div className="timeline-step-error step-status error">
            <span className="step-status-error" title={errorText}>
              <span className="step-status-error-text">{errorText}</span>
            </span>
          </div>
        )}
        {!isCollapsed && (
          <div className="workflow-invitation-container timeline-step-detail">
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
                errorSettingName={
                  errorSetting && prettyField(errorSetting.subInvitationId.split('/').pop())
                }
                showDescription={false}
                hideTitle={true}
                descriptionSlot={
                  description && (
                    <div className="invitation-description step-blurb">
                      <Markdown text={description} />
                    </div>
                  )
                }
              />
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
                  workflowInvitations={workflowInvitations}
                  processError={
                    errorSetting?.subInvitationId === subInvitation.id
                      ? { ...errorSetting, summary: errorText, details: log.errorDetails }
                      : null
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
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

  // The timeline lists single stages, and families of track stages in place of their first track.
  const timelineEntries = []
  const familyEntryIndex = {}
  visibleWorkflowStages.forEach((workflowStage) => {
    const family = getStageFamily(workflowStage.workflowStageName, group)
    if (!family) {
      timelineEntries.push({ workflowStage })
      return
    }
    if (familyEntryIndex[family.key] === undefined) {
      familyEntryIndex[family.key] = timelineEntries.length
      timelineEntries.push({ family, tracks: [] })
    }
    timelineEntries[familyEntryIndex[family.key]].tracks.push(workflowStage)
  })
  const familyKeys = timelineEntries.filter((p) => p.family).map((p) => p.family.key)

  // Phase sections for the timeline. With Hide completed on, a phase keeps its heading, with a
  // count of the completed stages it hides, even when nothing in it is left to show.
  const getTimelinePhaseSections = () => {
    const getEntryName = (entry) =>
      entry.workflowStage?.workflowStageName ?? entry.tracks[0].workflowStageName
    const visibleSections = groupStagesByPhase(timelineEntries, getEntryName)
    if (!hideCompleted || stageStatusFilter !== 'all' || needsAttentionOnly) {
      return visibleSections.map((p) => ({ ...p, hiddenCount: 0 }))
    }
    const hiddenByPhase = {}
    committeeWorkflowStages.forEach((p) => {
      if (getWorkflowStageStatus(p).stageStatus !== 'COMPLETED') return
      const { key } = getStagePhase(p.workflowStageName)
      hiddenByPhase[key] = (hiddenByPhase[key] ?? 0) + 1
    })
    const sections = []
    groupStagesByPhase(committeeWorkflowStages, (p) => p.workflowStageName).forEach(
      ({ phase }) => {
        if (sections.some((p) => p.phase.key === phase.key)) return
        const visible = visibleSections.filter((p) => p.phase.key === phase.key)
        sections.push({
          phase,
          items: visible.flatMap((p) => p.items),
          hiddenCount: hiddenByPhase[phase.key] ?? 0,
        })
      }
    )
    return sections
  }

  const renderTimelineStage = (workflowStage, extraClassName = '', trackName = null) => {
    const { workflowStageName, invitationsOfWorkflowStageName } = workflowStage
    const isOpen = openStageKeys.includes(workflowStageName)
    return (
      <div
        key={workflowStageName}
        id={`stage-${workflowStageName}`}
        className={`timeline-stage${isOpen ? ' open' : ''}${extraClassName}`}
      >
        <StageOverviewRow
          workflowStage={workflowStage}
          status={getWorkflowStageStatus(workflowStage)}
          domain={timelineDomain}
          isOpen={isOpen}
          onSelect={toggleWorkflowStage}
          processLogs={processLogs}
          trackName={trackName}
          attention={getStageAttention(invitationsOfWorkflowStageName)}
        />
        {isOpen && invitationsOfWorkflowStageName.map(renderTimelineStep)}
      </div>
    )
  }

  // A family row draws every track's steps on one row; the tracks open beneath it.
  const renderTimelineFamily = ({ family, tracks }) => {
    const isOpen = openFamilyKeys.includes(family.key)
    const starts = tracks.map((p) => p.periodStart).filter(Boolean)
    const ends = tracks.map((p) => p.periodEnd).filter(Boolean)
    const familyStage = {
      workflowStageName: family.label,
      invitationsOfWorkflowStageName: tracks.flatMap((p) => p.invitationsOfWorkflowStageName),
      periodStart: starts.length ? Math.min(...starts) : undefined,
      periodEnd: ends.length ? Math.max(...ends) : undefined,
    }
    return (
      <div
        key={family.key}
        id={`family-${family.key}`}
        className={`timeline-family${isOpen ? ' open' : ''}`}
      >
        <StageOverviewRow
          workflowStage={familyStage}
          status={getWorkflowStageStatus(familyStage)}
          domain={timelineDomain}
          isOpen={isOpen}
          onSelect={() => toggleFamily(family.key)}
          processLogs={processLogs}
          trackCount={tracks.length}
          attention={getStageAttention(familyStage.invitationsOfWorkflowStageName)}
        />
        {isOpen &&
          tracks.map((p) =>
            renderTimelineStage(
              p,
              ' track-stage',
              getStageFamily(p.workflowStageName, group)?.track
            )
          )}
      </div>
    )
  }

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
              {groupStagesByPhase(workflowStages, (p) => p.workflowStageName).map(
                ({ phase, items }, sectionIndex) => {
                  const status = getStageStatus(
                    items.flatMap((p) => p.invitationsOfWorkflowStageName),
                    processLogs
                  )
                  return (
                    <button
                      type="button"
                      key={`${phase.key}-${sectionIndex}`}
                      className="mini-stage"
                      tabIndex={isMiniStripVisible ? 0 : -1}
                      onClick={() => jumpToPhase(phase.key)}
                      title={`${phase.label} — ${stageStatusFilterLabels[status.stageStatus]}`}
                    >
                      <span
                        className={`stage-status-glyph ${status.stageStatusColor}`}
                        aria-hidden="true"
                      >
                        <StageStatusGlyph statusColor={status.stageStatusColor} />
                      </span>
                      <span className="mini-stage-name">{phase.label}</span>
                    </button>
                  )
                }
              )}
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
                    visibleWorkflowStages.length === workflowStages.length
                      ? inflect(workflowStages.length, 'stage', 'stages', true)
                      : `${visibleWorkflowStages.length} of ${inflect(workflowStages.length, 'stage', 'stages', true)}`
                  })`}</h4>
                  {workflowStages.length > 0 && (
                    <Typography.Link
                      onClick={() => {
                        const isCollapsing = openStageKeys.length > 0
                        setActiveStageKeys(
                          isCollapsing
                            ? []
                            : visibleWorkflowStages.map((p) => p.workflowStageName)
                        )
                        setOpenFamilyKeys(isCollapsing ? [] : familyKeys)
                      }}
                    >
                      {openStageKeys.length ? 'Collapse all stages' : 'Expand all stages'}
                    </Typography.Link>
                  )}
                  <div className="heading-filters">
                    <Checkbox
                      className="hide-completed"
                      checked={hideCompleted}
                      onChange={(e) => setHideCompleted(e.target.checked)}
                    >
                      Hide completed
                    </Checkbox>
                    {(attentionStageCount > 0 || needsAttentionOnly) && (
                      <Checkbox
                        className="needs-attention-filter"
                        checked={needsAttentionOnly}
                        onChange={(e) => setNeedsAttentionOnly(e.target.checked)}
                      >
                        <span className="stage-attention" aria-hidden="true">
                          <ExclamationCircleFilled />
                        </span>
                        Needs attention {attentionStageCount}
                      </Checkbox>
                    )}
                    {committeeFilterOptions.length > 1 && (
                      <Select
                        className="committee-filter"
                        size="small"
                        aria-label="Filter stages by committee"
                        popupMatchSelectWidth={false}
                        options={committeeFilterOptions}
                        value={committeeFilter}
                        onChange={setCommitteeFilter}
                      />
                    )}
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
                </div>
                {hasTimeline && (
                  <div
                    className={`stage-overview${nowLine ? ' has-now-line' : ''}`}
                    ref={stageOverviewRef}
                    style={nowLine ? { '--now-left': `${nowLine.left}px` } : undefined}
                  >
                    {nowLine && (
                      <div
                        className="timeline-now-line"
                        style={{
                          left: nowLine.left,
                          top: nowLine.top,
                          height: nowLine.height,
                        }}
                        aria-hidden="true"
                      />
                    )}
                    <div className="overview-axis-row">
                      <span className="overview-caret" />
                      <span className="overview-name" />
                      <span className="timeline-track with-labels overview-track">
                        <TimelineGrid domain={timelineDomain} showLabels={true} />
                      </span>
                      <span className="overview-period" />
                      <span className="overview-status-spacer" />
                    </div>
                    {getTimelinePhaseSections().map(
                      ({ phase, items, hiddenCount }, sectionIndex) => {
                        const stages = items.flatMap((p) =>
                          p.workflowStage ? [p.workflowStage] : p.tracks
                        )
                        const span = getPhaseSpanLabel(stages)
                        return (
                          <Fragment key={`${phase.key}-${sectionIndex}`}>
                            <div className="phase-divider" id={`phase-${phase.key}`}>
                              <span className="phase-divider-label">{phase.label}</span>
                              {span && <span className="phase-divider-span">{span}</span>}
                              {hiddenCount > 0 && (
                                <span className="phase-divider-hidden">
                                  {items.length
                                    ? `${hiddenCount} completed hidden`
                                    : `Completed · ${inflect(hiddenCount, 'stage', 'stages', true)} hidden`}
                                </span>
                              )}
                            </div>
                            {items.map((entry) =>
                              entry.family && entry.tracks.length > 1
                                ? renderTimelineFamily(entry)
                                : (entry.workflowStage
                                    ? [entry.workflowStage]
                                    : entry.tracks
                                  ).map((p) => renderTimelineStage(p))
                            )}
                          </Fragment>
                        )
                      }
                    )}
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
                        Select a stage to see its steps, and a step for its settings
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </EditorSection>

            {(invitationsWithoutWorkflowStage.length > 0 || stageInvitations.length > 0) && (
              <EditorSection className="workflow stage-detail-section">
                <div className="invitation-workflow-container">
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
            )}
          </>
        )
      ) : (
        <LoadingSpinner />
      )}

      {workflowInvitations && (
        <EditorSection className="workflow">
          <WorkflowSectionHeading
            title={`Ongoing Actions (${inflect(pcActionCount, 'action', 'actions', true)})`}
            isOpen={isOngoingOpen}
            onToggle={() => setIsOngoingOpen((isOpen) => !isOpen)}
            action={
              <Typography.Link onClick={() => setIsOngoingOpen((isOpen) => !isOpen)}>
                {isOngoingOpen ? 'Collapse ongoing actions' : 'Expand ongoing actions'}
              </Typography.Link>
            }
            description="Available for as long as the venue runs, so they aren't on the timeline."
          />
          {isOngoingOpen && (
            <div className="ongoing-container">
              <VenueActions group={group} />
              {recruitedGroups.length > 0 && (
                <div className="ongoing-step rec-action-group">
                  <div className="ongoing-stage">Recruitment</div>
                  {groupByCommitteeFamily(
                    recruitedGroups,
                    (p) => p.group.id.replace(`${group.domain}/`, ''),
                    group
                  ).map(({ family, items }) => {
                    const renderRow = ({
                      group: committeeGroup,
                      counts,
                      groupInvitations,
                    }) => (
                      <RecruitmentActionRow
                        key={committeeGroup.id}
                        group={committeeGroup}
                        counts={counts}
                        groupInvitations={groupInvitations}
                        reloadGroup={loadAllInvitations}
                        label={
                          family
                            ? getCommitteeFamily(
                                committeeGroup.id.replace(`${group.domain}/`, ''),
                                group
                              ).track
                            : null
                        }
                        focusTick={
                          recruitmentFocus.groupId === committeeGroup.id
                            ? recruitmentFocus.tick
                            : 0
                        }
                      />
                    )
                    if (!family) return items.map(renderRow)
                    const accepted = items.reduce(
                      (sum, p) => sum + (p.counts?.accepted ?? 0),
                      0
                    )
                    const awaiting = items.reduce(
                      (sum, p) => sum + (p.counts?.awaiting ?? 0),
                      0
                    )
                    return (
                      <RecruitmentFamily
                        key={family.key}
                        family={family}
                        items={items}
                        getTrack={(p) =>
                          getCommitteeFamily(p.group.id.replace(`${group.domain}/`, ''), group)
                            .track
                        }
                        summary={`${formatCount(accepted)} accepted · ${formatCount(awaiting)} not replied`}
                        openSignal={
                          items.some((p) => p.group.id === recruitmentFocus.groupId)
                            ? recruitmentFocus.tick
                            : 0
                        }
                        reloadGroup={loadAllInvitations}
                      >
                        {items.map(renderRow)}
                      </RecruitmentFamily>
                    )
                  })}
                </div>
              )}
              {assignedCommittees.length > 0 && (
                <div className="ongoing-step rec-action-group">
                  <div className="ongoing-stage">Assignment</div>
                  {groupByCommitteeFamily(assignedCommittees, (p) => p.role, group).map(
                    ({ family, items }) => {
                      const renderRow = ({ role, deploymentInvitation, stageName }) => (
                        <AssignmentActionRow
                          key={role}
                          role={role}
                          venueId={group.domain}
                          deploymentState={getDeploymentState(
                            deploymentInvitation,
                            processLogs
                          )}
                          stageName={stageName}
                          label={family ? getCommitteeFamily(role, group).track : null}
                          onViewStage={(workflowStageName) => {
                            // The stage may be filtered out; show every stage before opening it.
                            setCommitteeFilter('all')
                            setStageStatusFilter('all')
                            selectWorkflowStage(workflowStageName)
                          }}
                        />
                      )
                      if (!family) return items.map(renderRow)
                      return (
                        <TrackFamily
                          key={family.key}
                          title={`Assign ${prettyField(family.baseRole)}`}
                          trackCount={items.length}
                        >
                          {items.map(renderRow)}
                        </TrackFamily>
                      )
                    }
                  )}
                </div>
              )}
              <div className="ongoing-step rec-action-group">
                <div className="ongoing-stage">Messaging</div>
                <WorkflowMessageActions group={group} />
              </div>
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
            {groupByCommitteeFamily(
              committeeGroups,
              (p) => p.group.id.replace(`${group.domain}/`, ''),
              group
            ).map(({ family, items }) => {
              const renderRow = ({ group: committeeGroup, counts }) => (
                <GroupRow
                  key={committeeGroup.id}
                  group={committeeGroup}
                  counts={counts}
                  onOpenRecruitment={openRecruitment}
                  onMessage={openGroupMessage}
                  label={
                    family
                      ? getCommitteeFamily(
                          committeeGroup.id.replace(`${group.domain}/`, ''),
                          group
                        ).track
                      : null
                  }
                />
              )
              if (!family) return items.map(renderRow)
              const members = items.reduce((sum, p) => sum + (p.group.members?.length ?? 0), 0)
              return (
                <TrackFamily
                  key={family.key}
                  title={prettyField(family.baseRole)}
                  trackCount={items.length}
                  summary={inflect(members, 'member', 'members', true)}
                >
                  {items.map(renderRow)}
                </TrackFamily>
              )
            })}
          </div>
          {groupToMessage && (
            <MessageMemberModal
              key={groupToMessage.id}
              groupId={groupToMessage.id}
              domainId={group.domain}
              groupDomainContent={group.content}
              membersToMessage={[groupToMessage.id]}
              setJobId={() =>
                promptMessage(
                  `Your message to everyone in ${prettyId(groupToMessage.id, true)} is being sent.`
                )
              }
              messageMemberInvitation={null}
            />
          )}
        </EditorSection>
      )}
    </>
  )
}

export default WorkFlowInvitations
