'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import styles from './Tasks.module.scss'
import { formatTasksData } from '../../lib/utils'
import GroupedTaskList from './GroupedTaskList'
import useUser from '../../hooks/useUser'
import ErrorAlert from '../../components/ErrorAlert'

export default function Page() {
  const { accessToken, isRefreshing } = useUser()
  const router = useRouter()
  const [groupedTasks, setGroupedTasks] = useState(null)
  const [error, setError] = useState(null)

  const addPropertyToInvitations = (propertyName) => (apiRes) =>
    apiRes.invitations.map((inv) => ({ ...inv, [propertyName]: true }))

  const commonParams = {
    invitee: true,
    duedate: true,
    details: 'repliedTags',
  }

  const invitationPromises = [
    api
      .get(
        '/invitations',
        {
          ...commonParams,
          replyto: true,
          details: 'replytoNote,repliedNotes,repliedEdits',
          type: 'note',
        },
        { accessToken }
      )
      .then(addPropertyToInvitations('noteInvitation')),
    api
      .get('/invitations', { ...commonParams, type: 'tag' }, { accessToken })
      .then(addPropertyToInvitations('tagInvitation')),
    api
      .get(
        '/invitations',
        { ...commonParams, type: 'edge', details: 'repliedEdges' },
        { accessToken }
      )
      .then(addPropertyToInvitations('tagInvitation')),
  ]

  const loadGroupTasks = async () => {
    await Promise.all(invitationPromises)
      .then(async (allInvitations) => {
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
        setGroupedTasks(formatTasksData(allInvitations))
      })
      .catch((apiError) => setError(apiError))
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!accessToken) {
      router.push('/login?redirect=/tasks')
      return
    }
    loadGroupTasks()
  }, [isRefreshing])

  if (!groupedTasks) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />

  return (
    <div className={styles.tasks}>
      <GroupedTaskList groupedTasks={groupedTasks} />
    </div>
  )
}
