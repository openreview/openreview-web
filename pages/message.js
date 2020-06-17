/* globals $: false */
/* globals Handlebars: false */

import { useState, useEffect, useRef } from 'react'
import debounce from 'lodash/debounce'
import Head from 'next/head'
import Router from 'next/router'
import Table from '../components/Table'
import ErrorAlert from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import MultiSelectorDropdown from '../components/MultiSelectorDropdown'
import { auth } from '../lib/auth'
import api from '../lib/api-client'
import { formatTimestamp } from '../lib/utils'

import '../styles/pages/message.less'

const statusSearchFilters = [
  { text: 'Delivered', value: 'delivered' },
  { text: 'Bounced', value: 'bounce' },
  { text: 'Processed', value: 'processed' },
  { text: 'Dropped', value: 'dropped' },
  { text: 'Error', value: 'error' },
  { text: 'Blocked', value: 'blocked' },
  { text: 'Deferred', value: 'deferred' },
]

const MessageRow = ({ message }) => (
  <tr>
    <td>
      <span className={`status ${message.status === 'delivered' ? 'delivered' : 'not-delivered'}`}>
        {message.status}
      </span>
    </td>
    <td>
      <div className="clearfix">
        <div className="email-to pull-left">
          To:
          <span>{message.content?.to}</span>
        </div>
        <div className="email-sent pull-right">
          Sent:
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>
      </div>
      <div className="email-title">
        <strong>{message.content?.subject}</strong>
      </div>
      <div role="button" tabIndex="0" className="email-content collapsed" onClick={e => e.currentTarget.classList.toggle('collapsed')} onKeyDown={e => e.currentTarget.classList.toggle('collapsed')}>
        <p>{message.content?.text}</p>
        <div className="gradient-overlay" />
      </div>
      <div>
        <a href={`/messages?id=${message.id}`} target="_blank" rel="noreferrer" className="log-link">Message Log</a>
      </div>
    </td>
  </tr>
)

const MessagesTable = ({ messages }) => (
  <Table headings={[
    { id: 'status', content: 'Status', width: '96px' },
    { id: 'details', content: 'Message Details' }]}
  >
    {messages.length !== 0 && messages.map((m, i) => (
      <MessageRow key={m.id} message={m} />
    ))}
  </Table>
)

const FilterForm = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState({
    statuses: [],
    subject: '',
    recipient: '',
  })
  const handleSelectStatusChange = (value) => {
    setFilters({ type: 'status', statuses: value })
  }
  const handleSubjectChange = (value) => {
    setFilters({ type: 'subject', subject: value })
  }
  const handleRecipientChange = (value) => {
    setFilters({ type: 'recipient', recipient: value })
  }

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters])

  return (
    <form className="filter-controls form-inline text-center well" onSubmit={e => e.preventDefault()}>
      <div className="form-group">
        <label htmlFor="status-search-dropdown">Status:</label>
        <MultiSelectorDropdown
          id="status-search-dropdown"
          filters={statusSearchFilters}
          onSelectionChange={handleSelectStatusChange}
          parentId="status-search-dropdown"
        />
      </div>
      <div className="form-group">
        <label htmlFor="subject-search-input">Subject:</label>
        <input type="text" id="subject-search-input" className="form-control" placeholder="Message subject" onChange={e => handleSubjectChange(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="to-search-input">To:</label>
        <input type="text" id="to-search-input" className="form-control" placeholder="To address" onChange={e => handleRecipientChange(e.target.value)} />
      </div>
    </form>
  )
}

const Message = ({ accessToken, appContext }) => {
  const [messages, setMessages] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchParams, setSearchParams] = useState({
    limit: 20,
    status: '',
    subject: '',
    to: '',
    offset: 0,
  })

  const handleSearchParamChange = debounce((filters) => {
    if (filters.type === 'status') {
      setSearchParams({ ...searchParams, status: filters.statuses })
    }
    if (filters.type === 'subject') {
      setSearchParams({ ...searchParams, subject: filters.subject ? `${filters.subject}.*` : '' })
    }
    if (filters.type === 'recipient') {
      if (filters.recipient === '' || filters.recipient.includes('@')) {
        setSearchParams({ ...searchParams, to: filters.recipient })
      }
    }
  }, 500)

  const loadMessages = async () => {
    try {
      const apiRes = await api.get('/messages', searchParams, { accessToken })
      setMessages(apiRes.messages)
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    setMessages([])
    if (searchParams.status.length) {
      setIsLoading(true)
      loadMessages()
        .then(() => setIsLoading(false))
    }
  }, [searchParams])

  return (
    <div>

      <Head>
        <title key="title">Message Viewer | OpenReview</title>
      </Head>

      <header>
        <h1 className="text-center">Message Viewer</h1>
      </header>

      <FilterForm onFiltersChange={handleSearchParamChange} />

      {error && (
        <ErrorAlert error={error} />
      )}

      {messages && (
        <MessagesTable messages={messages} />
      )}

      {!isLoading && !messages.length && (
        <div className="empty-message text-center">No messages found</div>
      )}

      {isLoading && <LoadingSpinner inline />}

    </div>
  )
}

Message.getInitialProps = async (ctx) => {
  const { user, token } = auth(ctx)
  if (!user) {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: '/login' }).end()
    } else {
      Router.replace('/login')
    }
  }
  return { accessToken: token }
}

Message.bodyClass = 'message'

export default Message
