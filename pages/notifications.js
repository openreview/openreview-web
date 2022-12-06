import { useState, useEffect } from 'react'
import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
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
  const { setBannerHidden } = appContext
  const pageSize = 25

  useEffect(() => {
    if (!user) return

    setBannerHidden(true)

    setToEmail(user.profile.preferredEmail || user.profile.emails[0])
    setPage(1)
  }, [user?.id])

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
          <div className="col-xs-12 col-md-2">
            <form className="filter-controls" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>Inboxes</label>
                <select
                  className="form-control"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                >
                  {user.profile.emails.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>
          <div className="col-xs-12 col-md-10">
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
