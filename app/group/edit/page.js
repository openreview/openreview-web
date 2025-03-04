import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'
import serverAuth, { isSuperUser } from '../../auth'
import GroupEditor from './GroupEditor'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ErrorDisplay from '../../../components/ErrorDisplay'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `Edit ${prettyId(id)} Group | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { id } = query

  if (!id) return <ErrorDisplay message="Missing required parameter id" />

  const { token: accessToken, user } = await serverAuth()
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  let redirectPath = null
  const loadGroupP = api
    .get('/groups', { id }, { accessToken, remoteIpAddress })
    // eslint-disable-next-line consistent-return
    .then((apiRes) => {
      const { groups } = apiRes
      if (!groups?.length) throw new Error('Group not found')

      const group = groups[0]
      if (group.details?.writable) {
        // Get venue group to pass to webfield component
        if (group.domain && group.domain !== group.id) {
          return api
            .get('/groups', { id: group.domain }, { accessToken, remoteIpAddress })
            .then((domainApiRes) => {
              const domainGroup = domainApiRes.groups?.length > 0 ? apiRes.groups[0] : null
              return {
                group: {
                  ...group,
                  details: { ...group.details, domain: domainGroup },
                },
              }
            })
            .catch((error) => {
              console.log('Error in get domain group', {
                page: 'group/edit',
                user: user?.id,
                apiError: error,
                apiRequest: {
                  endpoint: '/groups',
                  params: { id: group.domain },
                },
              })
              return { group }
            })
        }
        if (group.domain) {
          return {
            group: {
              ...group,
              details: { ...group.details, domain: group },
            },
          }
        }
        return { group }
      }
      if (!accessToken) {
        redirectPath = `/login?redirect=/group/edit?${encodeURIComponent(stringify(query))}`
      } else {
        // User is a reader, not a writer of the group, so redirect to info mode
        redirectPath = `/group/info?id=${id}`
      }
    })
    .catch((apiError) => {
      console.log('Error in loadGroupP', {
        page: 'group/edit',
        user: user?.id,
        apiError,
      })
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          redirectPath = `/login?redirect=/group/edit?${encodeURIComponent(stringify(query))}`
        } else {
          return { errorMessage: "You don't have permission to read this group" }
        }
      }
      return { errorMessage: apiError.message }
    })
    .finally(() => {
      if (redirectPath) {
        redirect(redirectPath)
      }
    })

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GroupEditor
        loadGroupP={loadGroupP}
        profileId={user?.profile?.id}
        accessToken={accessToken}
        isSuperUser={isSuperUser(user)}
      />
    </Suspense>
  )
}
