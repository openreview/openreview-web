import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import serverAuth from '../auth'
import styles from './Notifications.module.scss'
import Notifications from './Notifications'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'

export const metadata = {
  title: 'Notifications | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page() {
  const { token, user } = await serverAuth()
  if (!token) redirect('/login?redirect=/notifications')
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const profileResult = await api.get('/profiles', {}, { accessToken: token, remoteIpAddress })
  const { preferredEmail, emailsConfirmed } = profileResult?.profiles?.[0]?.content ?? {}
  const confirmedEmails = preferredEmail
    ? [preferredEmail, ...emailsConfirmed.filter((email) => email !== preferredEmail)]
    : emailsConfirmed
  const unviewedMessagesCountsP = Promise.all(
    confirmedEmails.map((email) =>
      api
        .get(
          '/messages',
          { to: email, viewed: false },
          { accessToken: token, remoteIpAddress }
        )
        .then((apiRes) => ({ email, count: apiRes.messages?.length ?? 0 }))
    )
  )
    .then((results) => ({
      count: results.reduce((prev, curr) => {
        // eslint-disable-next-line no-param-reassign
        prev[curr.email] = curr.count
        return prev
      }, {}),
    }))
    .catch((error) => {
      console.log('Error in unviewedMessagesCountsP', {
        page: 'notifications',
        user: user?.id,
        apiError: error,
        apiRequest: {
          endpoint: '/messages',
          params: {
            confirmedEmails,
          },
        },
      })
      return { errorMessage: error.message }
    })

  return (
    <div className={styles.notifications}>
      <Suspense fallback={<LoadingSpinner />}>
        <Notifications
          unviewedMessagesCountsP={unviewedMessagesCountsP}
          confirmedEmails={confirmedEmails}
          defaultToEmail={preferredEmail ?? confirmedEmails[0]}
        />
      </Suspense>
    </div>
  )
}
