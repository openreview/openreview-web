'use client'

import { Flex, Typography } from 'antd'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import CommonLayout from '../../CommonLayout'
import ResetForm from './ResetForm'

const { Title, Text } = Typography

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
      <Flex vertical style={{ maxWidth: 480, margin: '0 auto' }}>
        <Title level={2} style={{ marginTop: 0 }}>
          Reset Password
        </Title>
        <Text type="secondary">Enter your new password below.</Text>
        <ResetForm resetToken={resetToken} />
        <div style={{ marginTop: 50 }}>
          <Link href="/login" prefetch={false}>
            Back to Login
          </Link>
        </div>
      </Flex>
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
