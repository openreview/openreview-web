/* globals promptError: false */

import { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import zip from 'lodash/zip'
import sum from 'lodash/sum'
import UserContext from '../components/UserContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import Table from '../components/Table'
import NotificationsTable from '../components/NotificationsTable'
import PaginationLinks from '../components/PaginationLinks'
import useLoginRedirect from '../hooks/useLoginRedirect'
import api from '../lib/api-client'

export default function Notifications({ appContext }) {
  const { user, accessToken } = useLoginRedirect()
  const [toEmail, setToEmail] = useState(null)
  const [confirmedEmails, setConfirmedEmails] = useState(null)
  const [unviewedCounts, setUnviewedCounts] = useState(null)
  const [messages, setMessages] = useState(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)
  const router = useRouter()
  const { setUnreadNotificationCount, decrementNotificationCount } = useContext(UserContext)
  const { setBannerHidden } = appContext
  const pageSize = 25

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
      decrementNotificationCount()
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

    api
      .get('/profiles', {}, { accessToken })
      .then(({ profiles }) => {
        if (profiles?.length > 0) {
          const { preferredEmail, emailsConfirmed } = profiles[0].content
          setConfirmedEmails(
            preferredEmail
              ? [
                  preferredEmail,
                  ...emailsConfirmed.filter((email) => email !== preferredEmail),
                ]
              : emailsConfirmed
          )
        } else {
          setError({ message: 'Could not load user profile. Please reload the page.' })
          setConfirmedEmails(null)
        }
      })
      .catch((apiError) => {
        setError({ message: `Error loading user profile: ${apiError.message}` })
        setConfirmedEmails(null)
      })
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !confirmedEmails) return

    // Load count of unviewed messages for all emails
    Promise.all(
      confirmedEmails.map((email) =>
        api
          .get('/messages', { to: email, viewed: false }, { accessToken })
          .then((apiRes) => apiRes.count ?? 0)
      )
    )
      .then((counts) => {
        setUnviewedCounts(Object.fromEntries(zip(confirmedEmails, counts)))
        setUnreadNotificationCount(sum(counts))
      })
      .catch(() => {
        promptError('Could not load unviewed message count')
        setUnviewedCounts({})
      })
  }, [accessToken, confirmedEmails])

  useEffect(() => {
    if (!accessToken || !toEmail) return

    setError(null)

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

      {(!messages || !confirmedEmails) && !error && <LoadingSpinner inline />}

      {messages && confirmedEmails && (
        <div className="row">
          <div className="filters-col">
            <Table
              className="filters-table"
              headings={[{ id: 'filters', content: 'Inboxes' }]}
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
                          router.push(`/notifications?email=${encodeURIComponent(email)}`, undefined, {
                            shallow: true,
                          })
                        }}
                      >
                        <Link href={`/notifications?email=${encodeURIComponent(email)}`} shallow>
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
