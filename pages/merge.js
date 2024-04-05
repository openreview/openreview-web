/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import api from '../lib/api-client'
import useLoginRedirect from '../hooks/useLoginRedirect'
import SpinnerButton from '../components/SpinnerButton'

const Merge = () => {
  const { user } = useLoginRedirect()
  const router = useRouter()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const confirmProfileMerge = () => {
    setIsLoading(true)
    api
      .put(`/mergelink/${router.query.token}`)
      .then(({ confirmedEmail }) => {
        promptMessage(`Thank you for confirming your email ${confirmedEmail ?? ''}`)
        setIsLoading(false)
        router.replace('/')
      })
      .catch((apiError) => {
        setIsLoading(false)
        setError({ statusCode: apiError.status, message: apiError.message })
      })
  }

  useEffect(() => {
    if (!router.isReady) return

    if (!router.query.token) {
      setError({ statusCode: 404, message: 'Token is invalid' })
    }
  }, [router.isReady, router.query])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />
  if (!user && !error) return <LoadingSpinner />

  return (
    <>
      <p>Click submit button below to confirm the profile merge.</p>
      <p>Please contact info@openreview.net if you didn&apos;t request for a profile merge.</p>

      <div className="response-buttons">
        <SpinnerButton loading={isLoading} disabled={isLoading} onClick={confirmProfileMerge}>
          Submit
        </SpinnerButton>
      </div>
    </>
  )
}

Merge.bodyClass = 'confirm'
export default Merge
