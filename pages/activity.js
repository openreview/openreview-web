/* globals $: false */
/* globals Webfield: false */

import {
  useState, useEffect, useContext, useRef,
} from 'react'
import Head from 'next/head'
import UserContext from '../components/UserContext'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../lib/api-client'

function Activity({ appContext }) {
  const [activityNotes, setActivityNotes] = useState(null)
  const [error, setError] = useState(null)
  const { user, accessToken } = useContext(UserContext)
  const activityRef = useRef(null)
  const { setBannerHidden, clientJsLoading } = appContext

  const loadActivityData = async () => {
    try {
      const apiRes = await api.get('/notes', {
        tauthor: true,
        trash: true,
        details: 'forumContent,writable,invitation',
        limit: 1000,
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

    if (!window.MathJax) {
      // eslint-disable-next-line global-require
      window.MathJax = require('../lib/mathjax-config')
      // eslint-disable-next-line global-require
      require('mathjax/es5/tex-chtml')
    }

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
      <div ref={activityRef} />
    </div>
  )
}

Activity.bodyClass = 'activity'

export default Activity
