'use client'

/* globals promptError: false */
import Link from 'next/link'
import api from '../../lib/api-client'

export default function LogoutLink() {
  const handleLogout = async (e) => {
    e.preventDefault()

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
    <Link href="#" onClick={handleLogout}>
      Logout
    </Link>
  )
}
