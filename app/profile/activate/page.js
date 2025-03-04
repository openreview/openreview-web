import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import Activate from './Activate'
import { formatProfileData } from '../../../lib/profiles'
import serverAuth from '../../auth'

export const metadata = {
  title: 'Complete Registration | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page({ searchParams }) {
  const { token } = await searchParams
  const { user } = await serverAuth()

  const loadActivatableProfileP = token
    ? api
        .get(`/activatable/${token}`)
        .then((apiRes) => {
          if (apiRes.activatable?.action !== 'activate') {
            throw new Error(
              'Invalid profile activation link. Please check your email and try again.'
            )
          }
          return { profile: formatProfileData(apiRes.profile, true) }
        })
        .catch((error) => {
          console.log('Error in loadActivatableProfileP', {
            page: 'profile/activate',
            user: user?.id,
            apiError: error,
            apiRequest: {
              endpoint: `/activatable/${token}`,
            },
          })
          return { errorMessage: error.message }
        })
    : Promise.resolve({
        errorMessage:
          'Invalid profile activation link. Please check your email and try again.',
      })

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Activate loadActivatableProfileP={loadActivatableProfileP} activateToken={token} />
    </Suspense>
  )
}
