import { useState, useEffect } from 'react'
import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import useLoginRedirect from '../hooks/useLoginRedirect'
import api from '../lib/api-client'
import { formatTasksData } from '../lib/utils'
import GroupedTaskList from '../components/GroupedTaskList'

const Tasks = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const [groupedTasks, setGroupedTasks] = useState(null)
  const [error, setError] = useState(null)
  const { setBannerHidden } = appContext

  useEffect(() => {
    if (!accessToken) return

    setBannerHidden(true)

    const addPropertyToInvitations = (propertyName) => (apiRes) =>
      apiRes.invitations.map((inv) => ({ ...inv, [propertyName]: true }))

    const commonParams = {
      invitee: true,
      duedate: true,
      details: 'repliedTags',
    }
    const commonOptions = { accessToken, includeVersion: true }

    const invitationPromises = [
      api
        .getCombined(
          '/invitations',
          { ...commonParams, replyto: true, details: 'replytoNote,repliedNotes' },
          { ...commonParams, replyto: true, details: 'replytoNote,repliedNotes,repliedEdits' },
          commonOptions
        )
        .then(addPropertyToInvitations('noteInvitation')),
      api
        .getCombined('/invitations', { ...commonParams, type: 'tags' }, null, commonOptions)
        .then(addPropertyToInvitations('tagInvitation')),
      api
        .getCombined(
          '/invitations',
          { ...commonParams, type: 'edges', details: 'repliedEdges' },
          null,
          commonOptions
        )
        .then(addPropertyToInvitations('tagInvitation')),
    ]

    Promise.all(invitationPromises)
      .then((allInvitations) => setGroupedTasks(formatTasksData(allInvitations)))
      .catch((apiError) => setError(apiError))
  }, [accessToken])

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
      {groupedTasks &&
        (Object.keys(groupedTasks).length ? (
          <GroupedTaskList groupedTasks={groupedTasks} />
        ) : (
          <p className="empty-message">No current pending or completed tasks</p>
        ))}
    </div>
  )
}

Tasks.bodyClass = 'tasks'

export default Tasks
