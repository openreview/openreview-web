'use client'

/* globals promptError: false */

import { Segmented } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { formatDateTime, inflect, prettyField, prettyId } from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'
import { getWorkflowGroupIds } from './WorkflowInvitations'

// The edits endpoint matches an invitation or group id exactly — no prefix — so the activity
// of a workflow is one query per step and per group. That is bounded by the workflow, not by
// the submissions, which is what keeps it usable on a large venue. A prefix filter on the API
// would collapse this to one query per prefix.
const requestBatchSize = 20
const editsPerTarget = 25
const pageSize = 100

// Who made an edit is its signature: the venue itself, the platform or a template is the
// machinery; a person signs as a group (Program Chairs), whatever account they are on.
const isAutomaticEdit = (edit, venueId) => {
  const signature = edit.signatures?.[0] ?? ''
  const superUser = process.env.SUPER_USER ?? 'openreview.net'
  return (
    signature === venueId || signature.startsWith(superUser) || signature === '~Super_User1'
  )
}

const describeValue = (value) => {
  if (value == null) return '—'
  if (typeof value === 'number' && value > 1e12) {
    return formatDateTime(value, { second: undefined })
  }
  if (Array.isArray(value)) return value.map((p) => prettyId(p, true)).join(', ')
  if (typeof value === 'object') {
    if (value.delete) return 'cleared'
    return JSON.stringify(value)
  }
  return String(value)
}

const stripVenue = (id, venueId) => id.replace(`${venueId}/`, '')

// A step edit: what was set, by which setting. The meta Edit invitation carries no content, so
// the changed fields of the invitation itself are named instead; a deletion date is a disable.
const describeInvitationEdit = (edit, venueId) => {
  const target = edit.invitation?.id ?? ''
  const via = edit.invitations ?? ''
  const viaName = via.startsWith(`${target}/`)
    ? prettyField(via.slice(target.length + 1))
    : null
  const content = Object.entries(edit.content ?? {})
  let details
  if (content.length) {
    details = content.map(
      ([key, value]) => `${prettyField(key)}: ${describeValue(value?.value)}`
    )
  } else if (edit.invitation?.ddate !== undefined) {
    details = [edit.invitation.ddate?.delete ? 'Enabled' : 'Disabled']
  } else {
    const fields = Object.keys(edit.invitation ?? {}).filter(
      (key) => !['id', 'signatures', 'readers', 'writers', 'cdate'].includes(key)
    )
    details = fields.length ? [`Changed ${fields.map(prettyField).join(', ')}`] : ['Updated']
  }
  return {
    kind: 'step',
    targetId: target,
    targetName: prettyId(stripVenue(target, venueId)),
    viaName,
    details,
  }
}

// A group edit: members in or out, a recruitment request, a setting.
const describeGroupEdit = (edit, venueId) => {
  const target = edit.group?.id ?? ''
  const members = edit.group?.members
  const content = Object.entries(edit.content ?? {})
  // A group's own settings travel on the group, not on the edit's content.
  const groupContent = Object.entries(edit.group?.content ?? {})
  let details
  if (members?.append?.length) {
    details = [`${inflect(members.append.length, 'member', 'members', true)} added`]
  } else if (members?.remove?.length) {
    details = [`${inflect(members.remove.length, 'member', 'members', true)} removed`]
  } else if (Array.isArray(members)) {
    details = [`Members set to ${inflect(members.length, 'member', 'members', true)}`]
  } else if (content.length) {
    details = content.map(
      ([key, value]) => `${prettyField(key)}: ${describeValue(value?.value)}`
    )
  } else if (groupContent.length) {
    details = groupContent.map(
      ([key, value]) => `${prettyField(key)}: ${describeValue(value?.value)}`
    )
  } else if (edit.group?.web !== undefined) {
    details = ['Home page changed']
  } else {
    details = ['Updated']
  }
  const via = edit.invitations ?? ''
  const viaName = /\/-\/(Edit|Members)$/.test(via) ? null : prettyId(via.split('/-/')[1] ?? '')
  return {
    kind: 'group',
    targetId: target,
    targetName: prettyId(stripVenue(target, venueId)),
    viaName,
    details,
  }
}

const inBatches = async (items, request) => {
  const results = []
  for (let i = 0; i < items.length; i += requestBatchSize) {
    // eslint-disable-next-line no-await-in-loop
    const batch = await Promise.all(items.slice(i, i + requestBatchSize).map(request))
    results.push(...batch.flat())
  }
  return results
}

const dayLabel = (timestamp) => {
  const day = dayjs(timestamp)
  if (day.isSame(dayjs(), 'day')) return 'Today'
  if (day.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday'
  return day.format('ddd, MMM D, YYYY')
}

const WorkflowActivity = ({ group }) => {
  const venueId = group.id
  const [entries, setEntries] = useState(null)
  const [scope, setScope] = useState('organizers')
  const [shown, setShown] = useState(pageSize)

  useEffect(() => {
    const load = async () => {
      try {
        const { roleGroups, workflowGroupIds } = getWorkflowGroupIds(group)
        const prefixes = [venueId, ...roleGroups.map((p) => p.id)].map((id) => `${id}/-/`)
        const invitations = (
          await Promise.all(
            prefixes.map((prefix) =>
              api.getAll('/invitations', {
                prefix,
                expired: true,
                trash: true,
                type: 'all',
                domain: venueId,
              })
            )
          )
        ).flat()
        // A step is a top-level invitation; its settings are sub-invitations whose edits land
        // on the step anyway, so the step id alone collects all of them.
        const stepIds = invitations
          .filter((p) => !p.id.split('/-/')[1]?.includes('/'))
          .map((p) => p.id)
        const groupIds = [venueId, ...workflowGroupIds]

        const [stepEdits, groupEdits] = await Promise.all([
          inBatches(stepIds, (id) =>
            api
              .get('/invitations/edits', {
                'invitation.id': id,
                limit: editsPerTarget,
                sort: 'tcdate:desc',
              })
              .then((result) => result.edits ?? [])
          ),
          inBatches(groupIds, (id) =>
            api
              .get('/groups/edits', {
                'group.id': id,
                limit: editsPerTarget,
                sort: 'tcdate:desc',
              })
              .then((result) => result.edits ?? [])
              .catch(() => [])
          ),
        ])
        const all = [
          ...stepEdits.map((edit) => ({ edit, ...describeInvitationEdit(edit, venueId) })),
          ...groupEdits.map((edit) => ({ edit, ...describeGroupEdit(edit, venueId) })),
        ].map((p) => ({
          ...p,
          id: p.edit.id,
          tcdate: p.edit.tcdate,
          author: p.edit.tauthor ?? p.edit.signatures?.[0] ?? '',
          isAutomatic: isAutomaticEdit(p.edit, venueId),
        }))
        setEntries(all.sort((a, b) => b.tcdate - a.tcdate))
      } catch (error) {
        promptError(error.message)
        setEntries([])
      }
    }
    load()
  }, [venueId])

  if (!entries) return <LoadingSpinner />

  const visible = scope === 'all' ? entries : entries.filter((p) => !p.isAutomatic)
  const page = visible.slice(0, shown)
  const days = page.reduce((groups, entry) => {
    const label = dayLabel(entry.tcdate)
    const last = groups[groups.length - 1]
    if (last?.label === label) last.entries.push(entry)
    else groups.push({ label, entries: [entry] })
    return groups
  }, [])

  return (
    <section className="workflow activity">
      <div className="workflow-section-heading">
        <h4>{`Activity (${visible.length})`}</h4>
        <Segmented
          size="small"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'organizers', label: 'By organizers' },
            { value: 'all', label: 'All changes' },
          ]}
        />
      </div>
      <p className="workflow-section-intro">
        Changes to the workflow steps and groups, newest first — the {editsPerTarget} most
        recent for each. "All changes" adds what the venue&apos;s own processes and the
        platform did.
      </p>

      {days.length === 0 && <p className="activity-empty">No changes yet.</p>}
      {days.map((day) => (
        <div key={day.label} className="activity-day">
          <h5>{day.label}</h5>
          {day.entries.map((entry) => (
            <div key={entry.id} className="activity-row">
              <span className="activity-time">{dayjs(entry.tcdate).format('h:mm A')}</span>
              <span className="activity-author" title={entry.author}>
                {entry.isAutomatic ? 'Automatic' : prettyId(entry.author, true)}
              </span>
              <span className="activity-what">
                {entry.kind === 'step' ? (
                  <a
                    href={`/group/edit?id=${venueId}&step=${encodeURIComponent(entry.targetId)}#workflowInvitations`}
                  >
                    {entry.targetName}
                  </a>
                ) : (
                  <a href={`/group/edit?id=${entry.targetId}`}>{entry.targetName}</a>
                )}
                {entry.viaName && <span className="activity-via"> · {entry.viaName}</span>}
              </span>
              <span className="activity-details">{entry.details.join(' · ')}</span>
            </div>
          ))}
        </div>
      ))}
      {visible.length > shown && (
        <button className="btn btn-xs" onClick={() => setShown((n) => n + pageSize)}>
          Show more
        </button>
      )}
    </section>
  )
}

export default WorkflowActivity
