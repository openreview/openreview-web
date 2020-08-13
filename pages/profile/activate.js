/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import useQuery from '../../hooks/useQuery'
import UserContext from '../../components/UserContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import LegacyProfileEditor from '../../components/LegacyProfileEditor'
import api from '../../lib/api-client'
import { formatProfileData } from '../../lib/profiles'

// Page Styles
import '../../styles/pages/profile-edit.less'

const ActivateProfile = ({ appContext }) => {
  const [activateToken, setActivateToken] = useState('')
  const [profile, setProfile] = useState(null)
  const { loginUser } = useContext(UserContext)
  const query = useQuery()
  const router = useRouter()

  const { setBannerHidden } = appContext

  const loadActivatableProfile = async (token) => {
    try {
      const apiRes = await api.get(`/activatable/${token}`)
      setProfile(formatProfileData(apiRes.profile))
      setActivateToken(token)
    } catch (error) {
      promptError(error.message)
      router.replace('/')
    }
  }

  const saveProfile = async (newProfileData, done) => {
    try {
      const { user, token } = await api.put(`/activate/${activateToken}`, newProfileData)
      promptMessage('Your OpenReview profile has been successfully created', { scrollToTop: false })
      loginUser(user, token)
    } catch (error) {
      promptError(error.message)
      done()
    }
  }

  useEffect(() => {
    if (!query) return

    if (query.token) {
      loadActivatableProfile(query.token)
    } else {
      promptError('Invalid profile activation link. Please check your email and try again.')
      router.replace('/')
    }
  }, [query])

  useEffect(() => {
    setBannerHidden(true)
  }, [])

  return (
    <div>
      <Head>
        <title key="title">Complete Registration | OpenReview</title>
      </Head>

      <header>
        <h1>Complete Registration</h1>
        <h5>
          Enter your current institution and at least one web URL to complete your registration.
          All other fields are optional.
        </h5>
      </header>

      {profile ? (
        <LegacyProfileEditor
          profile={profile}
          onSubmit={saveProfile}
          submitButtonText="Register for OpenReview"
          hideCancelButton
          hideDblpButton
          hidePublicationEditor
        />
      ) : (
        <LoadingSpinner inline />
      )}
    </div>
  )
}

ActivateProfile.bodyClass = 'profile-edit'

export default ActivateProfile
