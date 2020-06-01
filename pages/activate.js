import Router, { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import api from '../lib/api-client'

export default ({ appContext }) => {
  const { query } = useRouter()
  const [token, setToken] = useState(null)

  const { setBannerHidden } = appContext

  const activate = async () => {
    if (!query) return
    try {
      await api.put(`/activatelink/${query.token}`)
      promptMessage('Thank you for confirming your email')
      Router.push('/')
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    setBannerHidden(true)
    setToken(query.token)
    activate()
  }, [query])

  return null
}
