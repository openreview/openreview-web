import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { Suspense } from 'react'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'
import serverAuth, { isSuperUser } from '../../auth'
import LoadingSpinner from '../../../components/LoadingSpinner'
import InvitationEditor from './InvitationEditor'

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

  if (!id) throw new Error('Missing required parameter id')

  const { token: accessToken, user } = await serverAuth()

  let redirectPath = null
  const loadInvitationP = api
    .getInvitationById(
      id,
      accessToken,
      { details: 'writable,writableWith', expired: true },
      { details: 'writable', expired: true }
    )
    // eslint-disable-next-line consistent-return
    .then((invitationObj) => {
      if (!invitationObj) throw new Error('Invitation not found')

      if (invitationObj.details?.writable) {
        return invitationObj
      }
      if (!accessToken) {
        redirectPath = `/login?redirect=/invitation/edit?${encodeURIComponent(stringify(query))}`
      } else {
        // User is a reader, not a writer of the group, so redirect to info mode
        redirectPath = `/invitation/info?id=${id}`
      }
    })
    .catch((apiError) => {
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          redirectPath = `/login?redirect=/invitation/edit?${encodeURIComponent(stringify(query))}`
        } else {
          throw new Error("You don't have permission to read this invitation")
        }
      }
      throw new Error(apiError.message)
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
