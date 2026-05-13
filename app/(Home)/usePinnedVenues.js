'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_PREFIX = 'openreview.pinnedVenues.'
const CHANGE_EVENT = 'openreview:pinnedVenuesChanged'

const storageKey = (userId) => `${STORAGE_PREFIX}${userId}`

const readPinned = (userId) => {
  if (!userId || typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(storageKey(userId))
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const writePinned = (userId, ids) => {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(ids))
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

  const isPinned = useCallback((groupId) => pinned.includes(groupId), [pinned])

  const togglePin = useCallback(
    (groupId) => {
      const current = readPinned(userId)
      const next = current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId]
      writePinned(userId, next)
    },
    [userId]
  )

  return { pinned, isPinned, togglePin }
}
