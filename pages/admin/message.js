/* globals $: false */
/* globals Handlebars: false */

import { useState, useEffect, useCallback } from 'react'
import debounce from 'lodash/debounce'
import Head from 'next/head'
import { stringify } from 'query-string'
import withAdminAuth from '../../components/withAdminAuth'
import MessagesTable from '../../components/MessagesTable'
import ErrorAlert from '../../components/ErrorAlert'
import LoadingSpinner from '../../components/LoadingSpinner'
import MultiSelectorDropdown from '../../components/MultiSelectorDropdown'
import PaginationLinks from '../../components/PaginationLinks'
import { auth } from '../../lib/auth'
import api from '../../lib/api-client'

import '../../styles/pages/message.less'

const FilterForm = ({ onFiltersChange, isLoading }) => {
  const [filters, setFilters] = useState({
    statuses: [],
    subject: '',
    recipient: '',
  })
  const statusSearchFilters = [
    { text: 'Delivered', value: 'delivered' },
    { text: 'Bounced', value: 'bounce' },
    { text: 'Processed', value: 'processed' },
    { text: 'Dropped', value: 'dropped' },
    { text: 'Error', value: 'error' },
    { text: 'Blocked', value: 'blocked' },
    { text: 'Deferred', value: 'deferred' },
  ]
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
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="subject-search-input">Subject:</label>
        <input type="text" id="subject-search-input" className="form-control" placeholder="Message subject" disabled={isLoading} onChange={e => handleSubjectChange(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="to-search-input">To:</label>
        <input type="text" id="to-search-input" className="form-control" placeholder="To address" disabled={isLoading} onChange={e => handleRecipientChange(e.target.value)} />
      </div>
      {isLoading && (
        <div className="spinner-small">
          <div className="rect1" />
          <div className="rect2" />
          <div className="rect3" />
          <div className="rect4" />
        </div>
      )}
    </form>
  )
}

const Message = ({ page, accessToken, appContext }) => {
  const [messagesResult, setMessagesResult] = useState(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchParams, setSearchParams] = useState({
    status: '',
    subject: '',
    to: '',
  })
  const pageSize = 25

  const handleSearchParamChange = (filters) => {
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
  }

  const onParamChange = useCallback(debounce(handleSearchParamChange, 500))

  const loadMessages = async () => {
    try {
      const apiRes = await api.get('/messages', {
        ...searchParams,
        limit: pageSize,
        offset: pageSize * (page - 1),
      }, { accessToken })
      setMessagesResult(apiRes)
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    if (searchParams.status.length === 0) {
      setMessagesResult({ messages: [], count: 0 })
    } else {
      setIsLoading(true)
      loadMessages()
        .then(() => setIsLoading(false))
    }
  }, [searchParams])

  return (
    <div id="message-viewer-container">

      <Head>
        <title key="title">Message Viewer | OpenReview</title>
      </Head>

      <header>
        <h1 className="text-center">Message Viewer</h1>
      </header>

      <FilterForm onFiltersChange={onParamChange} isLoading={isLoading} />

      {error && (
        <ErrorAlert error={error} />
      )}

      {messagesResult && (
        <MessagesTable messages={messagesResult.messages} />
      )}

      {messagesResult && (
        <PaginationLinks
          currentPage={page}
          itemsPerPage={pageSize}
          totalCount={messagesResult.count}
          baseUrl={`/messages?${stringify(searchParams, { skipNull: true })}`}
        />
      )}

      {!isLoading && !messagesResult.messages?.length && (
        <div className="empty-message text-center">No messages found</div>
      )}

      {isLoading && <LoadingSpinner inline />}

    </div>
  )
}

Message.getInitialProps = async (ctx) => {
  const { user, token } = auth(ctx)
  return { accessToken: token }
}

Message.bodyClass = 'message'

export default withAdminAuth(Message)
