/* globals $: false */
/* globals Webfield: false */
/* globals typesetMathJax: false */
/* globals promptError: false */

import { useState, useEffect, useRef } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'

export default function ActivityList({ venueId, apiVersion, options = {} }) {
  const [activityNotes, setActivityNotes] = useState(null)
  const { user, accessToken, userLoading } = useUser()
  const containerRef = useRef(null)

  const opts = {
    invitation: `${venueId}/.*`,
    pageSize: 25,
    ...options,
  }

  useEffect(() => {
    if (userLoading) return

    api.get(
      '/notes',
      {
        invitation: opts.invitation,
        details: 'forumContent,invitation,writable',
        sort: 'tmdate:desc',
        limit: opts.pageSize,
      },
      { accessToken, version: apiVersion }
    )
      .then(({ notes }) => {
        if (notes?.length > 0) {
          setActivityNotes(notes)
        } else {
          setActivityNotes([])
        }
      })
      .catch((error) => {
        setActivityNotes([])
        promptError(error.message)
      })
  }, [userLoading, accessToken])

  useEffect(() => {
    if (!activityNotes) return

    $(containerRef.current).empty()

    Webfield.ui.activityList(activityNotes, {
      container: containerRef.current,
      emptyMessage: 'No recent activity to display.',
      user: user.profile,
      showActionButtons: true,
    })

    $('[data-toggle="tooltip"]').tooltip()

    typesetMathJax()
  }, [activityNotes])

  return <div ref={containerRef} />
}
