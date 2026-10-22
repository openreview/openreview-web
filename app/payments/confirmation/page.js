'use client'

import { CheckCircleOutlined } from '@ant-design/icons'
import { Button, Result } from 'antd'
import { notFound, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoadingSpinner from '../../../components/LoadingSpinner'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import { inflect, prettyId, prettyList } from '../../../lib/utils'

export default function Page() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  if (!sessionId) notFound()
  const [sessionInfo, setSessionInfo] = useState(null)
  const { isRefreshing } = useUser()

  const [error, setError] = useState(null)

  const loadSessionInfo = async () => {
    try {
      const { payments } = await api.get('/payments', { sessionId })
      if (!payments.length) {
        const { exists } = await api.get('/payments/confirmation', { sessionId })
        if (!exists) throw new Error('Payment session not found')
        setSessionInfo({ submissions: [] })
        return
      }
      const { notes } = await api.get('/notes', {
        ids: payments.map((payment) => payment.note),
        sort: 'number:asc',
      })
      setSessionInfo({ domain: payments[0].domain, submissions: notes })
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    loadSessionInfo()
  }, [sessionId, isRefreshing])

  if (error) notFound()
  if (!sessionInfo) return <LoadingSpinner />

  const { domain, submissions } = sessionInfo
  const submissionNumbers = prettyList(
    submissions.map((submission) => submission.number),
    'long',
    'conjunction',
    false
  )

  return (
    <Result
      status="success"
      icon={<CheckCircleOutlined />}
      title="Payment Received"
      subTitle={
        <>
          {submissions.length > 0 && (
            <p>
              for{' '}
              {`${prettyId(domain)} ${inflect(submissions.length, 'Submission', 'Submissions')} ${submissionNumbers}`}
            </p>
          )}
          The fee status will update once the payment is confirmed, usually within a few
          seconds. You can close this page.
        </>
      }
      extra={
        submissions.length > 0 &&
        (submissions.length > 1 ? (
          <Button type="primary" href="/payments">
            Go to Payments
          </Button>
        ) : (
          <Button type="primary" href={`/forum?id=${submissions[0].id}`}>
            Go to Submission
          </Button>
        ))
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
