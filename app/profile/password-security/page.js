'use client'

/* globals promptError: false */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../../lib/api-client'
import { formatProfileData } from '../../../lib/profiles'
import useUser from '../../../hooks/useUser'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ProfilePasswordSecurity from './ProfilePasswordSecurity'

export default function Page() {
  const [profile, setProfile] = useState(null)
  const router = useRouter()
  const { user, isRefreshing } = useUser()

  const loadProfile = async () => {
    try {
      const { profiles } = await api.get('/profiles')
      if (profiles?.length > 0) {
        const formattedProfile = formatProfileData(profiles[0], { useLinkObjectFormat: true })
        setProfile(formattedProfile)
        return formattedProfile
      }
      promptError('Profile not found')
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!user) {
      router.replace('/login?redirect=/profile/password-security')
      return
    }
    loadProfile()
  }, [isRefreshing])

  if (!profile) return <LoadingSpinner />

  return (
    <div>
      <header>
        <h1>Password and Security</h1>
      </header>
      <ProfilePasswordSecurity profile={profile} />
    </div>
  )
}
