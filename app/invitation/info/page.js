import { stringify } from 'query-string'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'
import serverAuth from '../../auth'
import LoadingSpinner from '../../../components/LoadingSpinner'
import InvitationInfo from './InvitationInfo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `${prettyId(id)} Invitation Info | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { token: accessToken } = await serverAuth()
  const { id } = query
  if (!id) throw new Error('Missing required parameter id')

  let redirectPath = null
  const loadInvitationP = api
    .getInvitationById(id, accessToken)
    .then((invitationObj) => {
      if (invitationObj) {
        return {
          ...invitationObj,
          web: null,
          process: null,
          preprocess: null,
        }
      }
      throw new Error('Invitation not found')
    })
    .catch((error) => {
      if (error.name === 'ForbiddenError') {
        if (!accessToken) {
          redirectPath = `/login?redirect=/invitation/info?${encodeURIComponent(stringify(query))}}`
        } else {
          throw new Error("You don't have permission to read this invitation")
        }
      }
      throw new Error(error.message)
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
