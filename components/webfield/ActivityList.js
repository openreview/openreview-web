/* globals $: false */
/* globals typesetMathJax: false */

import { useState, useEffect } from 'react'
import LoadingSpinner from '../LoadingSpinner'
import ErrorAlert from '../ErrorAlert'
import BaseActivityList from '../BaseActivityList'
import api from '../../lib/api-client'

export default function ActivityList({
  venueId,
  apiVersion,
  invitation,
  pageSize,
  shouldReload,
  user,
}) {
  const [activityNotes, setActivityNotes] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadActivityNotes = () =>
      api
        .get('/notes', {
          invitation: invitation || `${venueId}/.*`,
          details: 'forumContent,invitation,writable',
          sort: 'tmdate:desc',
          limit: pageSize || 50,
        })
        .then(({ notes }) => {
          setActivityNotes(notes?.length > 0 ? notes : [])
        })
        .catch((apiError) => {
          setActivityNotes([])
          setError(apiError)
        })

    const loadActivityEdits = () =>
      api
        .get(
          '/notes/edits',
          {
            domain: venueId,
            trash: true,
            details: 'writable,invitation',
            sort: 'tmdate:desc',
            limit: pageSize || 25,
          },
          { version: apiVersion }
        )
        .then(({ edits }) => {
          setActivityNotes(
            edits?.length > 0 ? edits.map((edit) => ({ ...edit, apiVersion: 2 })) : []
          )
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
  }, [user, shouldReload])

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
