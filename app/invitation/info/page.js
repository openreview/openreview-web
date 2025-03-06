import { stringify } from 'query-string'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'
import serverAuth from '../../auth'
import LoadingSpinner from '../../../components/LoadingSpinner'
import InvitationInfo from './InvitationInfo'
import ErrorDisplay from '../../../components/ErrorDisplay'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `${prettyId(id)} Invitation Info | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { token: accessToken, user } = await serverAuth()
  const { id } = query
  if (!id) return <ErrorDisplay message="Missing required parameter id" />

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  let redirectPath = null
  const loadInvitationP = api
    .getInvitationById(id, accessToken, null, null, remoteIpAddress)
    .then((invitationObj) => {
      if (invitationObj) {
        return {
          invitation: {
            ...invitationObj,
            web: null,
            process: null,
            preprocess: null,
          },
        }
      }
      throw new Error('Invitation not found')
    })
    .catch((error) => {
      console.log('Error in get loadInvitationP', {
        page: 'invitation/info',
        user: user?.id,
        apiError: error,
        apiRequest: {
          params: { id },
        },
      })
      if (error.name === 'ForbiddenError') {
        if (!accessToken) {
          redirectPath = `/login?redirect=/invitation/info?${encodeURIComponent(stringify(query))}}`
        } else {
          return { errorMessage: "You don't have permission to read this invitation" }
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
      <InvitationInfo loadInvitationP={loadInvitationP} accessToken={accessToken} />
    </Suspense>
  )
}
