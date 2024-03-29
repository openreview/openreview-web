/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import api from '../lib/api-client'
import useLoginRedirect from '../hooks/useLoginRedirect'
import SpinnerButton from '../components/SpinnerButton'

const Confirm = () => {
  const { user, accessToken } = useLoginRedirect()
  const router = useRouter()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailToConfirm, setEmailToConfirm] = useState(null)

  const confirmEmail = async () => {
    setIsLoading(true)
    await api
      .put(`/activatelink/${router.query.token}`)
      .then(({ confirmedEmail }) => {
        promptMessage(`Thank you for confirming your email ${confirmedEmail ?? ''}`)
        router.replace('/')
      })
      .catch((apiError) => {
        setError({ statusCode: apiError.status, message: apiError.message })
        setIsLoading(false)
      })
  }

  const getActivatable = async () => {
    try {
      const {
        activatable: { groupId, username },
      } = await api.get(`/activatable/${router.query.token}`)
      if (!user.profile.usernames.includes(username)) {
        setError({
          statusCode: 403,
          message: 'You are not authorized to activate this email.',
        })
        return
      }
      setEmailToConfirm(groupId)
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  useEffect(() => {
    if (!router.isReady) return

    if (!router.query.token) {
      setError({ statusCode: 404, message: 'Activation token not found' })
    }

    getActivatable()
  }, [router.isReady, router.query])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />
  if (!emailToConfirm && !error) return <LoadingSpinner />

  return (
    <>
      <p>
        Click submit button below to confirm adding <strong>{emailToConfirm}</strong> to your
        account.
      </p>
      <p>Please contact info@openreview.net if you didn&apos;t add this email.</p>

      <div className="response-buttons">
        <SpinnerButton loading={isLoading} disabled={isLoading} onClick={confirmEmail}>
          Submit
        </SpinnerButton>
      </div>
    </>
  )
}

Confirm.bodyClass = 'confirm'
export default Confirm
