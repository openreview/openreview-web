import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LimitedStateAlert from './LimitedStateAlert'
import serverAuth from '../../auth'
import api from '../../../lib/api-client'
import { formatProfileData } from '../../../lib/profiles'
import Edit from './Edit'
import LoadingSpinner from '../../../components/LoadingSpinner'
import styles from './Edit.module.scss'

export const metadata = {
  title: 'Edit Profile | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page() {
  const { token: accessToken } = await serverAuth()
  if (!accessToken) redirect('/login?redirect=/profile/edit')

  const loadProfileP = api.get('/profiles', {}, { accessToken }).then(({ profiles }) => {
    if (profiles?.length > 0) {
      const formattedProfile = formatProfileData(profiles[0], true)
      return formattedProfile
    }
    throw new Error('Profile not found')
  })

  return (
    <div className={styles.edit}>
      <LimitedStateAlert loadProfileP={loadProfileP} />
      <header>
        <h1>Edit Profile</h1>
      </header>
      <Suspense fallback={<LoadingSpinner />}>
        <Edit loadProfileP={loadProfileP} accessToken={accessToken} />
      </Suspense>
    </div>
  )
}
