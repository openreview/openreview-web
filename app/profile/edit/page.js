import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import LimitedStateAlert from './LimitedStateAlert'
import serverAuth from '../../auth'
import api from '../../../lib/api-client'
import { formatProfileData } from '../../../lib/profiles'
import Edit from './Edit'
import LoadingSpinner from '../../../components/LoadingSpinner'
import styles from './Edit.module.scss'
import CommonLayout from '../../CommonLayout'

export const metadata = {
  title: 'Edit Profile | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page() {
  const { token: accessToken, user } = await serverAuth()
  if (!accessToken) redirect('/login?redirect=/profile/edit')

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const loadProfileP = api
    .get('/profiles', {}, { accessToken, remoteIpAddress })
    .then(({ profiles }) => {
      if (profiles?.length > 0) {
        const formattedProfile = formatProfileData(profiles[0], true)
        return { profile: formattedProfile }
      }
      return { errorMessage: 'Profile not found' }
    })
    .catch((error) => {
      console.log('Error in loadProfileP', {
        page: 'profile/edit',
        user: user?.id,
        apiError: error,
        apiRequest: {
          endpoint: '/profiles',
        },
      })
      return { errorMessage: error.message }
    })

  return (
    <CommonLayout banner={null}>
      <div className={styles.edit}>
        <Suspense>
          <LimitedStateAlert loadProfileP={loadProfileP} />
        </Suspense>
        <header>
          <h1>Edit Profile</h1>
        </header>
        <Suspense fallback={<LoadingSpinner />}>
          <Edit loadProfileP={loadProfileP} accessToken={accessToken} />
        </Suspense>
      </div>
    </CommonLayout>
  )
}
