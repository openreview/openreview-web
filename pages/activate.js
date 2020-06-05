/* globals promptMessage: false */
/* globals promptError: false */

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import api from '../lib/api-client'
import LoadingSpinner from '../components/LoadingSpinner'
import withError from '../components/withError'

const Activate = ({ appContext, queryToken }) => {
  const router = useRouter()

  const { setBannerHidden } = appContext

  const activate = async () => {
    try {
      const result = await api.put(`/activatelink/${queryToken}`)
      promptMessage(`Thank you for confirming your email ${result?.content?.emails?.slice(-1) ?? ''}`)
    } catch (error) {
      promptError(error.message)
    }
    router.push('/')
  }

  useEffect(() => {
    setBannerHidden(true)
    activate()
  }, [])

  return <LoadingSpinner />
}

Activate.getInitialProps = async (context) => {
  if (!context.query?.token) return { statusCode: 404, message: 'Activation token not found' }
  return { queryToken: context.query.token }
}

export default withError(Activate)
