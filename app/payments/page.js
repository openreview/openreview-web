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
import { getPaymentStatus, prettyId } from '../../lib/utils'

const { Text, Paragraph } = Typography
const maxCheckoutCount = 25

dayjs.extend(relativeTime)

function getNoteStatus(note, domainGroup) {
  const venueId = note.content?.venueid?.value
  const domainContent = domainGroup?.content
  if (venueId === domainContent?.submission_venue_id?.value) return 'active'
  if (venueId === domainContent?.withdrawn_venue_id?.value) return 'withdrawn'
  if (venueId === domainContent?.desk_rejected_venue_id?.value) return 'deskRejected'
  return null
}

function VenueFees({ venue, reloadFees }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [isPaying, setIsPaying] = useState(false)
  const [cancelingId, setCancelingId] = useState(null)

  const pendingFees = sortBy(venue.pending, 'number')
  const settledFees = sortBy(venue.settled, 'number')

  const duedate = pendingFees[0]?.duedate

  const selectedFees = pendingFees.filter(
    (fee) => fee.status === 'payable' && selectedIds.includes(fee.invitationId)
  )
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

      const { url, jobId } = await api.post('/payments/checkout/bulk', {
        payments: selectedFees.map((fee) => ({
          invitation: fee.invitationId,
          payment: { note: fee.noteId },
        })),
        cancelUrl,
      })

      if (url) {
        window.location.href = url
      } else {
        // api returned 202
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
      }
    } catch (apiError) {
      promptError(apiError.message)
      setIsPaying(false)
      setSelectedIds([])
      reloadFees()
    }
  }

  const cancelCheckout = async (fee) => {
    const paymentId = fee.payment.id
    setCancelingId(paymentId)
    try {
      await api.post(`/payments/${paymentId}/cancel`)
    } catch (apiError) {
      promptError(apiError.message)
    }
    setSelectedIds((ids) => ids.filter((id) => id !== fee.invitationId))
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
                  checked={selectedFees.includes(fee)}
                  disabled={fee.status !== 'payable' || isPaying}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (selectedFees.length >= maxCheckoutCount) {
                        promptError(
                          `You can only pay for ${maxCheckoutCount} submissions at a time`
                        )
                        return
                      }
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
                    {fee.status === 'failed' && <Tag>Payment failed</Tag>}
                    {['inProgressCancelable', 'inProgressNotCancelable'].includes(
                      fee.status
                    ) && (
                      <>
                        <Tag>Payment in progress</Tag>
                        <Text type="secondary">
                          Initiated by {prettyId(fee.payment.signature)}{' '}
                          {dayjs(fee.payment.cdate).fromNow()}
                        </Text>
                        {fee.status === 'inProgressCancelable' && (
                          <Button
                            type="link"
                            size="small"
                            iconPlacement="end"
                            loading={
                              cancelingId === fee.payment.id
                                ? { icon: <LoadingIcon /> }
                                : false
                            }
                            onClick={() => cancelCheckout(fee)}
                          >
                            Cancel Payment
                          </Button>
                        )}
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
                  <Tag color="#3e6775" variant="outlined">
                    {fee.payment.status === 'paid' ? 'Fee paid' : 'Fee waived'}
                  </Tag>
                  {fee.noteStatus === 'withdrawn' && <Tag>Withdrawn</Tag>}
                  {fee.noteStatus === 'deskRejected' && <Tag>Desk rejected</Tag>}
                  <Text type="secondary">
                    {dayjs(fee.payment.mdate).format('MMMM D, YYYY')}
                    {fee.payment.status === 'paid' && ` by ${prettyId(fee.payment.signature)}`}
                  </Text>
                </Flex>
              </div>
              <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                {fee.payment.status === 'paid' && `$${(fee.payment.amount / 100).toFixed(2)}`}
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
        expired: true,
        trash: true,
      })
      const domains = new Set(invitations.map((invitation) => invitation.domain))
      const domainGroups = Object.fromEntries(
        await Promise.all(
          [...domains].map(async (domain) => [domain, await api.getGroupById(domain)])
        )
      )

      const fees = await Promise.all(
        invitations.map(async (invitation) => {
          const note = invitation.details.replytoNote
          if (!note) return null

          const noteStatus = getNoteStatus(note, domainGroups[invitation.domain])
          const paymentStatus = await getPaymentStatus(
            invitation,
            invitation.details.repliedPayments,
            () => noteStatus === 'active'
          )
          if (!paymentStatus) return null

          return {
            ...paymentStatus,
            domain: invitation.domain,
            noteId: invitation.edit.payment.note,
            number: note.number,
            title: note.content.title.value,
            duedate: invitation.duedate,
            noteStatus,
          }
        })
      )

      const venueMap = new Map()
      fees.forEach((fee) => {
        if (!fee) return
        if (!venueMap.has(fee.domain)) {
          venueMap.set(fee.domain, { domain: fee.domain, pending: [], settled: [] })
        }
        const venue = venueMap.get(fee.domain)
        if (
          ['paid', 'waived', 'paidInvitationDeleted', 'waivedInvitationDeleted'].includes(
            fee.status
          )
        ) {
          venue.settled.push(fee)
        } else {
          venue.pending.push(fee)
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
          styles={{ header: { paddingInline: 0 }, body: { paddingInline: 0 } }}
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
