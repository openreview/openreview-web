import { stringify } from 'query-string'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'
import serverAuth from '../../auth'
import GroupInfo from './GroupInfo'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ErrorDisplay from '../../../components/ErrorDisplay'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `${prettyId(id)} Group Info | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { token: accessToken } = await serverAuth()
  const { id } = query
  if (!id) return <ErrorDisplay message="Missing required parameter id" />

  let redirectPath = null
  const loadGroupP = api
    .get('/groups', { id }, { accessToken })
    .then((apiRes) => {
      if (apiRes.groups?.length > 0) {
        return { group: { ...apiRes.groups[0], web: null } }
      }
      throw new Error('Group not found')
    })
    .catch((error) => {
      if (error.name === 'ForbiddenError') {
        if (!accessToken) {
          redirectPath = `/login?redirect=/group/info?${encodeURIComponent(stringify(query))}}`
        } else {
          return { errorMessage: "You don't have permission to read this group" }
        }
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
      <GroupInfo loadGroupP={loadGroupP} accessToken={accessToken} />
    </Suspense>
  )
}
