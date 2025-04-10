'use client'

/* globals promptError: false */
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import Link from 'next/link'
import styles from './Notifications.module.scss'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorAlert from '../../components/ErrorAlert'
import api from '../../lib/api-client'
import NotificationsTable from './NotificationsTable'
import useUser from '../../hooks/useUser'
import Table from '../../components/Table'
import { decrementNotificationCount } from '../../notificationSlice'

export default function Page() {
  const { user, accessToken, isRefreshing } = useUser()
  const [toEmail, setToEmail] = useState(null)
  const [confirmedEmails, setConfirmedEmails] = useState(null)
  const [unviewedCounts, setUnviewedCounts] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailQueryParam = searchParams.get('email')
  const dispatch = useDispatch()

  const markAllViewed = async () => {
    try {
      const apiRes = await api.get(
        '/messages',
        { to: toEmail, viewed: false },
        { accessToken }
      )
      if (!apiRes.messages?.length) return

      const unreadMessageIds = apiRes.messages.map((m) => m.id)
      await api.post(
        '/messages/viewed',
        { ids: unreadMessageIds, vdate: Date.now() },
        { accessToken }
      )

      setUnviewedCounts({
        ...unviewedCounts,
        [toEmail]: unviewedCounts[toEmail] - unreadMessageIds.length,
      })
      dispatch(decrementNotificationCount(unreadMessageIds.length))
    } catch (apiError) {
      promptError(apiError.message)
    }
  }
  const markViewed = async (messageId) => {
    const now = Date.now()
    try {
      await api.post('/messages/viewed', { ids: [messageId], vdate: now }, { accessToken })
      setUnviewedCounts({
        ...unviewedCounts,
        [toEmail]: unviewedCounts[toEmail] - 1,
      })
      dispatch(decrementNotificationCount(1))
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const getMessages = async () => {
    try {
      const profileResult = await api.get('/profiles', {}, { accessToken })
      const { preferredEmail, emailsConfirmed } = profileResult?.profiles?.[0]?.content ?? {}
      // eslint-disable-next-line no-shadow
      const confirmedEmails = preferredEmail
        ? [preferredEmail, ...emailsConfirmed.filter((email) => email !== preferredEmail)]
        : emailsConfirmed
      setConfirmedEmails(confirmedEmails)

      const result = await Promise.all(
        confirmedEmails.map((email) =>
          api
            .get('/messages', { to: email, viewed: false }, { accessToken })
            .then((apiRes) => ({ email, count: apiRes.messages?.length ?? 0 }))
        )
      ).then((results) =>
        results.reduce((prev, curr) => {
          // eslint-disable-next-line no-param-reassign
          prev[curr.email] = curr.count
          return prev
        }, {})
      )
      setUnviewedCounts(result)
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!accessToken) {
      router.push('/login?redirect=/notifications')
      return
    }
    getMessages()
    setToEmail(emailQueryParam || user.profile.preferredEmail || user.profile.emails[0])
  }, [isRefreshing, emailQueryParam])

  return (
    <div className={styles.notifications}>
      {error && <ErrorAlert error={error} />}

      {(!unviewedCounts || !confirmedEmails) && !error && <LoadingSpinner inline />}

      {unviewedCounts && confirmedEmails && (
        <div className="row">
          <div className="filters-col">
            <Table
              className="filters-table"
              headings={[{ id: 'filters', content: <span>Inboxes</span> }]}
            >
              <tr>
                <td>
                  <ul className="nav nav-pills nav-stacked">
                    {confirmedEmails.map((email) => (
                      <li
                        key={email}
                        role="presentation"
                        className={toEmail === email ? 'active' : null}
                        onClick={(e) => {
                          router.push(`/notifications?email=${encodeURIComponent(email)}`)
                        }}
                      >
                        <Link
                          href={`/notifications?email=${encodeURIComponent(email)}`}
                          title={email}
                        >
                          {email}
                        </Link>
                        {unviewedCounts?.[email] > 0 && (
                          <span className="badge badge-light">{unviewedCounts[email]}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            </Table>
          </div>

          <div className="messages-col">
            <NotificationsTable
              toEmail={toEmail}
              numUnviewed={unviewedCounts?.[toEmail] ?? 0}
              markViewed={markViewed}
              markAllViewed={markAllViewed}
            />
          </div>
        </div>
      )}
    </div>
  )
}
