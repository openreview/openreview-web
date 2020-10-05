/* globals promptError: false */

import { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import UserContext from '../components/UserContext'
import api from '../lib/api-client'
import LoadingSpinner from '../components/LoadingSpinner'

const Logout = () => {
  const { user, userLoading, logoutUser } = useContext(UserContext)
  const router = useRouter()

  const performLogout = async () => {
    try {
      await api.post('/logout')
      logoutUser()
      window.localStorage.setItem('openreview.lastLogout', Date.now())
    } catch (error) {
      promptError(error.message)
      router.replace('/')
    }
  }

  useEffect(() => {
    if (userLoading) return

    if (user) {
      performLogout()
    } else {
      router.replace('/')
    }
  }, [userLoading, user])

  return <LoadingSpinner />
}

Logout.bodyClass = 'logout'

export default Logout
