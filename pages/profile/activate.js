/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import omit from 'lodash/omit'
import useQuery from '../../hooks/useQuery'
import UserContext from '../../components/UserContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import LegacyProfileEditor from '../../components/LegacyProfileEditor'
import ProfileEditor from '../../components/profile/ProfileEditor'
import api from '../../lib/api-client'
import { formatProfileData } from '../../lib/profiles'

// Page Styles
import '../../styles/pages/profile-edit.less'

const ActivateProfile = ({ appContext }) => {
  const [activateToken, setActivateToken] = useState('')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
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

  const saveProfile = async (newProfileData) => {
    setLoading(true)
    const dataToSubmit = {
      id: profile.id,
      content: newProfileData,
      signatures: [profile.id],
    }
    try {
      const { user, token } = await api.put(`/activate/${activateToken}`, dataToSubmit)
      if (token) {
        promptMessage('Your OpenReview profile has been successfully created', { scrollToTop: false })
        loginUser(user, token)
      } else {
        // If user moderation is enabled, PUT /activate/${token} will return an empty response
        promptMessage('Your OpenReview profile has been created. Please allow up to 12 hours for your profile to be activated.')
        router.push('/')
      }
    } catch (error) {
      promptError(error.message)
    }
    setLoading(false)
  }

  const renderProfileEditor = () => {
    const USE_NEW_PROFILE_PAGE = Number(process.env.USE_NEW_PROFILE_PAGE)
    const shouldUseLegacy = Number.isNaN(USE_NEW_PROFILE_PAGE) || Math.random() * 100 > USE_NEW_PROFILE_PAGE
    if (shouldUseLegacy) {
      return (
        <LegacyProfileEditor
          profile={profile}
          onSubmit={saveProfile}
          submitButtonText="Register for OpenReview"
          hideCancelButton
          hideDblpButton
          hidePublicationEditor
        />
      )
    }
    return (
      <ProfileEditor
        loadedProfile={profile}
        submitButtonText="Register for OpenReview"
        submitHandler={saveProfile}
        hideCancelButton
        hideDblpButton
        hidePublicationEditor
        personalLinkNames={['homepage', 'gscholar', 'dblp', 'orcid', 'linkedin', 'wikipedia', 'semanticScholar']}
        loading={loading}
      />
    )
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

      {profile ? renderProfileEditor() : (
        <LoadingSpinner inline />
      )}
    </div>
  )
}

ActivateProfile.bodyClass = 'profile-edit'

export default ActivateProfile
