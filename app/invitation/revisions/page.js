import { stringify } from 'query-string'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'
import serverAuth, { isSuperUser } from '../../auth'
import LoadingSpinner from '../../../components/LoadingSpinner'
import InvitationRevisions from './InvitationRevisions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `${prettyId(id)} Invitation Edit History | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { user, token: accessToken } = await serverAuth()
  const { id } = query

  let redirectPath = null
  const loadInvitationP = api
    .get('/invitations', { id }, { accessToken })
    .then((apiRes) => {
      if (apiRes.invitations?.length > 0) {
        if (apiRes.invitations[0].details?.writable) {
          const invitation = apiRes.invitations[0]
          return { invitation }
        }
        if (!accessToken) {
          redirectPath = `/login?redirect=/invitation/revisions?${encodeURIComponent(stringify(query))}`
        } else {
          redirectPath = `/invitation/info?id=${id}`
        }
      } else {
        throw new Error('Invitation not found')
      }
      return null
    })
    .catch((error) => {
      console.log('Error in get loadInvitationP', {
        page: 'invitation/revisions',
        user: user?.id,
        apiError: error,
        apiRequest: {
          endpoint: '/invitations',
          params: { id },
        },
      })
      if (error.name === 'ForbiddenError') {
        if (!accessToken) {
          redirectPath = `/login?redirect=/invitation/revisions?${encodeURIComponent(stringify(query))}`
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
      <InvitationRevisions
        loadInvitationP={loadInvitationP}
        accessToken={accessToken}
        isSuperUser={isSuperUser(user)}
      />
    </Suspense>
  )
}
