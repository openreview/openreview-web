'use client'

import { PushpinFilled } from '@ant-design/icons'
import { Button, Divider, Flex, Tag } from 'antd'
import Link from 'next/link'
import { useMemo } from 'react'
import { prettyId } from '../../lib/utils'
import usePinnedVenues from './usePinnedVenues'

const formatDeadline = (dueDate) => {
  if (!dueDate) return null
  const diffMs = dueDate - Date.now()
  if (diffMs <= 0) return null
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 24) return `Closes in ${hours}h`
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  if (days < 7) {
    return remHours > 0 ? `Closes in ${days}d ${remHours}h` : `Closes in ${days}d`
  }
  return `Closes in ${days}d`
}

const referrer = encodeURIComponent('[Homepage](/)')

export default function PinnedVenues({ userId, openVenues = [], activeVenues = [] }) {
  const { pinned, togglePin } = usePinnedVenues(userId)

  const entries = useMemo(
    () =>
      pinned.map((item) => {
        if (item.type === 'venue') {
          const openVenue = openVenues.find((v) => v?.groupId === item.id)
          const isOpen = !!openVenue
          const isActive = !isOpen && activeVenues.some((v) => v?.groupId === item.id)
          const deadline = openVenue?.dueDate ? formatDeadline(openVenue.dueDate) : null
          return { ...item, isOpen, isActive, deadline }
        }
        return item
      }),
    [pinned, openVenues, activeVenues]
  )

  return (
    <section>
      <h1>Pinned Items</h1>
      <Divider style={{ marginTop: 0, minWidth: 0 }} />
      {entries.length === 0 ? (
        <p style={{ color: '#666' }}>
          Search for a venue or paper below and click the pin icon to track it here.
        </p>
      ) : (
        <ul className="conferences" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {entries.map((item) => {
            if (item.type === 'venue') {
              const { id, isOpen, isActive, deadline } = item
              return (
                <li key={`venue-${id}`}>
                  <Flex align="baseline" gap={8} wrap="wrap">
                    <h2>
                      <Link href={`/group?id=${id}&referrer=${referrer}`}>
                        {prettyId(id)}
                      </Link>
                    </h2>
                    {isActive && <Tag color="#3e6775">Active</Tag>}
                    {isOpen && <Tag color="#8c1b13">Open</Tag>}
                    {deadline && (
                      <span
                        style={{ fontSize: '0.85em', color: '#8c1b13', fontWeight: 600 }}
                      >
                        {deadline}
                      </span>
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<PushpinFilled />}
                      onClick={() => togglePin('venue', id)}
                      aria-label={`Unpin ${prettyId(id)}`}
                      style={{ marginLeft: 'auto', alignSelf: 'center' }}
                    />
                  </Flex>
                </li>
              )
            }
            // note
            const { id, title, forum, authors } = item
            const displayTitle = title || '(Untitled)'
            const linkHref =
              forum && forum !== id
                ? `/forum?id=${forum}&noteId=${id}&referrer=${referrer}`
                : `/forum?id=${forum ?? id}&referrer=${referrer}`
            return (
              <li key={`note-${id}`}>
                <Flex align="baseline" gap={8} wrap="wrap">
                  <h2>
                    <Link href={linkHref}>{displayTitle}</Link>
                  </h2>
                  <Tag color="#6b6b6b">Paper</Tag>
                  {authors && (
                    <span style={{ fontSize: '0.85em', color: '#666' }}>{authors}</span>
                  )}
                  <Button
                    type="text"
                    size="small"
                    icon={<PushpinFilled />}
                    onClick={() => togglePin('note', id)}
                    aria-label={`Unpin ${displayTitle}`}
                    style={{ marginLeft: 'auto', alignSelf: 'center' }}
                  />
                </Flex>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
