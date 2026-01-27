import { useEffect, useState } from 'react'
import { clientAuth } from '../lib/clientAuth'

export default function useUser() {
  const [user, setUser] = useState(null)
  const [isRefreshing, setIsRefshing] = useState(true)

  const fetchData = async () => {
    const { user: userFromCookie } = await clientAuth()
    setUser(userFromCookie)
    setIsRefshing(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { user, isRefreshing }
}
