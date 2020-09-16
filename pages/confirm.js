/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import useQuery from '../hooks/useQuery'
import api from '../lib/api-client'

const Confirm = () => {
  const [error, setError] = useState(null)
  const router = useRouter()
  const query = useQuery()

  const activate = async () => {
    try {
      const apiRes = await api.put(`/activatelink/${query.token}`)
      const newEmail = apiRes.content?.emails?.slice(-1)
      promptMessage(`Thank you for confirming your email ${newEmail || ''}`)
      router.replace('/')
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  useEffect(() => {
    if (!query) return

    if (query.token) {
      activate()
    } else {
      setError({ statusCode: 404, message: 'Activation token not found' })
    }
  }, [query])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return <LoadingSpinner />
}

export default Confirm
