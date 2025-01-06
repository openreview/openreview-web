import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import Activate from './Activate'
import { formatProfileData } from '../../../lib/profiles'

export const metadata = {
  title: 'Complete Registration | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page({ searchParams }) {
  const { token } = await searchParams
  if (!token) redirect('/')

  const loadActivatableProfileP = api.get(`/activatable/${token}`).then((apiRes) => {
    if (apiRes.activatable?.action !== 'activate') {
      throw new Error(
        'Invalid profile activation link. Please check your email and try again.'
      )
    }
    return formatProfileData(apiRes.profile, true)
  })
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Activate loadActivatableProfileP={loadActivatableProfileP} activateToken={token} />
    </Suspense>
  )
}
