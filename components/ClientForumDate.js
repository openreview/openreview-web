'use client'

import { useEffect, useState } from 'react'
import { forumDate } from '../lib/utils'

export default function ClientForumDate({ note }) {
  const [isClientRendering, setIsClientRendering] = useState(false)

  useEffect(() => {
    setIsClientRendering(true)
  }, [])

  if (!isClientRendering) return null
  return forumDate(
    note.cdate,
    note.tcdate,
    note.mdate,
    note.tmdate,
    note.content?.year?.value,
    note.pdate
  )
}
