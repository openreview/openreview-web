/* globals promptError: false */

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import api from '../../lib/api-client'
import { formatProfileData } from '../../lib/profiles'
import LoadingSpinner from '../../components/LoadingSpinner'
import LegacyProfileEditor from '../../components/LegacyProfileEditor'

const CreateProfile = ({ appContext }) => {
  const { query, replace } = useRouter()
  const [profile, setProfile] = useState(null)

  const { setBannerHidden, clientJsLoading } = appContext

  const loadActivatableProfile = async (token) => {
    if (!token) return

    try {
      const { profile: newProfile, activatable } = await api.get(`/activatable/${token}`)

      setProfile(formatProfileData(newProfile))
    } catch (error) {
      promptError(error.message)
      replace('/')
    }
  }

  useEffect(() => {
    if (clientJsLoading || !query) return

    setBannerHidden(true)
    loadActivatableProfile(query.token)
  }, [query, clientJsLoading])

  return (
    <div>
      <header>
        <h1>Complete Registration</h1>
        <h5>
          Enter your full name and current institution to complete your registration.
          All other fields are optional.
        </h5>
      </header>

      {profile ? (
        <LegacyProfileEditor profile={profile} loading={clientJsLoading} hideAddDblpAndPublicationEditor="true" />
      ) : (
        <LoadingSpinner inline />
      )}
    </div>
  )
}

CreateProfile.bodyClass = 'activate'

export default CreateProfile
