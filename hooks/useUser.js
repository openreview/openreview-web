import { useEffect, useState } from 'react'
import { clientAuth } from '../lib/clientAuth'
import api from '../lib/api-client'

export default function useUser(getFullProfile = false) {
  const [user, setUser] = useState(null)
  const [isRefreshing, setIsRefshing] = useState(true)

  const getProfile = async () => {
    try {
      const profileResult = await api.get('/profiles')
      return profileResult?.profiles?.[0]
    } catch (_) {
      return null
    }
  }

  const fetchData = async () => {
    const { user: userFromCookie } = await clientAuth()
    if (userFromCookie.id && getFullProfile) {
      const fullProfile = await getProfile()
      if (fullProfile) {
        const preferedNameObj =
          fullProfile.content.names?.find((p) => p.preferred) ?? fullProfile.content.names?.[0]
        setUser({
          profile: {
            id: fullProfile.id,
            preferredId: preferedNameObj?.username ?? fullProfile.id,
            preferredName: preferedNameObj?.fullname ?? userFromCookie.profile.fullName,
            preferredEmail:
              fullProfile.content.preferredEmail ?? fullProfile.content.emails?.[0],
          },
        })
        setIsRefshing(false)
        return
      }
    }
    setUser(userFromCookie)
    setIsRefshing(false)
  }

  useEffect(() => {
    fetchData()
  }, [getFullProfile])

  return { user, isRefreshing }
}
