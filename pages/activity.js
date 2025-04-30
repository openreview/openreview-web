/* globals $: false */
/* globals typesetMathJax: false */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import BaseActivityList from '../components/BaseActivityList'
import useLoginRedirect from '../hooks/useLoginRedirect'
import api from '../lib/api-client'

const Activity = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const [activityNotes, setActivityNotes] = useState(null)
  const [error, setError] = useState(null)
  const { setBannerHidden } = appContext

  const loadActivityData = async () => {
    const queryParam = {
      tauthor: true,
      trash: true,
      details: 'writable,invitation',
      sort: 'tmdate:desc',
      limit: 100,
    }

    api
      .get('/notes/edits', queryParam, { accessToken })
      .then(
        ({ edits }) => (edits?.length > 0 ? edits : []),
        () => []
      )
      .then((edits) => {
        setActivityNotes(edits.sort((a, b) => b.tmdate - a.tmdate))
      })
      .catch((apiError) => {
        setError(apiError)
      })
  }

  useEffect(() => {
    if (!accessToken) return

    setBannerHidden(true)

    loadActivityData()
  }, [accessToken])

  useEffect(() => {
    if (!activityNotes) return

    setTimeout(() => {
      typesetMathJax()
      $('[data-toggle="tooltip"]').tooltip()
    }, 100)
  }, [activityNotes])

  return (
    <div className="activity-container">
      <Head>
        <title key="title">Activity | OpenReview</title>
      </Head>

      <header>
        <h1>Activity</h1>
      </header>

      {!error && !activityNotes && <LoadingSpinner />}

      {error && <ErrorAlert error={error} />}

      <BaseActivityList
        notes={activityNotes}
        emptyMessage="No recent activity to display."
        showActionButtons
        showGroup
      />
    </div>
  )
}

Activity.bodyClass = 'activity'

export default Activity
