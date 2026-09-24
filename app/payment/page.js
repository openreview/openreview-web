'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  PaymentElement,
  useCheckout,
  CheckoutProvider,
} from '@stripe/react-stripe-js/checkout'
import useUser from '../../hooks/useUser'
import ErrorDisplay from '../../components/ErrorDisplay'
import api from '../../lib/api-client'
import LoadingSpinner from '../../components/LoadingSpinner'
import SpinnerButton from '../../components/SpinnerButton'

import styles from './Payment.module.scss'
import { prettyInvitationId } from '../../lib/utils'
import CommonLayout from '../CommonLayout'

const PaymentForm = ({ sessionId, setError }) => {
  const checkoutState = useCheckout()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (checkoutState.type === 'loading') {
    return <LoadingSpinner inline={true} />
  }

  if (checkoutState.type === 'error') {
    return <div>Error: {checkoutState.error.message}</div>
  }

  const handleSubmit = async () => {
    const { checkout } = checkoutState
    setIsSubmitting(true)
    const confirmResult = await checkout.confirm({
      returnUrl: `${window.location.origin}${window.location.pathname}?session_id=${sessionId}`,
    })
    setIsSubmitting(false)
    if (confirmResult.type === 'error') {
      setError(confirmResult.error.message)
    }
  }

  return (
    <div className={styles.paymentForm}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <SpinnerButton
        className={styles.paymentButton}
        onClick={handleSubmit}
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        Pay ${checkoutState.checkout.total.total.amount}
      </SpinnerButton>
    </div>
  )
}

export default function Page() {
  const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY_CARD)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  const [sessionStatus, setSessionStatus] = useState(null)
  const searchParams = useSearchParams()
  const { isRefreshing, user } = useUser(true)
  const router = useRouter()

  const invitationId = searchParams.get('invitation')
  const noteId = searchParams.get('note')
  const sessionId = searchParams.get('session_id')

  const loadPaymentInvitationSession = async () => {
    try {
      if (!invitationId) throw new Error('Invitation ID is required')
      const invitationResult = await api.get('/invitations', { id: invitationId })
      const paymentInvitation = invitationResult.invitations?.[0]
      const paymentInvitationAmount =
        paymentInvitation.edit?.note?.content?.payment?.value?.param?.expectedAmount
      if (!paymentInvitationAmount) throw new Error('Invitation is invalid')
      const sessionResult = await await api.post('/card-session', {
        invitationId,
        noteId,
        email: user.profile.preferredEmail,
      })
      setSession(sessionResult)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  const loadSessionStatus = async () => {
    try {
      // TODO: check whether user has pending payment
      const result = await api.get('/session-status', { sessionId })
      setSessionStatus(result.status)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!user) {
      router.push('/')
      return
    }
    if (sessionId) {
      loadSessionStatus()
    } else {
      loadPaymentInvitationSession()
    }
  }, [isRefreshing, invitationId, noteId])

  if (error) return <ErrorDisplay message={error} />
  if (!session?.clientSecret) return <LoadingSpinner />

  if (sessionStatus) {
    if (sessionStatus === 'succeeded') {
      return (
        <div className={`${styles.message} ${styles.success}`}>
          Payment successful! You can close this page.
        </div>
      )
    }
    return (
      <div className={`${styles.message} ${styles.error}`}>
        Payment failed or was canceled. Please try again.
      </div>
    )
  }

  return (
    <CommonLayout banner={null}>
      <header>
        <h1>Payment</h1>
      </header>

      <div className={styles.payment}>
        <div className={styles.paymentHeader}>
          <h1>Complete Your Payment for {prettyInvitationId(invitationId)}</h1>
          <p>Please enter your payment details below</p>
        </div>
        <CheckoutProvider
          stripe={stripePromise}
          options={{
            clientSecret: session.clientSecret,
            elementsOptions: {
              appearance: {
                disableAnimations: true,
                inputs: 'condensed',
                variables: {
                  colorPrimary: '#3e6775',
                  borderRadius: '2px',
                },
              },
            },
          }}
        >
          <PaymentForm sessionId={session.sessionId} setError={setError} />
        </CheckoutProvider>
      </div>
    </CommonLayout>
  )
}
