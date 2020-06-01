/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
/* eslint-disable max-len */
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import api from '../../lib/api-client'
import { formatProfileData } from '../../lib/profiles'
import ProfileEditor from '../../components/ProfileEditor'

import '../../styles/pages/profile.less'

const Header = () => (
  <header>
    <h1>Complete Registration</h1>
    <h5>Enter your full name and current institution to complete your registration. All other fields are optional.</h5>
  </header>
)

const CreateAccount = ({ appContext }) => {
  const { query } = useRouter()
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  const { setBannerHidden } = appContext

  const getActivatable = async () => {
    if (!token) return
    try {
      const targetURL = `/activatable/${token}`
      const { profile, activatable, prefixed_positions, prefixed_relations, institutions } = await api.get(targetURL)
      const formattedProfile = formatProfileData(profile)
      setProfile(formattedProfile)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    setBannerHidden(true)
    setToken(query.token)
    getActivatable()
  }, [query, token])

  return (
    <div className="profile-controller">
      <Header />
      <ProfileEditor profile={profile} />
    </div>
  )
}
CreateAccount.bodyClass = 'activate'
export default CreateAccount
