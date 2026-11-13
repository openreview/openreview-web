import { Button, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useEffect, useState } from 'react'
import useSocket from '../../hooks/useSocket'
import api from '../../lib/api-client'
import { getPaymentStatus, prettyId } from '../../lib/utils'
import LoadingIcon from '../LoadingIcon'

dayjs.extend(relativeTime)

const isPaperActive = async (domain, paperVenueId) => {
  const domainGroup = await api.getGroupById(domain)
  return paperVenueId === domainGroup?.content?.submission_venue_id?.value
}

const PaymentButton = ({ forumNote }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)

  const getCheckoutLink = async () => {
    setIsLoading(true)
    try {
      const { url } = await api.post('/payments/checkout', {
        invitation: paymentStatus.invitationId,
        payment: {
          note: forumNote.id,
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
        replyForum: forumNote.id,
        type: 'payment',
        details: 'repliedPayments',
        expired: true,
      })
      const paymentInvitation = invitations[0]
      const result = await getPaymentStatus(
        paymentInvitation,
        paymentInvitation?.details?.repliedPayments,
        () => isPaperActive(paymentInvitation.domain, forumNote.content?.venueid?.value)
      )
      setPaymentStatus(result)
    } catch {
      /* empty */
    }
  }

  const cancelCheckout = async () => {
    setIsLoading(true)
    try {
      await api.post(`/payments/${paymentStatus.payment.id}/cancel`)
    } catch (error) {
      promptError(error.message)
    }
    await loadPaymentInvitation()
    setIsLoading(false)
  }

  useEffect(() => {
    loadPaymentInvitation()
  }, [forumNote.id])

  const events = useSocket(
    ['inProgressCancelable', 'inProgressNotCancelable'].includes(paymentStatus?.status)
      ? 'payment'
      : undefined,
    ['payment-updated', 'connect'],
    { id: paymentStatus?.payment?.id }
  )

  useEffect(() => {
    if (!events) return
    loadPaymentInvitation()
  }, [events?.uniqueId])

  if (!paymentStatus) return null

  switch (paymentStatus.status) {
    case 'payable':
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
    case 'paid':
      return (
        <Tag color="#3e6775" variant="outlined">
          Fee paid
        </Tag>
      )
    case 'waived':
      return (
        <Tag color="#3e6775" variant="outlined">
          Fee waived
        </Tag>
      )
    case 'inProgressCancelable':
      return (
        <Tooltip
          title={`Payment initiated by ${prettyId(paymentStatus.payment.signature)} ${dayjs(paymentStatus.payment.cdate).fromNow()}`}
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
    case 'inProgressNotCancelable':
      return (
        <Tooltip
          title={`Payment initiated by ${prettyId(paymentStatus.payment.signature)} ${dayjs(paymentStatus.payment.cdate).fromNow()}`}
        >
          <Button type="primary" disabled>
            Payment in Progress
          </Button>
        </Tooltip>
      )
    case 'failed':
      return (
        <Button type="primary" disabled>
          Payment Failed
        </Button>
      )
    default:
      return null
  }
}

export default PaymentButton
