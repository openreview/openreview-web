'use client'

/* globals promptMessage: false */
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { truncate } from 'lodash'
import LoginPage from './Login'
import useUser from '../../hooks/useUser'
import LoadingSpinner from '../../components/LoadingSpinner'

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
      window.location.replace(redirect ?? '/')
    } else if (redirect) {
      promptMessage(`Please login to access ${truncate(redirect, { length: 100 })}`)
      setLoading(false)
    }
  }, [user, isRefreshing])

  if (isLoading) return <LoadingSpinner />
  return <LoginPage />
}

export default function Login() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Page />
    </Suspense>
  )
}
