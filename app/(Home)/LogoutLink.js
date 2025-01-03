'use client'

import { useDispatch } from 'react-redux'
import Link from 'next/link'
import api from '../../lib/api-client'
import { setUser } from '../../rootSlice'

export default function LogoutLink() {
  const dispatch = useDispatch()

  const handleLogout = async (e) => {
    e.preventDefault()

    try {
      await api.post('/logout')
      dispatch(setUser({ user: null, token: null }))
      window.location.reload()
      window.localStorage.setItem('openreview.lastLogout', Date.now())
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <Link href="/logout" onClick={handleLogout}>
      Logout
    </Link>
  )
}
