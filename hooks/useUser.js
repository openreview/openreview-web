import { useEffect, useState } from 'react'
import api from '../lib/api-client'
import { clientAuth } from '../lib/clientAuth'

export default function useUser(getFullProfile = false) {
  const [user, setUser] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(true)

  const getProfile = async (userProfileId) => {
    try {
      const profileResult = await api.get('/profiles', { id: userProfileId })
      return profileResult?.profiles?.[0]
    } catch (_) {
      return null
    }
  }

  const fetchData = async () => {
    const { user: userFromCookie } = await clientAuth()
    if (!userFromCookie?.profile?.id) {
      setUser(null)
      setIsRefreshing(false)
      return
    }
    if (getFullProfile) {
      const fullProfile = await getProfile(userFromCookie.profile.id)
      if (fullProfile) {
        const preferedNameObj =
          fullProfile.content.names?.find((p) => p.preferred) ?? fullProfile.content.names?.[0]
        setUser({
          ...userFromCookie,
          profile: {
            ...userFromCookie.profile,
            id: fullProfile.id,
            preferredId: preferedNameObj?.username ?? fullProfile.id,
            preferredName: preferedNameObj?.fullname ?? userFromCookie.profile.fullname,
            preferredEmail:
              fullProfile.content.preferredEmail ?? fullProfile.content.emails?.[0],
          },
          memberIds: [
            ...(fullProfile.content.emailsConfirmed ?? []),
            ...fullProfile.content.names.flatMap((p) => p.username ?? []),
          ],
        })
        setIsRefreshing(false)
        return
      }
      setUser({
        ...userFromCookie,
        memberIds: [...(userFromCookie.profile.usernames ?? []), userFromCookie.id],
      })
      setIsRefreshing(false)
      return
    }
    setUser(userFromCookie)
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchData()
  }, [getFullProfile])

  return { user, isRefreshing }
}
