import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import serverAuth from '../auth'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import Activity from './Activity'
import styles from './Activity.module.scss'

export const metadata = {
  title: 'Activity | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page() {
  const { token } = await serverAuth()
  if (!token) redirect('/login?redirect=/activity')

  const activityDataP = api
    .get(
      '/notes/editsd',
      {
        tauthor: true,
        trash: true,
        details: 'writable,invitation',
        sort: 'tmdate:desc',
        limit: 100,
      },
      { accessToken: token }
    )
    .then((result) => {
      const edits = result.edits || []
      return edits
        .map((edit) => ({ ...edit, apiVersion: 2 }))
        .sort((a, b) => b.tmdate - a.tmdate)
    })
    .then((edits) => edits.map((edit) => ({ ...edit, apiVersion: 2 })))
    .catch((error) => ({ errorMessage: error.message }))

  return (
    <div className={styles.activity}>
      <Suspense fallback={<LoadingSpinner />}>
        <Activity activityDataP={activityDataP} />
      </Suspense>
    </div>
  )
}
