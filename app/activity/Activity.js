'use client'

import { use } from 'react'
import BaseActivityList from '../../components/BaseActivityList'

export default function Activity({ activityDataP }) {
  const activityNotes = use(activityDataP)

  return (
    <BaseActivityList
      notes={activityNotes}
      emptyMessage="No recent activity to display."
      showActionButtons
      showGroup
    />
  )
}
