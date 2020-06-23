/* globals $: false */
/* globals Handlebars: false */

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { auth } from '../lib/auth'
import api from '../lib/api-client'
import { formatTasksData } from '../lib/utils'

import '../styles/pages/tasks.less'

const Tasks = ({ accessToken, appContext }) => {
  const [groupedTasks, setGroupedTasks] = useState(null)
  const [error, setError] = useState(null)
  const tasksRef = useRef(null)
  const { setBannerHidden, clientJsLoading } = appContext

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

  const addPropertyToInvitations = propertyName => apiRes => (
    apiRes.invitations.map(inv => ({ ...inv, [propertyName]: true }))
  )

  useEffect(() => {
    if (clientJsLoading) return

    setBannerHidden(true)

    Promise.all([
      api.get('/invitations', {
        invitee: true, duedate: true, replyto: true, details: 'replytoNote,repliedNotes',
      }, { accessToken }).then(addPropertyToInvitations('noteInvitation')),
      api.get('/invitations', {
        invitee: true, duedate: true, type: 'tags', details: 'repliedTags',
      }, { accessToken }).then(addPropertyToInvitations('tagInvitation')),
      api.get('/invitations', {
        invitee: true, duedate: true, type: 'edges', details: 'repliedEdges',
      }, { accessToken }).then(addPropertyToInvitations('tagInvitation')),
    ])
      .then(allInvitations => setGroupedTasks(formatTasksData(allInvitations)))
      .catch(apiError => setError(apiError))
  }, [clientJsLoading])

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
    $(tasksRef.current).empty().append(
      Handlebars.templates.groupedTaskList({ groupedInvitations: groupedTasks, taskOptions }),
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

      {!error && !groupedTasks && (
        <LoadingSpinner />
      )}
      {error && (
        <ErrorAlert error={error} />
      )}
      <div ref={tasksRef} />
    </div>
  )
}

Tasks.getInitialProps = (ctx) => {
  const { user, token } = auth(ctx)
  if (!user) {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: '/login' }).end()
    } else {
      Router.replace('/login')
    }
  }
  return { accessToken: token }
}

Tasks.bodyClass = 'tasks'

export default Tasks
