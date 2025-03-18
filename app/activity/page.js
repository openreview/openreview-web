import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { connection } from 'next/server'
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
  await connection()
  const { token } = await serverAuth()
  if (!token) redirect('/login?redirect=/activity')
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const activityDataP = api
    .get(
      '/notes/edits',
      {
        tauthor: true,
        trash: true,
        details: 'writable,invitation',
        sort: 'tmdate:desc',
        limit: 100,
      },
      { accessToken: token, remoteIpAddress }
    )
    .then((result) => {
      const edits = result.edits || []
      return {
        activityNotes: edits
          .map((edit) => ({ ...edit, apiVersion: 2 }))
          .sort((a, b) => b.tmdate - a.tmdate),
      }
    })
    .catch((error) => {
      console.log('Error in activityDataP', {
        page: 'activity',
        apiError: error,
        apiRequest: {
          endpoint: '/notes/edits',
          params: {
            tauthor: true,
            trash: true,
            details: 'writable,invitation',
            sort: 'tmdate:desc',
            limit: 100,
          },
        },
      })
      return { errorMessage: error.message }
    })

  return (
    <div className={styles.activity}>
      <Suspense fallback={<LoadingSpinner />}>
        <Activity activityDataP={activityDataP} />
      </Suspense>
    </div>
  )
}
