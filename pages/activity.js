/* globals $: false */
/* globals Webfield, Webfield2: false */
/* globals typesetMathJax: false */

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import BaseActivityList from '../components/BaseActivityList'
import ActivityList from '../components/webfield/ActivityList'
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
      limit: 200,
    }
    const queryParamV2 = {
      signature: user.profile.id,
      trash: true,
      details: 'forumContent,writable,invitation,presentation',
      limit: 200,
    }
    try {
      const { notes } = await api.getCombined('/notes', queryParamV1, queryParamV2, {
        accessToken,
        sort: 'tmdate:desc',
      })
      setActivityNotes(notes)
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    if (!accessToken) return

    setBannerHidden(true)

    loadActivityData()
  }, [accessToken])

  useEffect(() => {
    if (!activityNotes) return

    $('[data-toggle="tooltip"]').tooltip()
    typesetMathJax()
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

      <div className="row">
        <div className="col-sm-12 col-md-6">
          <ActivityList venueId="thecvf.com/ECCV/2020/Conference" apiVersion={1} />
        </div>
        <div className="col-sm-12 col-md-6">
          <BaseActivityList
            notes={activityNotes}
            emptyMessage="No recent activity to display."
            showActionButtons
            showGroup
          />
        </div>
      </div>
    </div>
  )
}

Activity.bodyClass = 'activity'

export default Activity
