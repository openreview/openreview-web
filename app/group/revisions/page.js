import { stringify } from 'query-string'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'
import serverAuth, { isSuperUser } from '../../auth'
import LoadingSpinner from '../../../components/LoadingSpinner'
import GroupRevisions from './GroupRevisions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `${prettyId(id)} Group Edit History | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { user, token: accessToken } = await serverAuth()
  const { id } = query

  let redirectPath = null
  const loadGroupP = api
    .get('/groups', { id }, { accessToken })
    .then((apiRes) => {
      if (apiRes.groups?.length > 0) {
        if (apiRes.groups[0].details?.writable) {
          const group = apiRes.groups[0]
          return { group }
        }
        if (!accessToken) {
          redirectPath = `/login?redirect=/group/revisions?${encodeURIComponent(stringify(query))}`
        } else {
          redirectPath = `/group/info?id=${id}`
        }
      } else {
        throw new Error('Group not found')
      }
      return null
    })
    .catch((error) => {
      console.log('Error in loadGroupP', {
        page: 'group/revisions',
        user: user?.id,
        apiError: error,
        apiRequest: {
          endpoint: '/groups',
          params: { id },
        },
      })
      if (error.name === 'ForbiddenError') {
        if (!accessToken) {
          redirectPath = `/login?redirect=/group/revisions?${encodeURIComponent(stringify(query))}`
          return null
        }
        return { errorMessage: "You don't have permission to read this group" }
      }
      return { errorMessage: error.message }
    })
    .finally(() => {
      if (redirectPath) {
        redirect(redirectPath)
      }
    })

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GroupRevisions
        loadGroupP={loadGroupP}
        accessToken={accessToken}
        isSuperUser={isSuperUser(user)}
      />
    </Suspense>
  )
}
