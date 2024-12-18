import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import serverAuth from '../auth'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import styles from './Tasks.module.scss'
import { formatTasksData } from '../../lib/utils'
import GroupedTaskList from './GroupedTaskList'

export const metadata = {
  title: 'Tasks | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page() {
  const { token } = await serverAuth()
  if (!token) redirect('/login?redirect=/tasks')

  const commonParams = {
    invitee: true,
    duedate: true,
    details: 'repliedTags',
  }
  const commonOptions = { accessToken: token, includeVersion: true }
  const addPropertyToInvitations = (propertyName) => (apiRes) =>
    apiRes.invitations.map((inv) => ({ ...inv, [propertyName]: true }))

  const invitationPromises = [
    api
      .getCombined(
        '/invitations',
        {
          ...commonParams,
          replyto: true,
          details: 'replytoNote,repliedNotes',
          type: 'notes',
        },
        {
          ...commonParams,
          replyto: true,
          details: 'replytoNote,repliedNotes,repliedEdits',
          type: 'note',
        },
        commonOptions
      )
      .then(addPropertyToInvitations('noteInvitation')),
    api
      .getCombined(
        '/invitations',
        { ...commonParams, type: 'tags' },
        { ...commonParams, type: 'tag' },
        commonOptions
      )
      .then(addPropertyToInvitations('tagInvitation')),
    api
      .getCombined(
        '/invitations',
        { ...commonParams, type: 'edges', details: 'repliedEdges' },
        { ...commonParams, type: 'edge', details: 'repliedEdges' },
        commonOptions
      )
      .then(addPropertyToInvitations('tagInvitation')),
  ]

  const allInvitations = await Promise.all(invitationPromises)
  const aERecommendationInvitations = allInvitations[2].filter((p) =>
    p.id.endsWith('/Action_Editors/-/Recommendation')
  )
  const aERecommendationEdgesP = aERecommendationInvitations.map((p) =>
    api
      .get('/edges', {
        invitation: `${p.domain}/Action_Editors/-/Recommendation`,
        groupBy: 'head',
      })
      .then((result) => result.groupedEdges)
  )
  const edgeResults = await Promise.all(aERecommendationEdgesP)
  // eslint-disable-next-line no-param-reassign
  allInvitations[2] = allInvitations[2].map((p, i) => {
    if (!p.id.endsWith('/Action_Editors/-/Recommendation')) return p
    const submissionId = p.edge?.head?.param?.const
    const aERecommendationEdges = edgeResults.flatMap((q) => {
      const edges = q.find((r) => r.id?.head === submissionId)
      return edges ? edges.values : []
    })
    return {
      ...p,
      details: {
        ...p.details,
        repliedEdges: aERecommendationEdges,
      },
    }
  })
  const groupedTasks = formatTasksData(allInvitations)

  return (
    <div className={styles.tasks}>
      <Suspense fallback={<LoadingSpinner />}>
        {Object.keys(groupedTasks).length ? (
          <GroupedTaskList groupedTasks={groupedTasks} />
        ) : (
          <p className="empty-message">No current pending or completed tasks</p>
        )}
      </Suspense>
    </div>
  )
}
