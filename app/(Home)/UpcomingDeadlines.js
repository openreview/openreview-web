'use client'

import { Divider, Flex, Popover, Segmented, Tag } from 'antd'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { prettyId } from '../../lib/utils'

const ONE_DAY = 24 * 60 * 60 * 1000
const ONE_WEEK = 7 * ONE_DAY

const formatCountdown = (dueDate) => {
  const diff = dueDate - Date.now()
  if (diff <= 0) return null
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `${hours}h left`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 day left' : `${days} days left`
}

const formatDate = (ts) =>
  new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

const groupKey = (dueDate) => {
  const diff = dueDate - Date.now()
  if (diff <= ONE_WEEK) return 'This week'
  if (diff <= 2 * ONE_WEEK) return 'Next week'
  return 'Later'
}

const referrer = encodeURIComponent('[Homepage](/)')

const VIEW_OPTIONS = [
  { label: 'List', value: 'list' },
  { label: 'Calendar', value: 'calendar' },
]

const ListView = ({ groups }) =>
  groups.map((group) => (
    <div key={group.key} style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 12px',
        }}
      >
        {group.key}
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {group.items.map((venue) => {
          const countdown = formatCountdown(venue.dueDate)
          const urgent = venue.dueDate - Date.now() <= ONE_DAY
          return (
            <li
              key={venue.groupId}
              style={{
                padding: '10px 0',
                borderBottom: '1px solid #e8e3d8',
              }}
            >
              <Flex align="baseline" gap={12} wrap="wrap">
                <span style={{ minWidth: 110, color: '#666', fontSize: '0.875rem' }}>
                  {formatDate(venue.dueDate)}
                </span>
                <Link
                  href={`/group?id=${venue.groupId}&referrer=${referrer}`}
                  style={{ fontWeight: 500, flex: 1, minWidth: 0 }}
                >
                  {prettyId(venue.groupId)}
                </Link>
                {countdown && (
                  <Tag color={urgent ? '#8c1b13' : undefined}>{countdown}</Tag>
                )}
              </Flex>
            </li>
          )
        })}
      </ul>
    </div>
  ))

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MiniMonth = ({ month, byDate, today }) => {
  const startOfMonth = month.startOf('month')
  const firstWeekDay = startOfMonth.day()
  const daysInMonth = month.daysInMonth()

  // Leading blanks + days + trailing blanks to fill the grid.
  const cells = []
  for (let i = 0; i < firstWeekDay; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(startOfMonth.date(d))
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div style={{ flex: '1 1 240px', minWidth: 240 }}>
      <div
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: 8,
          color: '#333',
        }}
      >
        {month.format('MMMM YYYY')}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
          fontSize: '0.75rem',
        }}
      >
        {WEEKDAY_LABELS.map((l) => (
          <div
            key={l}
            style={{ textAlign: 'center', color: '#999', padding: '2px 0' }}
          >
            {l.slice(0, 2)}
          </div>
        ))}
        {cells.map((date, idx) => {
          if (!date) return <div key={`b-${idx}`} />
          const key = date.format('YYYY-MM-DD')
          const items = byDate[key] || []
          const isPast = date.isBefore(today, 'day')
          const isToday = date.isSame(today, 'day')
          const hasDeadline = items.length > 0
          const cellStyle = {
            position: 'relative',
            textAlign: 'center',
            padding: '6px 0',
            borderRadius: 4,
            color: isPast ? '#ccc' : '#333',
            fontWeight: isToday ? 700 : 400,
            background: hasDeadline ? '#fbe9e7' : 'transparent',
            cursor: hasDeadline ? 'pointer' : 'default',
            border: isToday ? '1px solid #8c1b13' : '1px solid transparent',
          }
          const dayContent = (
            <div style={cellStyle}>
              {date.date()}
              {hasDeadline && (
                <span
                  style={{
                    display: 'block',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#8c1b13',
                    margin: '2px auto 0',
                  }}
                />
              )}
            </div>
          )
          if (!hasDeadline) return <div key={key}>{dayContent}</div>
          return (
            <Popover
              key={key}
              trigger={['hover', 'click']}
              title={date.format('ddd, MMM D, YYYY')}
              content={
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxWidth: 280 }}>
                  {items.map((v) => (
                    <li key={v.groupId} style={{ padding: '4px 0' }}>
                      <Link
                        href={`/group?id=${v.groupId}&referrer=${referrer}`}
                        style={{ color: '#8c1b13', fontWeight: 500 }}
                      >
                        {prettyId(v.groupId)}
                      </Link>
                    </li>
                  ))}
                </ul>
              }
            >
              {dayContent}
            </Popover>
          )
        })}
      </div>
    </div>
  )
}

const CalendarView = ({ byDate, upcoming }) => {
  const today = useMemo(() => dayjs().startOf('day'), [])
  const months = useMemo(() => {
    const lastDeadline = upcoming.length > 0
      ? dayjs(upcoming[upcoming.length - 1].dueDate)
      : today
    const start = today.startOf('month')
    const monthsAhead = Math.max(
      0,
      Math.min(11, lastDeadline.startOf('month').diff(start, 'month'))
    )
    const count = Math.max(3, monthsAhead + 1)
    return Array.from({ length: count }, (_, i) => start.add(i, 'month'))
  }, [upcoming, today])

  return (
    <Flex gap={24} wrap="wrap">
      {months.map((m) => (
        <MiniMonth key={m.valueOf()} month={m} byDate={byDate} today={today} />
      ))}
    </Flex>
  )
}

export default function UpcomingDeadlines({ openVenues = [] }) {
  const [view, setView] = useState('list')

  const upcoming = useMemo(() => {
    const now = Date.now()
    return openVenues
      .filter((v) => v.dueDate && v.dueDate > now)
      .sort((a, b) => a.dueDate - b.dueDate)
  }, [openVenues])

  const groups = useMemo(() => {
    const ordered = ['This week', 'Next week', 'Later']
    const map = ordered.reduce((acc, k) => ({ ...acc, [k]: [] }), {})
    upcoming.slice(0, 25).forEach((v) => {
      map[groupKey(v.dueDate)].push(v)
    })
    return ordered.filter((k) => map[k].length > 0).map((k) => ({ key: k, items: map[k] }))
  }, [upcoming])

  const byDate = useMemo(() => {
    const map = {}
    upcoming.forEach((v) => {
      const key = dayjs(v.dueDate).format('YYYY-MM-DD')
      if (!map[key]) map[key] = []
      map[key].push(v)
    })
    return map
  }, [upcoming])

  if (upcoming.length === 0) return null

  return (
    <section>
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <h1 style={{ margin: 0 }}>Upcoming deadlines</h1>
        <Segmented
          value={view}
          onChange={setView}
          options={VIEW_OPTIONS}
        />
      </Flex>
      <Divider style={{ marginTop: 12, minWidth: 0 }} />
      {view === 'list' ? (
        <ListView groups={groups} />
      ) : (
        <CalendarView byDate={byDate} upcoming={upcoming} />
      )}
    </section>
  )
}
