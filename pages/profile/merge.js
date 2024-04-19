/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorDisplay from '../../components/ErrorDisplay'
import api from '../../lib/api-client'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import SpinnerButton from '../../components/SpinnerButton'

const Merge = () => {
  const { user } = useLoginRedirect()
  const router = useRouter()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [profileToMergeFrom, setProfileToMergeFrom] = useState(null)

  const confirmProfileMerge = () => {
    setIsLoading(true)
    api
      .put(`/mergelink/${router.query.token}`)
      .then(() => {
        promptMessage(`Thank you for confirming the profile merge.`)
        setIsLoading(false)
        router.replace('/')
      })
      .catch((apiError) => {
        setIsLoading(false)
        setError({ statusCode: apiError.status, message: apiError.message })
      })
  }

  const getActivatable = async () => {
    try {
      const {
        activatable: { action, duplicateProfile, username, groupId },
      } = await api.get(`/activatable/${router.query.token}`)
      if (action !== 'merge') {
        setError({ statusCode: 403, message: 'Token is invalid.' })
        return
      }
      if (!user?.profile?.usernames?.includes(username)) {
        setError({
          statusCode: 403,
          message: 'You are not authorized to perform this merge.',
        })
        return
      }
      setProfileToMergeFrom({ profileId: duplicateProfile, email: groupId })
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  useEffect(() => {
    if (!router.isReady) return

    if (!router.query.token) {
      setError({ statusCode: 404, message: 'Token is invalid' })
    }
    getActivatable()
  }, [router.isReady, router.query])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />
  if (!user || !profileToMergeFrom) return <LoadingSpinner />

  return (
    <>
      <header>
        <h1>Profile Merge</h1>
      </header>
      <p className="mt-4">
        Click the confirm button below to merge{' '}
        <a
          href={`/profile?id=${profileToMergeFrom.profileId}`}
          target="_blank"
          rel="noreferrer"
        >
          <strong>{profileToMergeFrom.profileId}</strong>
        </a>
        <strong>{`<${profileToMergeFrom.email}> `}</strong>
        into your user profile.
      </p>
      <p className="mb-4">
        Please contact{' '}
        <a href="mailto:info@openreview.net" target="_blank" rel="noreferrer">
          info@openreview.net
        </a>{' '}
        if you didn&apos;t request for this profile to be merged with your account.
      </p>

      <div className="response-buttons">
        <SpinnerButton loading={isLoading} disabled={isLoading} onClick={confirmProfileMerge}>
          Confirm Profile Merge
        </SpinnerButton>
      </div>
    </>
  )
}

Merge.bodyClass = 'confirm'
export default Merge
