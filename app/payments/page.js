'use client'

import { Button, Checkbox, Collapse, Flex, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { sortBy } from 'lodash'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ErrorAlert from '../../components/ErrorAlert'
import LoadingIcon from '../../components/LoadingIcon'
import LoadingSpinner from '../../components/LoadingSpinner'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const { Text, Paragraph } = Typography

dayjs.extend(relativeTime)

function VenueFees({ venue, reloadFees }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [isPaying, setIsPaying] = useState(false)
  const [cancelingId, setCancelingId] = useState(null)

  const pendingFees = sortBy(venue.pending, 'number')
  const settledFees = sortBy(venue.settled, 'number')

  const duedate = pendingFees[0]?.duedate

  const selectedFees = pendingFees.filter((fee) => selectedIds.includes(fee.invitationId))
  const totalAmount = selectedFees.reduce((sum, fee) => sum + fee.amount, 0)

  const getCheckoutLink = async () => {
    setIsPaying(true)
    const cancelUrl = window.location.href
    try {
      if (selectedFees.length === 1) {
        const [fee] = selectedFees
        const { url } = await api.post('/payments/checkout', {
          invitation: fee.invitationId,
          payment: { note: fee.noteId },
          cancelUrl,
        })
        window.location.href = url
        return
      }

      const { jobId } = await api.post('/payments/checkout/bulk', {
        payments: selectedFees.map((fee) => ({
          invitation: fee.invitationId,
          payment: { note: fee.noteId },
        })),
        cancelUrl,
      })
      // Check the job every second while the author waits, for up to 30 seconds
      const waitForCheckout = async (attempt) => {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000)
        })
        const job = await api.get(`/payments/checkout/${jobId}`)
        if (job.status === 'ok') return job.url
        if (job.status === 'error') {
          throw new Error(job.error?.message ?? 'The payment could not be started')
        }
        if (attempt >= 30) {
          throw new Error(
            'Starting the payment is taking longer than expected, please try again later'
          )
        }
        return waitForCheckout(attempt + 1)
      }
      window.location.href = await waitForCheckout(1)
    } catch (apiError) {
      promptError(apiError.message)
      setIsPaying(false)
      reloadFees()
    }
  }

  const cancelCheckout = async (paymentId) => {
    setCancelingId(paymentId)
    try {
      await api.post(`/payments/${paymentId}/cancel`)
    } catch (apiError) {
      promptError(apiError.message)
    }
    await reloadFees()
    setCancelingId(null)
  }

  return (
    <Flex vertical gap="middle">
      {pendingFees.length > 0 && (
        <Flex vertical gap="middle">
          <Flex justify="space-between" align="center" wrap gap="small">
            <Flex align="baseline" wrap gap="middle">
              <h4>Pending</h4>
              {duedate && (
                <Text type="secondary">
                  Due:{' '}
                  {new Date(duedate).toLocaleDateString('en-GB', {
                    hour: 'numeric',
                    minute: 'numeric',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    timeZoneName: 'long',
                  })}
                </Text>
              )}
            </Flex>
            {selectedFees.length > 0 && (
              <Flex align="center" gap="middle">
                <Text strong>Total ${(totalAmount / 100).toFixed(2)}</Text>
                <Button
                  type="primary"
                  iconPlacement="end"
                  loading={isPaying ? { icon: <LoadingIcon /> } : false}
                  onClick={getCheckoutLink}
                >
                  Pay Selected ({selectedFees.length})
                </Button>
              </Flex>
            )}
          </Flex>
          {pendingFees.map((fee) => (
            <Flex key={fee.invitationId} justify="space-between" align="start" gap="middle">
              <Flex align="start" gap="small">
                <Checkbox
                  checked={selectedIds.includes(fee.invitationId)}
                  disabled={Boolean(fee.checkoutPayment) || isPaying}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds((ids) => [...ids, fee.invitationId])
                      return
                    }
                    setSelectedIds((ids) => ids.filter((p) => p !== fee.invitationId))
                  }}
                  aria-label={`Select Submission ${fee.number}`}
                />
                <div>
                  <Text strong>
                    <a href={`/forum?id=${fee.noteId}`}>{fee.title}</a>
                  </Text>
                  <Flex align="center" wrap gap="small">
                    <Text type="secondary">Submission {fee.number}</Text>
                    {fee.checkoutPayment && (
                      <>
                        <Tag>Payment in progress</Tag>
                        <Text type="secondary">
                          Initiated by {prettyId(fee.checkoutPayment.signatures[0])}{' '}
                          {dayjs(fee.checkoutPayment.cdate).fromNow()}
                        </Text>
                        <Button
                          type="link"
                          size="small"
                          loading={
                            cancelingId === fee.checkoutPayment.id
                              ? { icon: <LoadingIcon /> }
                              : false
                          }
                          onClick={() => cancelCheckout(fee.checkoutPayment.id)}
                        >
                          Cancel Payment
                        </Button>
                      </>
                    )}
                  </Flex>
                </div>
              </Flex>
              <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                ${(fee.amount / 100).toFixed(2)}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}

      {settledFees.length > 0 && (
        <Flex vertical gap="middle">
          <h4>Settled</h4>
          {settledFees.map((fee) => (
            <Flex key={fee.invitationId} justify="space-between" align="start" gap="middle">
              <div>
                <a href={`/forum?id=${fee.noteId}`}>{fee.title}</a>
                <Flex align="center" wrap gap="small">
                  <Text type="secondary">Submission {fee.number}</Text>
                  <Tag color="success">
                    {fee.status === 'paid' ? 'Fee paid' : 'Fee waived'}
                  </Tag>
                  <Text type="secondary">
                    {dayjs(fee.payment.mdate).format('MMMM D, YYYY')}
                    {fee.status === 'paid' && ` by ${prettyId(fee.payment.signatures[0])}`}
                  </Text>
                </Flex>
              </div>
              <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                {fee.status === 'paid' && `$${(fee.payment.amount / 100).toFixed(2)}`}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  )
}

export default function Page() {
  const { user, isRefreshing } = useUser()
  const [venues, setVenues] = useState(null)
  const [activeDomain, setActiveDomain] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  const loadPayments = async () => {
    try {
      const invitations = await api.getAll('/invitations', {
        invitee: true,
        type: 'payment',
        details: 'replytoNote,repliedPayments',
      })

      const venueMap = new Map()
      invitations.forEach((invitation) => {
        const feePayments = invitation.details.repliedPayments
        const paidPayment = feePayments.find((p) => p.status === 'paid')
        const waivedPayment = feePayments.find((p) => p.status === 'waived')
        const fee = {
          invitationId: invitation.id,
          noteId: invitation.edit.payment.note,
          number: invitation.details.replytoNote.number,
          title: invitation.details.replytoNote.content.title.value,
          duedate: invitation.duedate,
          amount: invitation.content.amount.value,
        }

        if (!venueMap.has(invitation.domain)) {
          venueMap.set(invitation.domain, {
            domain: invitation.domain,
            pending: [],
            settled: [],
          })
        }
        const venue = venueMap.get(invitation.domain)
        if (paidPayment) {
          venue.settled.push({ ...fee, status: 'paid', payment: paidPayment })
        } else if (waivedPayment) {
          venue.settled.push({ ...fee, status: 'waived', payment: waivedPayment })
        } else {
          venue.pending.push({
            ...fee,
            checkoutPayment: feePayments.find((p) => p.status === 'pending'),
          })
        }
      })

      const loadedVenues = [...venueMap.values()].sort(
        (a, b) => Number(b.pending.length > 0) - Number(a.pending.length > 0)
      )
      setVenues(loadedVenues)
      if (!venues) setActiveDomain(loadedVenues.find((venue) => venue.pending.length)?.domain)
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!user) {
      router.push('/login?redirect=/payments')
      return
    }
    loadPayments()
  }, [isRefreshing])

  if (error) return <ErrorAlert error={error} />
  if (!venues) return <LoadingSpinner />

  return (
    <>
      <header>
        <h1>Submission Fees</h1>
      </header>
      <Paragraph type="secondary">
        Each submission&apos;s fee only needs to be settled once, by any one of its authors.
      </Paragraph>

      {venues.length ? (
        <Collapse
          accordion
          ghost
          destroyOnHidden
          activeKey={activeDomain}
          onChange={(keys) => setActiveDomain(keys[0])}
          items={venues.map((venue) => ({
            key: venue.domain,
            label: (
              <Flex align="baseline" wrap gap="small">
                <h3 style={{ margin: 0 }}>{prettyId(venue.domain)}</h3>
                <Text type="secondary">
                  {venue.pending.length ? `${venue.pending.length} pending` : 'All settled'}
                </Text>
              </Flex>
            ),
            children: <VenueFees venue={venue} reloadFees={loadPayments} />,
          }))}
        />
      ) : (
        <p className="empty-message">No submission fees for papers you are an author of</p>
      )}
    </>
  )
}
