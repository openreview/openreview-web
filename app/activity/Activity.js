'use client'

import { useEffect, useState } from 'react'
import BaseActivityList from '../../components/BaseActivityList'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Activity() {
  const { token, isRefreshing } = useUser()
  const [activityNotes, setActivityNotes] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const getActivityData = async () => {
    const { activityNotes: notes, errorMessage: message } = await api
      .get(
        '/notes/edits',
        {
          tauthor: true,
          trash: true,
          details: 'writable,invitation',
          sort: 'tmdate:desc',
          limit: 100,
        },
        { accessToken: token }
      )
      .then((result) => {
        const edits = result.edits || []
        return {
          activityNotes: edits
            .map((edit) => ({ ...edit, apiVersion: 2 }))
            .sort((a, b) => b.tmdate - a.tmdate),
        }
      })
      .catch((error) => {
        console.log('Error in activityDataP', {
          page: 'activity',
          apiError: error,
          apiRequest: {
            endpoint: '/notes/edits',
            params: {
              tauthor: true,
              trash: true,
              details: 'writable,invitation',
              sort: 'tmdate:desc',
              limit: 100,
            },
          },
        })
        return { errorMessage: error.message }
      })
    setActivityNotes(notes)
    setErrorMessage(message)
  }

  useEffect(() => {
    if (isRefreshing) return
    getActivityData()
  }, [isRefreshing])

  if (!activityNotes) return <LoadingSpinner />
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
