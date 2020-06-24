import { useState, useEffect, useCallback } from 'react'
import debounce from 'lodash/debounce'
import Head from 'next/head'
import withAdminAuth from '../components/withAdminAuth'
import MessagesTable from '../components/MessagesTable'
import ErrorAlert from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import MultiSelectorDropdown from '../components/MultiSelectorDropdown'
import PaginationLinks from '../components/PaginationLinks'
import api from '../lib/api-client'

import '../styles/pages/messages.less'

const FilterForm = ({ onFiltersChange, loading }) => {
  const statusOptions = [
    { text: 'Delivered', value: 'delivered' },
    { text: 'Bounced', value: 'bounce' },
    { text: 'Processed', value: 'processed' },
    { text: 'Dropped', value: 'dropped' },
    { text: 'Error', value: 'error' },
    { text: 'Blocked', value: 'blocked' },
    { text: 'Deferred', value: 'deferred' },
  ]
  const [selectedStatuses, setSelectedStatuses] = useState(statusOptions.map(option => option.value))

  const handleSelectStatusChange = (values) => {
    setSelectedStatuses(values)
    onFiltersChange({ type: 'status', statuses: values.length === statusOptions.length ? null : values })
  }
  const handleSubjectChange = (value) => {
    onFiltersChange({ type: 'subject', subject: value })
  }
  const handleRecipientChange = (value) => {
    onFiltersChange({ type: 'recipient', recipient: value })
  }

  return (
    <form className="filter-controls form-inline text-center well" onSubmit={e => e.preventDefault()}>
      <div className="form-group">
        <label htmlFor="status-search-dropdown">Status:</label>
        <MultiSelectorDropdown
          id="status-search-dropdown"
          options={statusOptions}
          selectedValues={selectedStatuses}
          setSelectedValues={handleSelectStatusChange}
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="subject-search-input">Subject:</label>
        <input type="text" id="subject-search-input" className="form-control" placeholder="Message subject" disabled={loading} onChange={e => handleSubjectChange(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="to-search-input">To:</label>
        <input type="text" id="to-search-input" className="form-control" placeholder="To address" disabled={loading} onChange={e => handleRecipientChange(e.target.value)} />
      </div>
      {loading && (
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

const Messages = ({
  status, subject, to, page, accessToken, appContext,
}) => {
  const [messages, setMessages] = useState(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchParams, setSearchParams] = useState(null)
  const currentPage = parseInt(page, 10) || 1
  const pageSize = 25
  const { setBannerHidden } = appContext

  const handleSearchParamChange = (filters) => {
    if (filters.type === 'status') {
      setSearchParams({ ...searchParams, status: filters.statuses })
    }
    if (filters.type === 'subject') {
      setSearchParams({ ...searchParams, subject: filters.subject ? `${filters.subject}.*` : '' })
    }
    if (filters.type === 'recipient' && (filters.recipient === '' || filters.recipient.includes('@'))) {
      setSearchParams({ ...searchParams, to: filters.recipient })
    }
  }

  const updateFilters = useCallback(debounce(handleSearchParamChange, 300), [])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const apiRes = await api.get('/messages', {
        ...searchParams,
        limit: pageSize,
        offset: pageSize * (currentPage - 1),
      }, { accessToken })

      setMessages(apiRes.messages || [])
      setCount(apiRes.count || 0)
    } catch (apiError) {
      setError(apiError)
      setMessages(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    setBannerHidden(true)
  }, [page])

  useEffect(() => {
    setSearchParams({
      status: status || null,
      subject: subject || null,
      to: to || null,
    })
  }, [status, subject, to])

  useEffect(() => {
    if (!searchParams) return
    console.log(searchParams)
    if (searchParams.status?.length === 0) {
      setMessages([])
      setCount(0)
    } else {
      loadMessages()
    }
  }, [searchParams, page])

  return (
    <div>
      <Head>
        <title key="title">Message Viewer | OpenReview</title>
      </Head>

      <header>
        <h1 className="text-center">Message Viewer</h1>
      </header>

      <FilterForm onFiltersChange={updateFilters} loading={loading} />

      {error && (
        <ErrorAlert error={error} />
      )}

      {messages && (
        <MessagesTable messages={messages} />
      )}

      {messages && (
        <PaginationLinks
          currentPage={currentPage}
          itemsPerPage={pageSize}
          totalCount={count}
          baseUrl="/messages"
          queryParams={searchParams}
        />
      )}

      {(!messages && !error) && (
        <LoadingSpinner inline />
      )}
    </div>
  )
}

Messages.bodyClass = 'messages'

export default withAdminAuth(Messages)
