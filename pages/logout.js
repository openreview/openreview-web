/* globals promptError: false */

import { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import UserContext from '../components/UserContext'
import api from '../lib/api-client'
import LoadingSpinner from '../components/LoadingSpinner'

const Logout = () => {
  const { user, logoutUser } = useContext(UserContext)
  const router = useRouter()

  const performLogout = async () => {
    try {
      await api.post('/logout')
      logoutUser()
    } catch (error) {
      promptError(error.message)
    }

    router.replace('/')
  }

  useEffect(() => {
    if (user) {
      performLogout(false)
    }
  }, [user])

  // Redirect unauthenticated users after 1 second
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!user) {
        router.replace('/')
      }
    }, 1000)

    return () => clearTimeout(timerId)
  }, [])

  return <LoadingSpinner />
}

Logout.bodyClass = 'logout'

export default Logout
