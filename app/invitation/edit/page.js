import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'
import serverAuth from '../../auth'
import LoadingSpinner from '../../../components/LoadingSpinner'
import InvitationEditor from './InvitationEditor'
import ErrorDisplay from '../../../components/ErrorDisplay'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `Edit ${prettyId(id)} Invitation | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { id } = query

  if (!id) return <ErrorDisplay error="Missing required parameter id" />

  const { token: accessToken, user } = await serverAuth()

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  let redirectPath = null
  const loadInvitationP = api
    .getInvitationById(
      id,
      accessToken,
      { details: 'writable,writableWith', expired: true, trash: true },
      { details: 'writable', expired: true },
      remoteIpAddress
    )
    // eslint-disable-next-line consistent-return
    .then((invitationObj) => {
      if (!invitationObj) throw new Error('Invitation not found')

      if (invitationObj.details?.writable) {
        return { invitation: invitationObj }
      }
      if (!accessToken) {
        redirectPath = `/login?redirect=/invitation/edit?${encodeURIComponent(stringify(query))}`
      } else {
        // User is a reader, not a writer of the group, so redirect to info mode
        redirectPath = `/invitation/info?id=${id}`
      }
    })
    .catch((apiError) => {
      console.log('Error in get loadInvitationP', {
        page: 'invitation/edit',
        user: user?.id,
        apiError,
        apiRequest: {
          params: { id },
        },
      })
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          redirectPath = `/login?redirect=/invitation/edit?${encodeURIComponent(stringify(query))}`
        } else {
          return { errorMessage: "You don't have permission to read this invitation" }
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
      <InvitationEditor
        loadInvitationP={loadInvitationP}
        user={user}
        accessToken={accessToken}
      />
    </Suspense>
  )
}
