'use client'

/* globals promptMessage: false */
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import useUser from '../../hooks/useUser'
import LoadingSpinner from '../../components/LoadingSpinner'
import { sanitizeRedirectUrl } from '../../lib/utils'
import LoginForm from './LoginForm'

function Page() {
  const [isLoading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const { user, isRefreshing } = useUser()

  useEffect(() => {
    if (isRefreshing) return
    if (user === null) {
      // refresh failed
      setLoading(false)
      return
    }
    if (user) {
      window.location.replace(sanitizeRedirectUrl(redirect))
    } else if (redirect) {
      setLoading(false)
    } else {
      // no redirect show login
      setLoading(false)
    }
  }, [user, isRefreshing])

  if (isLoading) return <LoadingSpinner />
  return <LoginForm />
}

export default function Login() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Page />
    </Suspense>
  )
}
