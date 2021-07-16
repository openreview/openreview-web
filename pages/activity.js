/* globals $: false */
/* globals Webfield: false */
/* globals typesetMathJax: false */

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'
import WebfieldContainer from '../components/WebfieldContainer'
import ErrorAlert from '../components/ErrorAlert'
import useLoginRedirect from '../hooks/useLoginRedirect'
import api from '../lib/api-client'

import '../styles/pages/activity.less'
import { apiV2MergeNotes } from '../lib/utils'

const Activity = ({ appContext }) => {
  const { user, accessToken } = useLoginRedirect()
  const [activityNotes, setActivityNotes] = useState(null)
  const [error, setError] = useState(null)
  const activityRef = useRef(null)
  const { setBannerHidden, clientJsLoading } = appContext

  const loadActivityData = async () => {
    const queryParam = {
      tauthor: true,
      trash: true,
      details: 'forumContent,writable,invitation',
      limit: 200,
    }
    let notes
    try {
      if (process.env.ENABLE_V2_API) {
        const v1NotesP = api.get('/notes', queryParam, { accessToken })
        const v2NotesP = api.getV2('/notes/edits', queryParam, { accessToken })
        const results = await Promise.all([v1NotesP, v2NotesP])
        // eslint-disable-next-line max-len
        notes = apiV2MergeNotes(results[0].notes, results[1].edits.map(p => ({ ...p.note, invitations: p.invitations })))
      } else {
        ({ notes } = await api.get('/notes', queryParam, { accessToken }))
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
    const activityList = process.env.ENABLE_V2_API ? Webfield.ui.activityListV2 : Webfield.ui.activityList
    activityList(activityNotes, {
      container: activityRef.current,
      emptyMessage: 'No recent activity to display.',
      user: user.profile,
      showActionButtons: false,
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
