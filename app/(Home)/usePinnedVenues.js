'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_PREFIX = 'openreview.pinnedVenues.'
const CHANGE_EVENT = 'openreview:pinnedVenuesChanged'

const storageKey = (userId) => `${STORAGE_PREFIX}${userId}`

// Migrate legacy string entries (venue groupIds) into the typed shape.
const normalize = (item) => {
  if (typeof item === 'string') return { type: 'venue', id: item }
  return item
}

const readPinned = (userId) => {
  if (!userId || typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(storageKey(userId))
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.map(normalize) : []
  } catch {
    return []
  }
}

const writePinned = (userId, items) => {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(items))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  } catch {
    // localStorage write can fail (quota, private mode) — silently ignore
  }
}

export default function usePinnedVenues(userId) {
  const [pinned, setPinned] = useState(() => readPinned(userId))

  useEffect(() => {
    if (!userId) {
      setPinned([])
      return undefined
    }
    setPinned(readPinned(userId))
    const onChange = () => setPinned(readPinned(userId))
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [userId])

  const isPinned = useCallback(
    (type, id) => pinned.some((p) => p.type === type && p.id === id),
    [pinned]
  )

  const togglePin = useCallback(
    (type, id, snapshot) => {
      const current = readPinned(userId)
      const existing = current.findIndex((p) => p.type === type && p.id === id)
      let next
      if (existing >= 0) {
        next = current.filter((_, i) => i !== existing)
      } else {
        next = [...current, { type, id, ...(snapshot ?? {}) }]
      }
      writePinned(userId, next)
    },
    [userId]
  )

  return { pinned, isPinned, togglePin }
}
