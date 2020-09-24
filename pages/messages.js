import {
  useState, useEffect, useContext, useCallback,
} from 'react'
import debounce from 'lodash/debounce'
import Head from 'next/head'
import { useRouter } from 'next/router'
import useQuery from '../hooks/useQuery'
import UserContext from '../components/UserContext'
import MessagesTable from '../components/MessagesTable'
import ErrorAlert from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import MultiSelectorDropdown from '../components/MultiSelectorDropdown'
import PaginationLinks from '../components/PaginationLinks'
import api from '../lib/api-client'

import '../styles/pages/messages.less'

const FilterForm = ({ searchQuery, loading }) => {
  const statusOptions = [
    { text: 'Delivered', value: 'delivered' },
    { text: 'Bounced', value: 'bounce' },
    { text: 'Processed', value: 'processed' },
    { text: 'Dropped', value: 'dropped' },
    { text: 'Error', value: 'error' },
    { text: 'Blocked', value: 'blocked' },
    { text: 'Deferred', value: 'deferred' },
  ]
  const queryStatus = searchQuery?.status ?? []
  const selectedStatuses = Array.isArray(queryStatus) ? queryStatus : [queryStatus]
  const router = useRouter()

  const onFiltersChange = (field, value) => {
    const newSearchQuery = { ...searchQuery, [field]: value }
    router.push({ pathname: '/messages', query: newSearchQuery }, undefined, { shallow: true })
  }
  const updateFilters = useCallback(debounce(onFiltersChange, 300), [searchQuery])

  const handleSelectStatusChange = (values) => {
    onFiltersChange('status', values)
  }
  const handleSubjectChange = (value) => {
    onFiltersChange('subject', value)
  }
  const handleRecipientChange = (value) => {
    onFiltersChange('to', value)
  }
  const handleParentGroupChange = (value) => {
    onFiltersChange('parentGroup', value)
  }

  return (
    <form className="filter-controls form-inline well" onSubmit={e => e.preventDefault()}>
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
        <input type="text" id="subject-search-input" className="form-control" placeholder="Message subject" disabled={loading} value={searchQuery?.subject ?? ''} onChange={e => handleSubjectChange(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="to-search-input">To:</label>
        <input type="text" id="to-search-input" className="form-control" placeholder="To address" disabled={loading} value={searchQuery?.to ?? ''} onChange={e => handleRecipientChange(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="parent-group-search-input">Parent:</label>
        <input type="text" id="parent-group-search-input" className="form-control" placeholder="Parent group" disabled={loading} value={searchQuery?.parentGroup ?? ''} onChange={e => handleParentGroupChange(e.target.value)} />
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

const Messages = ({ appContext }) => {
  const query = useQuery()
  const [messages, setMessages] = useState(null)
  const [count, setCount] = useState(0)
  const [error, setError] = useState(null)
  const page = parseInt(query?.page, 10) || 1
  const pageSize = 25
  const { setBannerHidden } = appContext
  const { accessToken, userLoading } = useContext(UserContext)

  const loadMessages = async () => {
    try {
      const apiRes = await api.get('/messages', {
        ...query,
        limit: pageSize,
        offset: pageSize * (page - 1),
      }, { accessToken })

      setMessages(apiRes.messages || [])
      setCount(apiRes.count || 0)
      setError(null)
    } catch (apiError) {
      setError(apiError)
      setMessages(null)
    }
  }

  useEffect(() => {
    if (userLoading || !query) return
    setBannerHidden(true)

    loadMessages()
  }, [userLoading, query])

  return (
    <div>
      <Head>
        <title key="title">Message Viewer | OpenReview</title>
      </Head>

      <header>
        <h1 className="text-center">Message Viewer</h1>
      </header>

      <FilterForm searchQuery={query} />

      {error && (
        <ErrorAlert error={error} />
      )}

      {messages && (
        <MessagesTable messages={messages} loading={userLoading} />
      )}

      {messages && (
        <PaginationLinks
          currentPage={page}
          itemsPerPage={pageSize}
          totalCount={count}
          baseUrl="/messages"
          queryParams={query}
        />
      )}

      {(!messages && !error) && (
        <LoadingSpinner inline />
      )}
    </div>
  )
}

Messages.bodyClass = 'messages'

export default Messages
