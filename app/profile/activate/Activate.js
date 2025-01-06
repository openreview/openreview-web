'use client'

/* globals promptMessage,promptError: false */
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import ProfileEditor from '../../../components/profile/ProfileEditor'
import api from '../../../lib/api-client'
import { setUser } from '../../../rootSlice'

export default function Activate({ loadActivatableProfileP, activateToken }) {
  const profile = use(loadActivatableProfileP)
  const [activateProfileErrors, setActivateProfileErrors] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()

  const saveProfile = async (newProfileData) => {
    setLoading(true)
    setActivateProfileErrors(null)
    try {
      const { user, token } = await api.put(`/activate/${activateToken}`, {
        content: newProfileData,
      })
      if (token) {
        promptMessage('Your OpenReview profile has been successfully created', {
          scrollToTop: false,
        })
        dispatch(setUser({ user, token }))
      } else {
        // If user moderation is enabled, PUT /activate/${token} will return an empty response
        promptMessage(
          'Your OpenReview profile has been created. Please allow up to two weeks for your profile to be processed.'
        )
        router.push('/')
      }
    } catch (error) {
      promptError(error.message)
      setActivateProfileErrors(
        error.errors?.map((p) => p.details?.path) ?? [error?.details?.path]
      )
    }
    setLoading(false)
  }

  return (
    <ProfileEditor
      loadedProfile={profile}
      submitButtonText="Register for OpenReview"
      submitHandler={saveProfile}
      hideCancelButton
      hideDblpButton
      hidePublicationEditor
      loading={loading}
      isNewProfile={true}
      saveProfileErrors={activateProfileErrors}
    />
  )
}
