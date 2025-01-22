'use client'

import { use } from 'react'
import BaseActivityList from '../../components/BaseActivityList'

export default function Activity({ activityDataP }) {
  const { activityNotes, errorMessage } = use(activityDataP)
  if (errorMessage) throw new Error(errorMessage)

  return (
    <BaseActivityList
      notes={activityNotes}
      emptyMessage="No recent activity to display."
      showActionButtons
      showGroup
    />
  )
}
