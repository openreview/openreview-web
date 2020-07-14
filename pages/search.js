import { useState, useEffect, useContext } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Select from 'react-select'
import truncate from 'lodash/truncate'
import useQuery from '../hooks/useQuery'
import api from '../lib/api-client'
import { inflect, prettyId } from '../lib/utils'
import UserContext from '../components/UserContext'
import NoteList from '../components/NoteList'
import PaginationLinks from '../components/PaginationLinks'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'

// Page Styles
import '../styles/pages/search.less'

const FilterForm = ({ searchQuery }) => {
  const router = useRouter()
  const [groupOptions, setGroupOptions] = useState([])
  const sourceOptions = { all: 'All', forum: 'Papers Only', reply: 'Replies Only' }
  const contentOptions = {
    all: 'All Content', authors: 'Authors', tags: 'Tags', keywords: 'Keywords',
  }

  const updateQuery = (field, value) => {
    const newSearchQuery = { ...searchQuery, [field]: value }
    router.push({ pathname: '/search', query: newSearchQuery }, undefined, { shallow: true })
  }

  useEffect(() => {
    const getGroupOptions = async () => {
      const defaultOptions = [{ value: 'all', label: 'all of OpenReview' }]
      try {
        const { groups } = await api.get('/groups', { id: 'host' })
        if (groups?.length > 0) {
          const members = groups[0].members.map(groupId => ({ value: groupId, label: prettyId(groupId) }))
          setGroupOptions(defaultOptions.concat(members))
        } else {
          setGroupOptions(defaultOptions)
        }
      } catch (error) {
        setGroupOptions(defaultOptions)
      }
    }

    getGroupOptions()
  }, [])
  // console.log(groupOptions)

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
        <Select
          name="group"
          className="dropdown-select"
          options={groupOptions}
          value={searchQuery.group}
          onChange={selectedOption => updateQuery('group', selectedOption.value)}
          isDisabled={!groupOptions}
          isSearchable
          theme={theme => ({
            ...theme,
            borderRadius: 0,
            colors: {
              ...theme.colors,
              primary25: '#aaa',
              primary: '#4d8093',
            },
            spacing: {
              baseUnit: 2,
              menuGutter: 4,
              controlHeight: 34,
            },
          })}
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

const Search = ({ appContext }) => {
  const query = useQuery()
  const [searchResults, setSearchResults] = useState(null)
  const [error, setError] = useState(null)
  const { accessToken, userLoading } = useContext(UserContext)
  const { setBannerHidden } = appContext
  const page = parseInt(query?.page, 10) || 1
  const pageSize = 25
  const displayOptions = {
    pdfLink: true,
    htmlLink: true,
    showContents: false,
    emptyMessage: '',
  }

  const loadSearchResults = async () => {
    try {
      const searchRes = await api.get('/notes/search', {
        term: query.term,
        type: 'terms',
        content: query.content || 'all',
        group: query.group || 'all',
        source: query.source || 'all',
        limit: pageSize,
        offset: pageSize * (page - 1),
      }, { accessToken })

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
    if (userLoading || !query) return

    setBannerHidden(true)

    if (!query.term) {
      setError({ message: 'Missing search term or query' })
      return
    }

    loadSearchResults()
  }, [userLoading, query])

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

      <FilterForm searchQuery={query} />

      <div className="search-results">
        <h3>
          {inflect(searchResults.count, 'result', 'results', true)}
          {' '}
          found for &quot;
          {truncate(query.term, { length: 200, separator: /,? +/ })}
          &quot;
        </h3>
        <hr className="small" />

        <NoteList notes={searchResults.notes} displayOptions={displayOptions} />

        <PaginationLinks
          currentPage={page}
          itemsPerPage={pageSize}
          totalCount={searchResults.count}
          baseUrl="/search"
          queryParams={query}
          options={{ useShallowRouting: true }}
        />
      </div>
    </div>
  )
}

Search.bodyClass = 'search'

export default Search
