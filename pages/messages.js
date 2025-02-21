/* globals $: false */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import omit from 'lodash/omit'
import useQuery from '../hooks/useQuery'
import useLoginRedirect from '../hooks/useLoginRedirect'
import MessagesTable from '../components/MessagesTable'
import ErrorAlert from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import MultiSelectorDropdown from '../components/MultiSelectorDropdown'
import PaginationLinks from '../components/PaginationLinks'
import Icon from '../components/Icon'
import api from '../lib/api-client'

const statusOptions = [
  { label: 'Delivered', value: 'delivered' },
  { label: 'Bounced', value: 'bounce' },
  { label: 'Processed', value: 'processed' },
  { label: 'Dropped', value: 'dropped' },
  { label: 'Error', value: 'error' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Deferred', value: 'deferred' },
]
const statusOptionValues = statusOptions.map((o) => o.value)

const FilterForm = ({ searchQuery, loading }) => {
  const queryStatus = searchQuery?.status ?? []
  const queryStatutes = Array.isArray(queryStatus) ? queryStatus : [queryStatus]
  const selectedStatuses = queryStatutes.filter((s) => statusOptionValues.includes(s))
  const router = useRouter()

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip({ container: 'body' })
  }, [])

  const onFiltersChange = (field, value) => {
    const newSearchQuery = value
      ? { ...searchQuery, [field]: value }
      : { ...omit(searchQuery, field) }
    router.push({ pathname: '/messages', query: newSearchQuery })
  }

  return (
    <form className="filter-controls form-inline well" onSubmit={(e) => e.preventDefault()}>
      <div className="form-group">
        <label htmlFor="status-search-dropdown">Status:</label>
        <MultiSelectorDropdown
          id="status-search-dropdown"
          options={statusOptions}
          selectedValues={selectedStatuses}
          setSelectedValues={(values) => onFiltersChange('status', values)}
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="subject-search-input">Subject:</label>
        <Icon
          name="info-sign"
          tooltip="To perform a prefix search, add .* at the end of the subject. For example: [ABC.*"
          extraClasses="mr-1"
        />
        <input
          type="text"
          id="subject-search-input"
          className="form-control"
          placeholder="Message subject"
          disabled={loading}
          defaultValue={searchQuery?.subject ?? ''}
          onChange={(e) => onFiltersChange('subject', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="to-search-input">To:</label>
        <input
          type="text"
          id="to-search-input"
          className="form-control"
          placeholder="To address"
          disabled={loading}
          defaultValue={searchQuery?.to ?? ''}
          onChange={(e) => onFiltersChange('to', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="parent-group-search-input">Parent:</label>
        <input
          type="text"
          id="parent-group-search-input"
          className="form-control"
          placeholder="Parent group"
          disabled={loading}
          defaultValue={searchQuery?.parentGroup ?? ''}
          onChange={(e) => onFiltersChange('parentGroup', e.target.value)}
        />
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
  const { accessToken, userLoading } = useLoginRedirect()
  const query = useQuery()
  const [allMessages, setAllMessages] = useState([])
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const pageSize = 25
  const { setBannerHidden } = appContext

  const count = allMessages.length
  const messages = allMessages.length
    ? allMessages.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : []

  const loadMessages = async (after) => {
    setIsLoading(true)
    let validStatus
    if (Array.isArray(query.status)) {
      validStatus = query.status?.filter((status) => statusOptionValues.includes(status))
    } else if (statusOptionValues.includes(query.status)) {
      validStatus = query.status
    }

    try {
      const apiRes = await api.get(
        '/messages',
        {
          ...query,
          status: validStatus,
          after,
        },
        { accessToken }
      )
      setAllMessages((existingMessages) => existingMessages.concat(apiRes.messages || []))
      setError(null)
    } catch (apiError) {
      setError(apiError)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (userLoading || !query) return
    setBannerHidden(true)
    setAllMessages([])
    setCurrentPage(1)

    loadMessages()
  }, [userLoading, query])

  useEffect(() => {
    if (!allMessages.length || allMessages.length < 1000) return
    const availablePages = Math.ceil(allMessages.length / pageSize)
    if (currentPage >= availablePages - 5) {
      loadMessages(allMessages[allMessages.length - 1].id)
    }
  }, [currentPage])

  return (
    <div>
      <Head>
        <title key="title">Message Viewer | OpenReview</title>
      </Head>

      <header>
        <h1 className="text-center">Message Viewer</h1>
      </header>

      <FilterForm searchQuery={query} />

      {error && <ErrorAlert error={error} />}

      {isLoading ? (
        <LoadingSpinner inline />
      ) : (
        <>
          <MessagesTable messages={messages} />
          <PaginationLinks
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={pageSize}
            totalCount={count}
          />
        </>
      )}
    </div>
  )
}

Messages.bodyClass = 'messages'

export default Messages
