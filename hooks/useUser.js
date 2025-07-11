import { useEffect, useRef, useState } from 'react'
import { clientAuth } from '../lib/clientAuth'

export default function useUser(pollToken = false) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isRefreshing, setIsRefshing] = useState(true)
  const tokenRef = useRef(null)

  const fetchData = async () => {
    const { user: userFromCookie, token: tokenFromCookie } = await clientAuth()
    setUser(userFromCookie)
    setToken(tokenFromCookie)
    setIsRefshing(false)
    tokenRef.current = tokenFromCookie
  }

  useEffect(() => {
    fetchData()
    let interval
    if (pollToken) {
      interval = setInterval(async () => {
        const { token: tokenFromCookie } = await clientAuth()
        if (tokenFromCookie !== tokenRef.current) {
          console.log('Token has changed, calling fetchData')
          fetchData()
        }
      }, 30000)
    }
    return () => {
      if (interval) interval(interval)
    }
  }, [])

  return { user, accessToken: token, isRefreshing }
}
