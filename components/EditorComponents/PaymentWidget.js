import Dropdown from '../Dropdown'
import EditorComponentContext from '../EditorComponentContext'
import { useContext, useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import LoadingSpinner from '../LoadingSpinner'
import {
  PaymentElement,
  useCheckout,
  CheckoutProvider,
} from '@stripe/react-stripe-js/checkout'
import SpinnerButton from '../SpinnerButton'
import styles from '../../styles/components/PaymentWidget.module.scss'

const supportedPaymentMethods = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'wechatAliPay', label: '微信支付/支付宝' },
]

const PaymentForm = ({ email, sessionId }) => {
  const checkoutState = useCheckout()
  const { field, onChange, value, invitation, error, clearError, noteEditorPreview } =
    useContext(EditorComponentContext)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fieldName = Object.keys(field)[0]

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
      returnUrl: window.location.href,
      redirect: 'if_required',
    })
    setIsSubmitting(false)
    if (confirmResult.type === 'error') {
      promptError(confirmResult.error.message)

      return
    }

    onChange({ fieldName, value: sessionId })
    clearError?.()
  }

  return (
    <>
      <PaymentElement options={{ layout: 'tabs' }} />
      <SpinnerButton
        className={styles.paymentButton}
        onClick={handleSubmit}
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        Pay ${checkoutState.checkout.total.total.amount}
      </SpinnerButton>
    </>
  )
}

const CardPayment = ({ invitationId }) => {
  const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY_CARD)
  const { field, onChange, value, invitation, error, clearError, noteEditorPreview } =
    useContext(EditorComponentContext)
  const [session, setSession] = useState(null)
  const { accessToken, user, isRefreshing } = useUser()

  const getClientSecret = async () => {
    const result = await await api.post(
      '/donate-session',
      {
        invitation: invitationId,
        email: user?.profile?.preferredEmail,
      },
      { accessToken }
    )
    setSession(result)
  }

  useEffect(() => {
    if (isRefreshing) return
    getClientSecret()
  }, [isRefreshing])

  if (!session?.clientSecret) return <LoadingSpinner inline={true} />

  return (
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
      <PaymentForm email={user?.profile?.preferredEmail} sessionId={session.sessionId} />
    </CheckoutProvider>
  )
}

const WechatAliPayment = ({ invitationId }) => {
  const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY_WECHAT_ALI)
  const [session, setSession] = useState(null)
  const { accessToken, user, isRefreshing } = useUser()

  const getClientSecret = async () => {
    const result = await await api.post(
      '/donate-session',
      {
        invitation: invitationId,
        email: user?.profile?.preferredEmail,
      },
      { accessToken }
    )
    setSession(result)
  }

  useEffect(() => {
    if (isRefreshing) return
    getClientSecret()
  }, [isRefreshing])

  if (!session?.clientSecret) return <LoadingSpinner inline={true} />

  return (
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
      <PaymentForm email={user?.profile?.preferredEmail} sessionId={session.sessionId} />
    </CheckoutProvider>
  )
}

const PaymentWidget = () => {
  const { field, onChange, value, invitation, error, clearError, noteEditorPreview } =
    useContext(EditorComponentContext)
  const [paymentMethod, setPaymentMethod] = useState(null)

  const fieldName = Object.keys(field)[0]
  const paymentMethods = ['card', 'wechatAliPay'] //field[fieldName].value?.param?.paymentMethods
  const availablePaymentMethods = supportedPaymentMethods.filter((method) =>
    paymentMethods.includes(method.value)
  )

  const renderPaymentComponent = (method) => {
    switch (method) {
      case 'card':
        return <CardPayment invitationId={invitation.id} />
      case 'wechatAliPay':
        return <WechatAliPayment invitationId={invitation.id} />
      default:
        return null
    }
  }

  if (value) return <span>{`Payment Id: ${value}`}</span>

  return (
    <div className={styles.paymentContainer}>
      <Dropdown
        className={styles.paymentMethodDropdown}
        placeholder="Select Payment Method"
        options={availablePaymentMethods}
        value={availablePaymentMethods.find((option) => option.value === paymentMethod)}
        onChange={(selectedOption) => setPaymentMethod(selectedOption.value)}
      />

      {renderPaymentComponent(paymentMethod)}
    </div>
  )
}

export default PaymentWidget
