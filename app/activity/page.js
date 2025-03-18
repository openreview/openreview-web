import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import serverAuth from '../auth'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import Activity from './Activity'
import styles from './Activity.module.scss'

export const metadata = {
  title: 'Activity | OpenReview',
}

export default async function page() {
  const { token } = await serverAuth()
  if (!token) redirect('/login?redirect=/activity')

  return (
    <div className={styles.activity}>
      <Suspense fallback={<LoadingSpinner />}>
        <Activity />
      </Suspense>
    </div>
  )
}
