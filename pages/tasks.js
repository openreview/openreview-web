/* globals $: false */
/* globals Handlebars: false */

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'
import WebfieldContainer from '../components/WebfieldContainer'
import ErrorAlert from '../components/ErrorAlert'
import useLoginRedirect from '../hooks/useLoginRedirect'
import api from '../lib/api-client'
import { formatTasksData } from '../lib/utils'

const Tasks = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const [groupedTasks, setGroupedTasks] = useState(null)
  const [error, setError] = useState(null)
  const tasksRef = useRef(null)
  const { setBannerHidden } = appContext

  const registerEventHandlers = () => {
    $('[data-toggle="tooltip"]').tooltip()

    const toggleLinkText = ($elem) => {
      const $span = $elem.find('span')
      if ($span.text() === 'Show') {
        $span.text('Hide')
      } else {
        $span.text('Show')
      }
    }

    $('a.collapse-btn').on('click', function onClick(e) {
      $(this).toggleClass('active')
      $(this).closest('li').find('.submissions-list').slideToggle()
      toggleLinkText($(this).parent().next('a.show-tasks'))
      return false
    })

    $('a.show-tasks').on('click', function onClick(e) {
      $(this).closest('li').find('a.collapse-btn').toggleClass('active')
      $(this).next('.submissions-list').slideToggle()
      toggleLinkText($(this))
      return false
    })
  }

  useEffect(() => {
    if (!accessToken) return

    setBannerHidden(true)

    const addPropertyToInvitations = (propertyName) => (apiRes) =>
      apiRes.invitations.map((inv) => ({ ...inv, [propertyName]: true }))

    const commonParams = {
      invitee: true,
      duedate: true,
      details: 'repliedTags',
      version: 1, // version:1 works only for v2 calls, added here for simplicity
    }
    const commonOptions = { accessToken, cache: false }

    const invitationPromises = [
      api.getCombined(
        '/invitations',
        { ...commonParams, replyto: true, details: 'replytoNote,repliedNotes' },
        null,
        commonOptions
      ).then(addPropertyToInvitations('noteInvitation')),
      api.getCombined(
        '/invitations',
        { ...commonParams, type: 'tags' },
        null,
        commonOptions
      ).then(addPropertyToInvitations('tagInvitation')),
      api.getCombined(
        '/invitations',
        { ...commonParams, type: 'edges', details: 'repliedEdges' },
        null,
        commonOptions
      ).then(addPropertyToInvitations('tagInvitation')),
    ]

    Promise.all(invitationPromises)
      .then((allInvitations) => setGroupedTasks(formatTasksData(allInvitations)))
      .catch((apiError) => setError(apiError))
  }, [accessToken])

  useEffect(() => {
    if (!groupedTasks) return

    const taskOptions = {
      showTasks: true,
      pdfLink: true,
      htmlLink: true,
      replyCount: true,
      showContents: true,
      collapsed: true,
      referrer: encodeURIComponent('[Tasks](/tasks)'),
      emptyMessage: 'No current pending or completed tasks',
    }
    $(tasksRef.current)
      .empty()
      .append(
        Handlebars.templates.groupedTaskList({ groupedInvitations: groupedTasks, taskOptions })
      )

    registerEventHandlers()
  }, [groupedTasks])

  return (
    <div className="tasks-container">
      <Head>
        <title key="title">Tasks | OpenReview</title>
      </Head>

      <header>
        <h1>Tasks</h1>
      </header>

      {!error && !groupedTasks && <LoadingSpinner />}
      {error && <ErrorAlert error={error} />}
      <WebfieldContainer ref={tasksRef} />
    </div>
  )
}

Tasks.bodyClass = 'tasks'

export default Tasks
