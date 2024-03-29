/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import api from '../lib/api-client'
import useLoginRedirect from '../hooks/useLoginRedirect'

const Confirm = () => {
  const [error, setError] = useState(null)
  const router = useRouter()
  const { user, accessToken } = useLoginRedirect()
  const [isLoading, setIsLoading] = useState(true)
  const [emailToConfirm, setEmailToConfirm] = useState(null)

  const confirmEmail = async () => {
    await api
      .put(`/activatelink/${router.query.token}`)
      .then(({ confirmedEmail }) => {
        promptMessage(`Thank you for confirming your email ${confirmedEmail ?? ''}`)
        router.replace('/')
      })
      .catch((apiError) => {
        setError({ statusCode: apiError.status, message: apiError.message })
      })
  }

  const getActivatable = async () => {
    setIsLoading(true)
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
    setIsLoading(false)
  }

  useEffect(() => {
    if (!router.isReady) return

    if (!router.query.token) {
      setError({ statusCode: 404, message: 'Activation token not found' })
    }

    getActivatable()
  }, [router.isReady, router.query])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />
  if (isLoading) return <LoadingSpinner />

  return (
    <>
      <p>{`Click submit button below to add ${emailToConfirm} to your account.`}</p>
      <p>Please contact info@openreview.net if you didn&apos;t add this email.</p>

      <div className="response-buttons">
        <button type="button" className="btn btn-lg mt-4" onClick={() => confirmEmail()}>
          Submit
        </button>
      </div>
    </>
  )
}

Confirm.bodyClass = 'confirm'
export default Confirm
