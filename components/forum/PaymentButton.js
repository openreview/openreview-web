import { CheckCircleOutlined } from '@ant-design/icons'
import { Button, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import LoadingIcon from '../LoadingIcon'

dayjs.extend(relativeTime)

const PaymentButton = ({ forumNoteId }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)

  const getCheckoutLink = async () => {
    setIsLoading(true)
    try {
      const { url } = await api.post('/payments/checkout', {
        invitation: paymentStatus.invitationId,
        payment: {
          note: forumNoteId,
        },
        cancelUrl: window.location.href,
      })
      window.location.href = url
    } catch (error) {
      promptError(error.message)
      setIsLoading(false)
    }
  }

  const loadPaymentInvitation = async () => {
    try {
      const { invitations } = await api.get('/invitations', {
        replyForum: forumNoteId,
        type: 'payment',
        details: 'repliedPayments',
      })
      const paymentInvitation = invitations[0]
      if (!paymentInvitation) return
      const payments = paymentInvitation.details.repliedPayments
      const amount = paymentInvitation.content.amount.value
      const checkoutPayment = payments.find((p) => p.status === 'pending')
      if (payments.some((p) => p.status === 'paid')) {
        setPaymentStatus({ invitationId: paymentInvitation.id, amount, status: 'paid' })
      } else if (payments.some((p) => p.status === 'waived')) {
        setPaymentStatus({ invitationId: paymentInvitation.id, amount, status: 'waived' })
      } else if (checkoutPayment) {
        setPaymentStatus({
          invitationId: paymentInvitation.id,
          amount,
          status: 'pending',
          checkoutPayment,
        })
      } else {
        setPaymentStatus({ invitationId: paymentInvitation.id, amount, status: 'unsettled' })
      }
    } catch {
      /* empty */
    }
  }

  const cancelCheckout = async () => {
    setIsLoading(true)
    try {
      await api.post(`/payments/${paymentStatus.checkoutPayment.id}/cancel`)
    } catch (error) {
      promptError(error.message)
    }
    await loadPaymentInvitation()
    setIsLoading(false)
  }

  useEffect(() => {
    loadPaymentInvitation()
  }, [forumNoteId])

  useEffect(() => {
    if (paymentStatus?.status !== 'pending') return undefined
    // A completed payment stays pending until the processor's confirmation reaches the API, usually within seconds
    const timers = [5000, 10000, 30000].map((delay) =>
      setTimeout(loadPaymentInvitation, delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [paymentStatus?.status])

  if (!paymentStatus) return null

  if (paymentStatus.status === 'paid' || paymentStatus.status === 'waived') {
    return (
      <Tag color="success" icon={<CheckCircleOutlined />}>
        {paymentStatus.status === 'paid' ? 'Fee paid' : 'Fee waived'}
      </Tag>
    )
  }

  if (paymentStatus.status === 'pending') {
    return (
      <Tooltip
        title={`Payment initiated by ${prettyId(paymentStatus.checkoutPayment.signatures[0])} ${dayjs(paymentStatus.checkoutPayment.cdate).fromNow()}`}
      >
        <Button
          iconPlacement="end"
          loading={isLoading ? { icon: <LoadingIcon /> } : false}
          onClick={cancelCheckout}
        >
          Cancel Payment
        </Button>
      </Tooltip>
    )
  }

  return (
    <Button
      type="primary"
      iconPlacement="end"
      loading={isLoading ? { icon: <LoadingIcon /> } : false}
      onClick={getCheckoutLink}
    >
      Pay Submission Fee (${(paymentStatus.amount / 100).toFixed(2)})
    </Button>
  )
}

export default PaymentButton
