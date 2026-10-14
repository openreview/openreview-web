'use client'

import { CheckCircleOutlined } from '@ant-design/icons'
import { Button, Result } from 'antd'
import { notFound, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'

export default function Page() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  if (!sessionId) notFound()
  const [sessionStatus, setSessionStatus] = useState(null)

  const [error, setError] = useState(null)

  const loadSessionInfo = async () => {
    try {
      const { domain, submissions } = await api.get('look up session status', {
        session_id: sessionId,
      })
      setSessionStatus({ domain, submissions })
    } catch (error) {
      setError(error.message)
    }
  }

  useEffect(() => {
    loadSessionInfo()
  }, [sessionId])

  if (error) notFound()
  if (!sessionStatus) return <LoadingSpinner />

  const { domain, submissions } = sessionStatus
  const isBulkPayment = submissions.length > 1
  const submissionNumbers = submissions.map((submission) => submission.number).join(', ')

  return (
    <Result
      status="success"
      icon={<CheckCircleOutlined />}
      title="Payment Received"
      subTitle={
        <>
          <p>
            for{' '}
            {`${prettyId(domain)} ${isBulkPayment ? 'Submissions' : 'Submission'} ${submissionNumbers}`}
          </p>
          The fee status will update once the payment is confirmed, usually within a few
          seconds. You can close this page.
        </>
      }
      extra={
        isBulkPayment ? (
          <Button type="primary" href="/payments">
            Go to Payments
          </Button>
        ) : (
          <Button type="primary" href={`/forum?id=${submissions[0].noteId}`}>
            Go to Submission
          </Button>
        )
      }
      styles={{
        root: {
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingBottom: '15vh',
        },
      }}
    />
  )
}
