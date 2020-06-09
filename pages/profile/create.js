/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import UserContext from '../../components/UserContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import LegacyProfileEditor from '../../components/LegacyProfileEditor'
import api from '../../lib/api-client'
import { formatProfileData } from '../../lib/profiles'

// Page Styles
import '../../styles/pages/profile-edit.less'

const CreateProfile = ({ appContext }) => {
  const [activateToken, setActivateToken] = useState('')
  const [profile, setProfile] = useState(null)
  const { loginUser } = useContext(UserContext)
  const { query, replace } = useRouter()

  const { setBannerHidden, clientJsLoading } = appContext

  const loadActivatableProfile = async (token) => {
    if (!token) return

    try {
      const apiRes = await api.get(`/activatable/${token}`)
      setProfile(formatProfileData(apiRes.profile))
      setActivateToken(token)
    } catch (error) {
      promptError(error.message)
      replace('/')
    }
  }

  const saveProfile = async (newProfileData, done) => {
    try {
      const { user, token } = await api.put(`/activate/${activateToken}`, newProfileData)
      promptMessage(`Your OpenReview profile has been successfully created. Please allow up to 12
        hours before the profile is activated.`)
      loginUser(user, token)
      replace('/')
    } catch (error) {
      promptError(error.message)
      done()
    }
  }

  useEffect(() => {
    if (clientJsLoading || !query) return

    setBannerHidden(true)
    loadActivatableProfile(query.token)
  }, [query, clientJsLoading])

  return (
    <div>
      <Head>
        <title key="title">Complete Registration | OpenReview</title>
      </Head>

      <header>
        <h1>Complete Registration</h1>
        <h5>
          Enter your full name and current institution to complete your registration.
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

CreateProfile.bodyClass = 'profile-edit'

export default CreateProfile
