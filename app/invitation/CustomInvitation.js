'use client'

import { useEffect } from 'react'
import WebfieldContainer from '../../components/WebfieldContainer'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function CustomInvitation({ webfieldCode, user }) {
  useEffect(() => {
    if (!webfieldCode) return
    window.user = user || {
      id: `guest_${Date.now()}`,
      profile: { id: 'guest' },
      isGuest: true,
    }

    const script = document.createElement('script')
    script.innerHTML = webfieldCode
    document.body.appendChild(script)

    // eslint-disable-next-line consistent-return
    return () => {
      document.body.removeChild(script)
      window.user = null
    }
  }, [webfieldCode])

  return (
    <WebfieldContainer id="invitation-container">
      <LoadingSpinner />
    </WebfieldContainer>
  )
}
