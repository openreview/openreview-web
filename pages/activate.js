/* globals promptMessage: false */
/* globals promptError: false */

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import api from '../lib/api-client'
import LoadingSpinner from '../components/LoadingSpinner'
import withError from '../components/withError'

const Activate = ({ appContext, queryToken }) => {
  const router = useRouter()
  const [token, setToken] = useState(queryToken)

  const { setBannerHidden } = appContext

  const activate = async () => {
    try {
      await api.put(`/activatelink/${token}`)
      promptMessage('Thank you for confirming your email')
    } catch (error) {
      promptError(error.message)
    } finally {
      router.push('/')
    }
  }

  useEffect(() => {
    setBannerHidden(true)
    setToken(router.query.token)
    activate()
  }, [token])

  return <LoadingSpinner />
}

Activate.getInitialProps = async (context) => {
  if (!context.query?.token) return { statusCode: 404, message: 'Activation token not found' }
  return { queryToken: context.query.token }
}

export default withError(Activate)
