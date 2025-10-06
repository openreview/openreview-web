'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'
import { intersection } from 'lodash'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import styles from './Tasks.module.scss'
import { formatTasksData } from '../../lib/utils'
import useUser from '../../hooks/useUser'
import ErrorAlert from '../../components/ErrorAlert'
import Accordion from '../../components/Accordion'
import HeadingLink from './HeadingLink'
import TaskList from '../../components/TaskList'

export default function Page() {
  const { accessToken, isRefreshing } = useUser()
  const router = useRouter()
  const [domainTasksMap, setDomainTasksMap] = useState(new Map())
  const [domainTypeMap, setDomainTypeMap] = useState(null)
  const [error, setError] = useState(null)

  const addPropertyToInvitations = (propertyName) => (apiRes) =>
    apiRes.invitations.map((inv) => ({ ...inv, [propertyName]: true }))

  const loadGroupTasks = async (domain, types) => {
    if (domainTasksMap.has(domain)) return
    const commonParams = {
      invitee: true,
      duedate: true,
      details: 'repliedTags',
      domain,
    }
    const invitationPromises = [
      types.includes('note')
        ? api
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
            .then(addPropertyToInvitations('noteInvitation'))
        : Promise.resolve([]),
      types.includes('tag')
        ? api
            .get('/invitations', { ...commonParams, type: 'tag' }, { accessToken })
            .then(addPropertyToInvitations('tagInvitation'))
        : Promise.resolve([]),
      types.includes('edge')
        ? api
            .get(
              '/invitations',
              { ...commonParams, type: 'edge', details: 'repliedEdges' },
              { accessToken }
            )
            .then(addPropertyToInvitations('tagInvitation'))
        : Promise.resolve([]),
    ]
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
        const formattedTasksData = formatTasksData(allInvitations)
        setDomainTasksMap((tasks) => {
          const updatedTasks = new Map(tasks)
          updatedTasks.set(domain, Object.values(formattedTasksData)[0])
          return updatedTasks
        })
      })
      .catch((apiError) => setError(apiError))
  }

  const loadDomains = async () => {
    const invitationPromises = [
      api
        .get(
          '/invitations',
          {
            replyto: true,
            invitee: true,
            duedate: true,
            select: 'domain,invitees',
            type: 'note',
          },
          { accessToken }
        )
        .then((result) => result.invitations),
      api
        .get(
          '/invitations',
          {
            invitee: true,
            duedate: true,
            select: 'domain,invitees',
            type: 'tag',
          },
          { accessToken }
        )
        .then((result) => result.invitations),
      api
        .get(
          '/invitations',
          {
            invitee: true,
            duedate: true,
            select: 'domain,invitees',
            type: 'edge',
          },
          { accessToken }
        )
        .then((result) => result.invitations),
    ]
    const domainResult = await Promise.all(invitationPromises).catch((apiError) =>
      setError(apiError)
    )

    const uniqueDomainsTypeMap = new Map()
    const processDomainResults = (invitations, type) => {
      invitations.forEach((inv) => {
        if (
          !inv.domain ||
          intersection(['everyone', '~', '(guest)', '(anonymous)'], inv.invitees).length !== 0
        ) {
          return
        }
        if (uniqueDomainsTypeMap.has(inv.domain)) {
          const existingTypes = uniqueDomainsTypeMap.get(inv.domain)
          if (existingTypes.includes(type)) return
          existingTypes.push(type)
          uniqueDomainsTypeMap.set(inv.domain, existingTypes)
        } else {
          uniqueDomainsTypeMap.set(inv.domain, [type])
        }
      })
    }
    domainResult.forEach((invitations, index) => {
      const type = ['note', 'tag', 'edge'][index]
      processDomainResults(invitations, type)
    })

    setDomainTypeMap(uniqueDomainsTypeMap)
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!accessToken) {
      router.push('/login?redirect=/tasks')
      return
    }
    loadDomains()
  }, [isRefreshing])

  if (!domainTypeMap) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />

  if (!domainTypeMap.size)
    return <p className="empty-message">No current pending or completed tasks</p>
  return (
    <div className={styles.tasks}>
      <div className="tasks-container">
        <Accordion
          sections={Array.from(domainTypeMap.entries()).map(([domain, types]) => ({
            domain,
            heading: (
              <HeadingLink
                groupId={domain}
                groupInfo={domainTasksMap.get(domain)}
                loadTasksForDomain={() => loadGroupTasks(domain, types)}
              />
            ),
            body: domainTasksMap.has(domain) ? (
              <TaskList invitations={domainTasksMap.get(domain)?.invitations} />
            ) : (
              <LoadingSpinner inline text={null} />
            ),
          }))}
          options={{
            id: 'tasks',
            collapsed: true,
            html: false,
            bodyContainer: '',
            onExpand: loadGroupTasks,
          }}
        />
      </div>
    </div>
  )
}
