/* globals $: false */
/* globals typesetMathJax: false */

import { useState, useEffect } from 'react'
import LoadingSpinner from '../LoadingSpinner'
import ErrorAlert from '../ErrorAlert'
import BaseActivityList from '../BaseActivityList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'

export default function ActivityList({ venueId, apiVersion, invitation, pageSize, shouldReload }) {
  const [activityNotes, setActivityNotes] = useState(null)
  const [error, setError] = useState(null)
  const { accessToken } = useUser()

  useEffect(() => {
    if (!accessToken) return

    const loadActivityNotes = () => api
      .get(
        '/notes',
        {
          invitation: invitation || `${venueId}/.*`,
          details: 'forumContent,invitation,writable',
          sort: 'tmdate:desc',
          limit: pageSize || 25,
        },
        { accessToken }
      )
      .then(({ notes }) => {
        setActivityNotes(notes?.length > 0 ? notes : [])
      })
      .catch((apiError) => {
        setActivityNotes([])
        setError(apiError)
      })

    const loadActivityEdits = () => api
      .get(
        '/edits/notes',
        {
          domain: venueId,
          trash: true,
          details: 'writable,invitation',
          sort: 'tmdate:desc',
          limit: pageSize || 25,
        },
        { accessToken, version: apiVersion }
      )
      .then(({ notes }) => {
        setActivityNotes(notes?.length > 0 ? notes : [])
      })
      .catch((apiError) => {
        setActivityNotes([])
        setError(apiError)
      })

    setError(null)

    if (apiVersion === 1) {
      loadActivityNotes()
    } else {
      loadActivityEdits()
    }
  }, [accessToken, shouldReload])

  useEffect(() => {
    if (!activityNotes) return

    setTimeout(() => {
      typesetMathJax()
      $('[data-toggle="tooltip"]').tooltip()
    }, 100)
  }, [activityNotes])

  return (
    <div>
      {!error && !activityNotes && <LoadingSpinner />}

      {error && <ErrorAlert error={error} />}

      <BaseActivityList
        notes={activityNotes}
        emptyMessage="No recent activity to display."
        showGroup={false}
        showActionButtons
      />
    </div>
  )
}
