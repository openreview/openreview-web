/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import api from '../lib/api-client'

const Confirm = () => {
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    if (!router.query.token) {
      setError({ statusCode: 404, message: 'Activation token not found' })
      return
    }

    api
      .put(`/activatelink/${router.query.token}`)
      .then(({ confirmedEmail }) => {
        promptMessage(`Thank you for confirming your email ${confirmedEmail ?? ''}`)
        router.replace('/')
      })
      .catch((apiError) => {
        setError({ statusCode: apiError.status, message: apiError.message })
      })
  }, [router.isReady, router.query])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return <LoadingSpinner />
}

export default Confirm
