'use client'

/* globals promptError: false */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '../../lib/api-client'

export default function LogoutLink() {
  const handleLogout = async (e) => {
    e.preventDefault()

    try {
      await api.post('/logout')
      window.location.reload()
      window.localStorage.setItem('openreview.lastLogout', Date.now())
    } catch (error) {
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
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <Link href="#" onClick={handleLogout}>
      Logout
    </Link>
  )
}
