'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import styles from './Password.module.scss'
import CommonLayout from '../../CommonLayout'
import ResetForm from './ResetForm'

function Page() {
  const searchParams = useSearchParams()
  const [error, setError] = useState(null)
  const [resetToken, setResetToken] = useState(null)

  const loadResetToken = async (token) => {
    try {
      const { resettable } = await api.get(`/resettable/${token}`)
      if (resettable?.token) {
        setResetToken(resettable.token)
      } else {
        setError('Token not found')
      }
    } catch (apiError) {
      setError(apiError.message)
    }
  }
  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('Page not found')
      return
    }
    loadResetToken(token)
  }, [searchParams])

  if (!resetToken && !error) return <LoadingSpinner />
  if (error) return <ErrorDisplay message={error} />

  return (
    <CommonLayout>
      <div className={`row ${styles.password}`}>
        <div className="reset-container col-sm-12 col-md-8 col-lg-6 col-md-offset-2 col-lg-offset-3">
          <h1>Reset Password</h1>
          <p className="text-muted">Enter your new password below.</p>
          <ResetForm resetToken={resetToken} />

          <p className="help-block">
            <Link href="/login" prefetch={false}>
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </CommonLayout>
  )
}

export default function PasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Page />
    </Suspense>
  )
}
