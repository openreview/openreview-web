'use client'

import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'

export default function NavNotificationCount() {
  const { token, user } = useUser()
  const [count, setCount] = useState(0)

  const getMessages = async (userEmail, accessToken) => {
    try {
      const result = await api.get(
        '/messages',
        { to: userEmail, viewed: false, transitiveMembers: true },
        { accessToken }
      )
      setCount(result.count)
    } catch (error) {
      console.log('error is', error)
    }
  }

  useEffect(() => {
    if (!user) return
    getMessages(user.profile.emails[0], token)
  }, [user])

  if (!user) {
    return null
  }

  if (count === 0) return null
  return <span className="badge">{count}</span>
}
