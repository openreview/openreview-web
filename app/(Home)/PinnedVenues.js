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

export default function PinnedVenues({ userId, openVenues = [], activeVenues = [] }) {
  const { pinned, togglePin } = usePinnedVenues(userId)

  const entries = useMemo(() => {
    return pinned.map((groupId) => {
      const openVenue = openVenues.find((v) => v?.groupId === groupId)
      const isOpen = !!openVenue
      const isActive = !isOpen && activeVenues.some((v) => v?.groupId === groupId)
      const deadline = openVenue?.dueDate ? formatDeadline(openVenue.dueDate) : null
      return { groupId, isOpen, isActive, deadline }
    })
  }, [pinned, openVenues, activeVenues])

  return (
    <section>
      <h1>Pinned Venues</h1>
      <Divider style={{ marginTop: 0, minWidth: 0 }} />
      {entries.length === 0 ? (
        <p style={{ color: '#666' }}>
          Search for a venue below and click the pin icon to track it here.
        </p>
      ) : (
        <ul className="conferences" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {entries.map(({ groupId, isOpen, isActive, deadline }) => (
            <li key={groupId}>
              <Flex align="baseline" gap={8} wrap="wrap">
                <h2>
                  <Link
                    href={`/group?id=${groupId}&referrer=${encodeURIComponent('[Homepage](/)')}`}
                  >
                    {prettyId(groupId)}
                  </Link>
                </h2>
                {isActive && <Tag color="#3e6775">Active</Tag>}
                {isOpen && <Tag color="#8c1b13">Open</Tag>}
                {deadline && (
                  <span style={{ fontSize: '0.85em', color: '#8c1b13', fontWeight: 600 }}>
                    {deadline}
                  </span>
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<PushpinFilled />}
                  onClick={() => togglePin(groupId)}
                  aria-label={`Unpin ${prettyId(groupId)}`}
                  style={{ marginLeft: 'auto', alignSelf: 'center' }}
                />
              </Flex>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
