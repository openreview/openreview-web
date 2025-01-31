import { redirect } from 'next/navigation'
import { Suspense } from 'react'
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
  const { token: accessToken } = await serverAuth()
  if (!accessToken) redirect('/login?redirect=/profile/edit')

  const loadProfileP = api
    .get('/profiles', {}, { accessToken })
    .then(({ profiles }) => {
      if (profiles?.length > 0) {
        const formattedProfile = formatProfileData(profiles[0], true)
        return { profile: formattedProfile }
      }
      return { errorMessage: 'Profile not found' }
    })
    .catch((error) => ({ errorMessage: error.message }))

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
