'use client'

/* globals promptMessage,promptError: false */
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ErrorDisplay from '../../../components/ErrorDisplay'
import api from '../../../lib/api-client'
import ProfileEditor from '../../../components/profile/ProfileEditor'
import { formatProfileData } from '../../../lib/profiles'
import LoadingSpinner from '../../../components/LoadingSpinner'
import styles from './Activate.module.scss'
import CommonLayout from '../../CommonLayout'

export default function Page() {
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState(null)
  const [activateProfileErrors, setActivateProfileErrors] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const loadActivatableProfile = async (token) => {
    try {
      const apiRes = await api.get(`/activatable/${token}`)
      if (apiRes.activatable?.action !== 'activate') {
        setError('Invalid profile activation link. Please check your email and try again.')
        return
      }

      setProfile(formatProfileData(apiRes.profile, { useLinkObjectFormat: true }))
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  const saveProfile = async (newProfileData) => {
    setLoading(true)
    setActivateProfileErrors(null)
    try {
      const { user, token } = await api.put(`/activate/${searchParams.get('token')}`, {
        content: newProfileData,
      })
      if (token) {
        promptMessage('Your OpenReview profile has been successfully created')
        router.replace('/')
        router.refresh()
      } else {
        // If user moderation is enabled, PUT /activate/${token} will return an empty response
        promptMessage(
          'Your OpenReview profile has been created. Please allow up to two weeks for your profile to be processed.'
        )
        router.push('/')
      }
    } catch (apiError) {
      promptError(apiError.message)
      setActivateProfileErrors(
        apiError.errors?.map((p) => p.details?.path) ?? [apiError?.details?.path]
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('Invalid profile activation link. Please check your email and try again.')
      return
    }
    loadActivatableProfile(token)
  }, [searchParams])

  if (!profile && !error) return <LoadingSpinner />

  if (error) return <ErrorDisplay message={error} />

  return (
    <CommonLayout banner={null}>
      <div className={styles.activate}>
        <header></header>
        <h1>Complete Registration</h1>
        <h5>
          {' '}
          Enter your current institution and at least one web URL to complete your
          registration. All other fields are optional.
        </h5>
        <ProfileEditor
          loadedProfile={profile}
          submitButtonText="Register for OpenReview"
          submitHandler={saveProfile}
          hideCancelButton
          hideImportButton
          hidePublicationEditor
          loading={loading}
          isNewProfile={true}
          saveProfileErrors={activateProfileErrors}
        />
      </div>
    </CommonLayout>
  )
}
