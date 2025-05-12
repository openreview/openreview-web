'use client'

import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'
import { formatTimestamp } from '../../lib/utils'

export default function VenueListItemDueDate({ dueDate }) {
  const [isClientRendering, setIsClientRendering] = useState(false)

  useEffect(() => {
    setIsClientRendering(true)
  }, [])

  if (!isClientRendering)
    return (
      <p>
        <Icon name="time" />
        Due ...
      </p>
    )
  return (
    <p>
      <Icon name="time" />
      Due {formatTimestamp(dueDate)}
    </p>
  )
}
