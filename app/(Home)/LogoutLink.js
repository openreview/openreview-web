'use client'

import Link from 'next/link'
import api from '../../lib/api-client'

export default function LogoutLink({ className, style, onClick }) {
  const handleLogout = async (e) => {
    e.preventDefault()
    onClick?.()

    try {
      await api.post('/logout')
      window.location.reload()
      window.localStorage.setItem('openreview.lastLogout', Date.now())
    } catch (error) {
      // oxlint-disable-next-line no-console
      console.log('Error in LogoutLink', {
        page: 'Home',
        component: 'LogoutLink',
        apiError: error,
        apiRequest: {
          endpoint: '/logout',
        },
      })
      promptError(error.message)
    }
  }

  return (
    <Link href="#" onClick={handleLogout} className={className} style={style}>
      Logout
    </Link>
  )
}
