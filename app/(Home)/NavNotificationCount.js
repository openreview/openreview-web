import { Suspense } from 'react'
import { headers } from 'next/headers'
import api from '../../lib/api-client'
import serverAuth, { isSuperUser } from '../auth'
import NotificationCount from './NotificationCount'

export default async function NavNotificationCount() {
  const { user, token } = await serverAuth()
  if (!user || isSuperUser(user)) {
    return null
  }
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const notificationCountP = api
    .get(
      '/messages',
      { to: user.profile.emails[0], viewed: false, transitiveMembers: true },
      { accessToken: token, remoteIpAddress }
    )
    .then((response) => {
      const count = response.messages?.length
      return { count: count ?? 0 }
    })
    .catch((error) => {
      console.log('Error in NavNotificationCount', {
        page: 'Home',
        component: 'NavNotificationCount',
        user: user?.id,
        apiError: error,
        apiRequest: {
          endpoint: '/messages',
          params: { to: user?.profile?.emails?.[0], viewed: false, transitiveMembers: true },
        },
      })
      return { count: 0 }
    })

  return (
    <Suspense fallback={null}>
      <NotificationCount notificationCountP={notificationCountP} />
    </Suspense>
  )
}
