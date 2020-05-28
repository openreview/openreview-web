import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { stringify } from 'query-string'
import isEmpty from 'lodash/isEmpty'
import pick from 'lodash/pick'
import api from '../lib/api-client'
import NoteList from '../components/NoteList'
import PaginationLinks from '../components/PaginationLinks'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import Icon from '../components/Icon'

// Page Styles
import '../styles/pages/search.less'

const FilterForm = ({ searchQuery, setSearchQuery }) => {
  const sourceOptions = { all: 'All', forum: 'Papers Only', reply: 'Replies Only' }
  const contentOptions = {
    all: 'All Content', authors: 'Authors', tags: 'Tags', keywords: 'Keywords',
  }

  const updateQuery = (field, value) => {
    setSearchQuery({ ...searchQuery, [field]: value })
  }

  return (
    <form className="filter-form form-inline well" onSubmit={e => e.preventDefault()}>
      <div className="form-group">
        <label htmlFor="search-content">Search over</label>
        <select
          id="search-content"
          className="form-control"
          name="content"
          onChange={e => updateQuery('content', e.target.value)}
        >
          {Object.entries(contentOptions).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="search-group">in</label>
        <input
          type="text"
          id="search-group"
          className="form-control"
          name="group"
          value={searchQuery.group}
          onChange={e => updateQuery('group', e.target.value)}
        />
      </div>
      <div className="form-group">
        {Object.entries(sourceOptions).map(([val, label]) => (
          <label key={val} className="radio-inline">
            <input
              type="radio"
              name="source"
              value={val}
              checked={searchQuery.source === val}
              onChange={e => updateQuery('source', e.target.value)}
            />
            {' '}
            {label}
          </label>
        ))}
      </div>
    </form>
  )
}

const ErrorAlert = ({ error }) => (
  <Alert color="danger">
    <Icon name="exclamation-sign" />
    {' '}
    <strong>Error:</strong>
    {' '}
    {error.message}
  </Alert>
)

const Search = ({ appContext }) => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [page, setPage] = useState(0)
  const [error, setError] = useState(null)

  const displayOptions = {
    pdfLink: true,
    htmlLink: true,
    showContents: false,
  }
  const pageSize = 25

  const loadSearchResults = async () => {
    try {
      const searchRes = await api.get('/notes/search', {
        ...searchQuery,
        limit: pageSize,
        offset: pageSize * (page - 1),
      }, {})

      if (searchRes.notes) {
        setSearchResults(searchRes)
        setError(null)
      } else {
        setError({ message: 'An unknown error occurred. Please try again later.' })
      }
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    appContext.setBannerHidden(true)

    if (isEmpty(router.query)) return

    setSearchQuery(pick(router.query, ['term', 'content', 'group', 'source', 'sort']))
    setPage(parseInt(router.query.page, 10) || 1)
  }, [router.query])

  useEffect(() => {
    if (!searchQuery || !page) return

    loadSearchResults()
  }, [searchQuery, page])

  if (error) {
    return <ErrorAlert error={error} />
  }
  if (!searchResults) {
    return <LoadingSpinner />
  }
  return (
    <div>
      <Head>
        <title key="title">Search | OpenReview</title>
      </Head>

      <FilterForm searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="search-results">
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <h3>{searchResults.count} results found for &quot;{searchQuery.term}&quot;</h3>
        <hr className="small" />

        <NoteList notes={searchResults.notes} displayOptions={displayOptions} />

        <PaginationLinks
          currentPage={page}
          itemsPerPage={pageSize}
          totalCount={searchResults.count}
          baseUrl={`/search?${stringify(searchQuery, { skipNull: true })}`}
        />
      </div>
    </div>
  )
}

Search.bodyClass = 'search'

export default Search
