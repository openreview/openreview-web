'use client'

import { useEffect } from 'react'
import WebfieldContainer from '../../components/WebfieldContainer'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function CustomGroup({ webfieldCode, user }) {
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

    return () => {
      document.body.removeChild(script)
      window.user = null
    }
  }, [webfieldCode])

  return (
    <WebfieldContainer id="group-container">
      <LoadingSpinner />
    </WebfieldContainer>
  )
}
