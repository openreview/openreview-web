/* globals $: false */
/* globals Webfield, Webfield2: false */
/* globals typesetMathJax: false */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import BaseActivityList from '../components/BaseActivityList'
import useLoginRedirect from '../hooks/useLoginRedirect'
import api from '../lib/api-client'

const Activity = ({ appContext }) => {
  const { user, accessToken } = useLoginRedirect()
  const [activityNotes, setActivityNotes] = useState(null)
  const [error, setError] = useState(null)
  const { setBannerHidden } = appContext

  const loadActivityData = async () => {
    const queryParamV1 = {
      tauthor: true,
      trash: true,
      details: 'forumContent,writable,invitation',
      sort: 'tmdate:desc',
      limit: 100,
    }
    const queryParamV2 = {
      tauthor: true,
      trash: true,
      details: 'writable,invitation',
      sort: 'tmdate:desc',
      limit: 100,
    }

    Promise.all([
      api.get('/notes', queryParamV1, { accessToken }).then(
        ({ notes }) => (notes?.length > 0 ? notes : []),
        () => []
      ),
      api
        .get('/notes/edits', queryParamV2, { accessToken, version: 2 })
        .then(
          ({ edits }) => (edits?.length > 0 ? edits : []),
          () => []
        )
        .then((edits) => edits.map((edit) => ({ ...edit, apiVersion: 2 }))),
    ])
      .then(([notes, edits]) => {
        setActivityNotes(notes.concat(edits).sort((a, b) => b.tmdate - a.tmdate))
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
