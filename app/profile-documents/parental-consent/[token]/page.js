'use client'

import { Typography } from 'antd'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import ErrorDisplay from '../../../../components/ErrorDisplay'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import { getFileUploadTokenPayload } from '../../../../lib/clientAuth'
import CommonLayout from '../../../CommonLayout'
import DocumentUploadSection from '../../DocumentUploadSection'

const { Title } = Typography

export default function Page() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const { profileId, type } = getFileUploadTokenPayload(token) ?? {}
    if (!profileId || type !== 'parentalConsent') {
      setError('Invalid profile documents link. Please check your email and try again.')
    }
    setLoading(false)
  }, [token])

  if (loading) return <LoadingSpinner />

  if (error) return <ErrorDisplay message={error} />

  return (
    <CommonLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Title level={2} style={{ marginTop: 0 }}>
          Upload Parental Consent
        </Title>
        <DocumentUploadSection type="parental-consent" token={token} instructions="" />
      </div>
    </CommonLayout>
  )
}
