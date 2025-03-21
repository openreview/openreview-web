/* globals typesetMathJax: false */

import { useState, useEffect, useContext, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import truncate from 'lodash/truncate'
import useQuery from '../hooks/useQuery'
import api from '../lib/api-client'
import { inflect, prettyId } from '../lib/utils'
import UserContext from '../components/UserContext'
import Dropdown from '../components/Dropdown'
import NoteList from '../components/NoteList'
import PaginationLinks from '../components/PaginationLinks'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'

const sourceOptions = { all: 'All', forum: 'Papers Only', reply: 'Replies Only' }

const FilterForm = ({ searchQuery }) => {
  const defaultOption = { value: 'all', label: 'all of OpenReview' }
  const [groupOptions, setGroupOptions] = useState([])
  const selectedGroupOption =
    groupOptions.find((option) => option.value === searchQuery.group) || defaultOption
  const contentOptions = [
    { value: 'all', label: 'All Content' },
    { value: 'authors', label: 'Authors' },
    { value: 'tags', label: 'Tags' },
    { value: 'keywords', label: 'Keywords' },
  ]
  const selectedContentOption =
    contentOptions.find((option) => option.value === searchQuery.content) || contentOptions[0]
  const router = useRouter()

  const updateQuery = (field, value) => {
    const newSearchQuery = { ...searchQuery, [field]: value }
    router.push({ pathname: '/search', query: newSearchQuery }, undefined, { shallow: true })
  }

  useEffect(() => {
    const getGroupOptions = async () => {
      try {
        const { groups } = await api.get('/groups', { id: 'host' })
        if (groups?.length > 0) {
          const members = groups[0].members.map((groupId) => ({
            value: groupId,
            label: prettyId(groupId),
          }))
          setGroupOptions(
            [defaultOption].concat(members.sort((a, b) => a.label.localeCompare(b.label)))
          )
        } else {
          setGroupOptions([defaultOption])
        }
      } catch (error) {
        setGroupOptions([defaultOption])
      }
    }

    getGroupOptions()
  }, [])

  return (
    <form className="filter-form form-inline well" onSubmit={(e) => e.preventDefault()}>
      <div className="form-group">
        <label htmlFor="search-content">Search over</label>
        <Dropdown
          name="content"
          className="search-content dropdown-select"
          options={contentOptions}
          value={selectedContentOption}
          onChange={(selectedOption) => updateQuery('content', selectedOption.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="search-group">in</label>
        <Dropdown
          name="group"
          className="search-group dropdown-select"
          options={groupOptions}
          value={selectedGroupOption}
          onChange={(selectedOption) => updateQuery('group', selectedOption.value)}
          isSearchable
          filterOption={{
            ignoreCase: true,
            ignoreAccents: true,
            trim: true,
            matchFrom: 'start',
            stringify: (option) => option.label,
          }}
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
              onChange={(e) => updateQuery('source', e.target.value)}
            />{' '}
            {label}
          </label>
        ))}
      </div>
    </form>
  )
}

const Search = ({ appContext }) => {
  const query = useQuery()
  const [allSearchResults, setAllSearchResults] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [error, setError] = useState(null)
  const { accessToken, userLoading } = useContext(UserContext)
  const currentQuery = useRef(null)
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
      const searchRes = await api.getCombined(
        '/notes/search',
        {
          term: query.term,
          type: 'terms',
          content: query.content || 'all',
          group: query.group || 'all',
          source: Object.keys(sourceOptions).includes(query.source) ? query.source : 'all',
          sort: 'tmdate:desc',
          limit: 1000,
        },
        null,
        { accessToken, resultsKey: 'notes' }
      )

      if (searchRes.notes) {
        setAllSearchResults({
          notes: searchRes.notes.slice(0, 1000),
          count: searchRes.count > 1000 ? 1000 : searchRes.count,
        })
        setSearchResults({
          notes: searchRes.notes.slice(
            pageSize * (page - 1),
            pageSize * (page - 1) + pageSize
          ),
          count: searchRes.count > 1000 ? 1000 : searchRes.count,
        })
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
    const queryDiff = Object.keys({ ...query, ...currentQuery.current }).filter(
      (p) => query[p] !== currentQuery.current?.[p]
    )
    if (queryDiff.length === 0) {
      currentQuery.current = query
      return
    }
    if (queryDiff.length === 1 && queryDiff[0] === 'page' && allSearchResults.notes?.length) {
      // if only page param is changed, load results from local state
      setSearchResults({
        notes: allSearchResults.notes?.slice(
          pageSize * (page - 1),
          pageSize * (page - 1) + pageSize
        ),
        count: allSearchResults?.count,
      })
    } else {
      loadSearchResults()
    }
    currentQuery.current = query
  }, [userLoading, query])

  useEffect(() => {
    if (searchResults?.notes?.length) typesetMathJax()
  }, [searchResults])

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
          {inflect(searchResults.count, 'result', 'results', true)} found for &quot;
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
