'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatTimestamp, prettyId } from '../../lib/utils'
import Icon from '../../components/Icon'

export default function VenueListItem({ groupId, dueDate, hidden, isLeadingVenue = false }) {
  const styles = hidden ? { display: 'none' } : {}
  const [isClientRendering, setIsClientRendering] = useState(false)

  useEffect(() => {
    setIsClientRendering(true)
  }, [])

  if (!isClientRendering) return null
  return (
    <li style={styles}>
      <h2>
        <Link
          href={`/group?id=${groupId}&referrer=${encodeURIComponent('[Homepage](/)')}`}
          className={`${isLeadingVenue ? 'leading-venue' : ''}`}
        >
          {prettyId(groupId)}
        </Link>
      </h2>
      {dueDate && (
        <p>
          <Icon name="time" />
          Due {formatTimestamp(dueDate)}
        </p>
      )}
    </li>
  )
}
