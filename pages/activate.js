/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import withError from '../components/withError'
import api from '../lib/api-client'

const Activate = ({ activateToken }) => {
  const router = useRouter()

  const activate = async () => {
    try {
      const result = await api.put(`/activatelink/${activateToken}`)
      const newEmail = result.content?.emails?.slice(-1)
      promptMessage(`Thank you for confirming your email ${newEmail || ''}`)
    } catch (error) {
      promptError(error.message)
    }
    router.push('/')
  }

  useEffect(() => {
    activate()
  }, [])

  return <LoadingSpinner />
}

Activate.getInitialProps = async (context) => {
  if (!context.query.token) {
    return { statusCode: 404, message: 'Activation token not found' }
  }
  return { activateToken: context.query.token }
}

export default withError(Activate)
