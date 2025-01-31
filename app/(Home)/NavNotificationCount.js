//#region client rendered
// 'use client'

// import { useSelector } from 'react-redux'
// import { Suspense, use, useEffect, useState } from 'react'
// import api from '../../lib/api-client'

// export default async function NavNotificationCount() {
//   const { token, user } = useSelector((state) => state.root)
//   const [count, setCount] = useState(0)

//   const getMessages = async (userEmail, accessToken) => {
//     try {
//       const result = await api.get(
//         '/messages',
//         { to: userEmail, viewed: false, transitiveMembers: true },
//         { accessToken }
//       )
//       setCount(result.count)
//     } catch (error) {
//       console.log('error is', error)
//     }
//   }

//   useEffect(() => {
//     if (!user) return
//     getMessages(user.profile.emails[0], token)
//   }, [user])

//   if (!user) {
//     return null
//   }

//   if (count === 0) return null
//   return <span className="badge">{count}</span>
// }
//#endregion

import { Suspense } from 'react'
import api from '../../lib/api-client'
import serverAuth, { isSuperUser } from '../auth'
import NotificationCount from './NotificationCount'

export const dynamic = 'force-dynamic'

export default async function NavNotificationCount() {
  const { user, token } = await serverAuth()
  if (!user || isSuperUser(user)) {
    return null
  }
  const notificationCountP = api
    .get(
      '/messages',
      { to: user.profile.emails[0], viewed: false, transitiveMembers: true },
      { accessToken: token }
    )
    .then((response) => {
      const count = response.messages?.length
      return { count: count ?? 0 }
    })
    .catch(() => Promise.resolve({ count: 0 }))

  return (
    <Suspense fallback={null}>
      <NotificationCount notificationCountP={notificationCountP} />
    </Suspense>
  )
}
