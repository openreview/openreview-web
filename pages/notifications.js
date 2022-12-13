/* globals promptError: false */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import zip from 'lodash/zip'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import Table from '../components/Table'
import useLoginRedirect from '../hooks/useLoginRedirect'
import api from '../lib/api-client'
import NotificationsTable from '../components/NotificationsTable'
import PaginationLinks from '../components/PaginationLinks'

export default function Notifications({ appContext }) {
  const { user, accessToken } = useLoginRedirect()
  const [toEmail, setToEmail] = useState(null)
  const [unviewedCounts, setUnviewedCounts] = useState(null)
  const [messages, setMessages] = useState(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)
  const router = useRouter()
  const { setBannerHidden, decrementGlobalNotificationCount } = appContext
  const pageSize = 25
  const orderedUserEmails = user?.profile.preferredEmail
    ? [
        user.profile.preferredEmail,
        ...user.profile.emails.filter((email) => email !== user.profile.preferredEmail),
      ]
    : user?.profile.emails

  const markViewed = async (messageId) => {
    const now = Date.now()
    const index = messages.findIndex((m) => m.id === messageId)
    if (index < 0 || messages[index].vdate) return

    // Optimistically mark message as viewed and revert if there is an error
    setMessages(Object.assign([...messages], { [index]: { ...messages[index], vdate: now } }))
    try {
      await api.post('/messages/viewed', { ids: [messageId], vdate: now }, { accessToken })
      setUnviewedCounts({
        ...unviewedCounts,
        [toEmail]: unviewedCounts[toEmail] - 1,
      })
      // TODO:
      // decrewmentGlobalNotificationCount()
    } catch (apiError) {
      promptError(apiError.message)
      setMessages(
        Object.assign([...messages], { [index]: { ...messages[index], vdate: null } })
      )
    }
  }

  useEffect(() => {
    if (!user || !router.isReady) return

    setBannerHidden(true)

    setToEmail(router.query.email || user.profile.preferredEmail || user.profile.emails[0])
    setPage(1)
  }, [user?.id, router.isReady, router.query.email])

  useEffect(() => {
    if (!accessToken) return

    // Load count of unviewed messages for all emails
    Promise.all(
      user.profile.emails.map((email) =>
        api
          .get('/messages', { to: email, viewed: false }, { accessToken })
          .then((apiRes) => apiRes.count ?? 0)
      )
    )
      .then((counts) => {
        setUnviewedCounts(Object.fromEntries(zip(user.profile.emails, counts)))
      })
      .catch(() => {
        promptError('Could not load unviewed message count')
      })
  }, [accessToken])

  useEffect(() => {
    if (!toEmail || !accessToken) return

    api
      .get(
        '/messages',
        {
          to: toEmail,
          limit: pageSize,
          offset: pageSize * (page - 1),
        },
        { accessToken }
      )
      .then((apiRes) => {
        setMessages(apiRes.messages ?? [])
        setCount(apiRes.count ?? 0)
        setError(null)
      })
      .catch((apiError) => {
        setError(apiError)
        setMessages(null)
      })
  }, [accessToken, toEmail, page])

  return (
    <div>
      <Head>
        <title key="title">Notifications | OpenReview</title>
      </Head>

      <header>
        <h1>Notifications</h1>
      </header>

      {error && <ErrorAlert error={error} />}

      {!messages && !error && <LoadingSpinner inline />}

      {messages && user && (
        <div className="row">
          <div className="filters-col">
            <Table
              className="filters-table"
              headings={[{ id: 'filters', content: 'Inboxes' }]}
            >
              <tr>
                <td>
                  <ul className="nav nav-pills nav-stacked">
                    {orderedUserEmails.map((email) => (
                      <li
                        key={email}
                        role="presentation"
                        className={toEmail === email ? 'active' : null}
                      >
                        <Link href={`/notifications?email=${email}`}>
                          <a title={email}>{email}</a>
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
            <NotificationsTable messages={messages} markViewed={markViewed} />

            <PaginationLinks
              currentPage={page}
              setCurrentPage={setPage}
              itemsPerPage={pageSize}
              totalCount={count}
            />
          </div>
        </div>
      )}
    </div>
  )
}

Notifications.bodyClass = 'notifications'
