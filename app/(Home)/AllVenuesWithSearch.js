'use client'

import { AutoComplete, Divider, Input } from 'antd'
import { debounce } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import LoadingIcon from '../../components/LoadingIcon'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const MIN_SEARCH_LENGTH = 3

const highlightMatch = (text, term) => {
  if (!term) return text
  const idx = text.toLowerCase().indexOf(term.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <strong>{text.slice(idx, idx + term.length)}</strong>
      {text.slice(idx + term.length)}
    </>
  )
}

export default function AllVenuesWithSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [venueSearchResults, setVenueSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const latestTermRef = useRef('')
  const router = useRouter()

  const searchVenues = async (term) => {
    setLoading(true)
    try {
      const result = await api.get('/venues/search', { term, limit: 10 })
      if (term !== latestTermRef.current) return
      setVenueSearchResults(
        result.venues.map((venue) => ({
          value: venue.id,
          label: highlightMatch(prettyId(venue.id), term),
        }))
      )
    } catch (error) {
      if (term !== latestTermRef.current) return
      promptError(error.message)
    } finally {
      if (term === latestTermRef.current) setLoading(false)
    }
  }

  const delaySearch = useMemo(
    () =>
      debounce((term) => {
        const cleanTerm = term.trim()
        latestTermRef.current = cleanTerm
        if (cleanTerm.length < MIN_SEARCH_LENGTH) {
          setVenueSearchResults([])
          setLoading(false)
          return
        }
        searchVenues(cleanTerm)
      }, 300),
    []
  )

  useEffect(() => () => delaySearch.cancel(), [delaySearch])

  const handleSelect = (value) => {
    setSearchTerm('')
    setVenueSearchResults([])
    router.push(`/group?id=${value}`)
  }

  let notFoundContent
  if (loading) {
    notFoundContent = (
      <span style={{ color: '#8c1b13' }}>
        <LoadingIcon />
      </span>
    )
  } else if (searchTerm.trim().length < MIN_SEARCH_LENGTH) {
    notFoundContent = `Type at least ${MIN_SEARCH_LENGTH} characters to search.`
  } else {
    notFoundContent = 'No venues match your search.'
  }

  const popupRender = (menu) => (
    <>
      {menu}
      <Divider style={{ margin: '4px 0' }} />
      <div style={{ padding: '6px 12px' }}>
        <Link href="/venues">View All Venues →</Link>
      </div>
    </>
  )

  return (
    <section id="all-venues">
      <h1>Search Venues</h1>
      <Divider style={{ marginTop: 0, minWidth: 0, width: '100%', maxWidth: 768 }} />
      <AutoComplete
        value={searchTerm}
        options={venueSearchResults}
        onChange={setSearchTerm}
        showSearch={{ onSearch: delaySearch }}
        onClear={() => {
          latestTermRef.current = ''
          setVenueSearchResults([])
          setLoading(false)
        }}
        onSelect={handleSelect}
        popupRender={popupRender}
        notFoundContent={notFoundContent}
        allowClear
        virtual={false}
        style={{ width: '100%', maxWidth: 768 }}
        popupMatchSelectWidth
        listHeight={150}
        getPopupContainer={(triggerNode) => triggerNode.parentElement}
      >
        <Input size="large" placeholder="Type to search for venues..." />
      </AutoComplete>
    </section>
  )
}
