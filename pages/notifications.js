import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import Table from '../components/Table'
import useLoginRedirect from '../hooks/useLoginRedirect'
import api from '../lib/api-client'
import MessagesTable from '../components/MessagesTable'
import PaginationLinks from '../components/PaginationLinks'

export default function Notifications({ appContext }) {
  const { user, accessToken } = useLoginRedirect()
  const [toEmail, setToEmail] = useState(null)
  const [messages, setMessages] = useState(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)
  const router = useRouter()
  const { setBannerHidden } = appContext
  const pageSize = 25

  useEffect(() => {
    if (!user || !router.isReady) return

    setBannerHidden(true)

    setToEmail(router.query.email || user.profile.preferredEmail || user.profile.emails[0])
    setPage(1)
  }, [user?.id, router.isReady, router.query.email])

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
                    {user.profile.emails.map((email) => (
                      <li
                        key={email}
                        role="presentation"
                        className={toEmail === email ? 'active' : null}
                      >
                        <Link href={`/notifications?email=${email}`}>
                          <a title={email}>{email}</a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            </Table>
          </div>

          <div className="messages-col">
            <MessagesTable messages={messages} />

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
