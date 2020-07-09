/* globals $: false */
/* globals Webfield: false */

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { auth } from '../lib/auth'
import api from '../lib/api-client'

import '../styles/pages/activity.less'

const Activity = ({ user, accessToken, appContext }) => {
  const [activityNotes, setActivityNotes] = useState(null)
  const [error, setError] = useState(null)
  const activityRef = useRef(null)
  const { setBannerHidden, clientJsLoading } = appContext

  const loadActivityData = async () => {
    try {
      const apiRes = await api.get('/notes', {
        tauthor: true,
        trash: true,
        details: 'forumContent,writable,invitation',
        limit: 200,
      }, { accessToken })
      setActivityNotes(apiRes.notes)
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    setBannerHidden(true)

    loadActivityData()
  }, [])

  useEffect(() => {
    if (clientJsLoading || !activityNotes) return

    $(activityRef.current).empty()
    Webfield.ui.activityList(activityNotes, {
      container: activityRef.current,
      emptyMessage: 'No recent activity to display.',
      user: user.profile,
      showActionButtons: true,
    })

    $('[data-toggle="tooltip"]').tooltip()
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
      <div ref={activityRef} />
    </div>
  )
}

Activity.getInitialProps = (ctx) => {
  const { user, token } = auth(ctx)
  if (!user) {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: '/login' }).end()
    } else {
      Router.replace('/login')
    }
  }
  return { user, accessToken: token }
}

Activity.bodyClass = 'activity'

export default Activity
