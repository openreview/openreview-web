'use client'

/* globals promptError,promptMessage,$: false */

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import api from '../../lib/api-client'
import { resetRefreshTokenStatus } from '../../lib/clientAuth'
import { sanitizeRedirectUrl } from '../../lib/utils'
import { setUnreadNotification } from '../../notificationSlice'
import LoginInitialStep from './LoginInitialStep'
import LoginMFAStep from './LoginMFAStep'

export default function LoginForm() {
  const [mfaStatus, setMfaStatus] = useState(null)
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const completeLogin = () => {
    resetRefreshTokenStatus()
    dispatch(setUnreadNotification(null))
    window.location.replace(sanitizeRedirectUrl(redirect))
  }

  const handleInitialSubmit = async (email, password) => {
    try {
      const result = await api.post('/login', {
        id: email,
        password: password,
      })
      if (!result.mfaPending) {
        completeLogin()
        return true
      } else {
        setMfaStatus(result)
      }
    } catch (error) {
      promptError(error.message)
      return false
    }
  }

  if (mfaStatus) return <LoginMFAStep mfaStatus={mfaStatus} completeLogin={completeLogin} />

  return <LoginInitialStep handleInitialSubmit={handleInitialSubmit} />
}
