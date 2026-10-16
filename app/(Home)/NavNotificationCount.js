import { headers } from 'next/headers'
import { Suspense } from 'react'
import api from '../../lib/api-client'
import serverAuth, { isSuperUser } from '../auth'
import NotificationStatus from './NotificationStatus'

export default async function NavNotificationCount() {
  const { user, token } = await serverAuth()
  if (!user || isSuperUser(user)) {
    return null
  }
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')
  const preferredEmail = user.profile.preferredEmail
  const allEmails = [...new Set([preferredEmail, ...user.profile.emails].filter(Boolean))]

  const hasUnreadNotificationP = (async () => {
    for (const email of allEmails) {
      try {
        const { messages } = await api.get(
          '/messages',
          { to: email, viewed: false, limit: 1 },
          { accessToken: token, remoteIpAddress }
        )
        if (messages?.length) return true
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.log('Error in NavNotificationCount', {
          page: 'Home',
          component: 'NavNotificationCount',
          user: user?.id,
          apiError: error,
          apiRequest: {
            endpoint: '/messages',
            params: { to: email, viewed: false, limit: 1 },
          },
        })
      }
    }
    return false
  })()

  return (
    <Suspense fallback={null}>
      <NotificationStatus hasUnreadNotificationP={hasUnreadNotificationP} />
    </Suspense>
  )
}
