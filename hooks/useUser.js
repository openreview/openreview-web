import { useEffect, useState } from 'react'
import { clientAuth } from '../lib/clientAuth'

export default function useUser() {
  const [user, setUser] = useState()
  const [token, setToken] = useState()
  const [isRefreshing, setIsRefshing] = useState(true)

  const fetchData = async () => {
    const { user: userFromCookie, token: tokenFromCookie } = await clientAuth()

    setUser(userFromCookie)
    setToken(tokenFromCookie)
    setIsRefshing(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { user, accessToken: token, isRefreshing }
}
