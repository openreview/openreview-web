/* globals $: false */
/* globals Webfield, Webfield2: false */
/* globals typesetMathJax: false */

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'
import WebfieldContainer from '../components/WebfieldContainer'
import ErrorAlert from '../components/ErrorAlert'
import useLoginRedirect from '../hooks/useLoginRedirect'
import api from '../lib/api-client'

import '../styles/pages/activity.less'

const Activity = ({ appContext }) => {
  const { user, accessToken } = useLoginRedirect()
  const [activityNotes, setActivityNotes] = useState(null)
  const [error, setError] = useState(null)
  const activityRef = useRef(null)
  const { setBannerHidden, clientJsLoading } = appContext

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
    let notes
    try {
      if (process.env.API_V2_URL) {
        ({ notes } = await api.getCombined({
          path: '/notes', data1: queryParamV1, data2: queryParamV2, options: { accessToken, sort: 'tmdate:desc' },
        }))
      } else {
        ({ notes } = await api.get('/notes', queryParamV1, { accessToken }))
      }

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
    if (clientJsLoading || !activityNotes) return

    $(activityRef.current).empty()
    const activityList = process.env.API_V2_URL ? Webfield2.ui.activityList : Webfield.ui.activityList
    activityList(activityNotes, {
      container: activityRef.current,
      emptyMessage: 'No recent activity to display.',
      user: user.profile,
      showActionButtons: true,
    })

    $('[data-toggle="tooltip"]').tooltip()

    typesetMathJax()
  }, [clientJsLoading, activityNotes])

  return (
    <div className="activity-container">
      <Head>
        <title key="title">Activity | OpenReview</title>
      </Head>

      <header>
        <h1>Activity</h1>
      </header>

      {!error && !activityNotes && (
        <LoadingSpinner />
      )}
      {error && (
        <ErrorAlert error={error} />
      )}
      <WebfieldContainer ref={activityRef} />
    </div>
  )
}

Activity.bodyClass = 'activity'

export default Activity
