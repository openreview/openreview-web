'use client'

import { AutoComplete, Divider, Input } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import LoadingIcon from '../../components/LoadingIcon'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const MIN_SEARCH_LENGTH = 3

const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' })

const tokenizeTerm = (term) => {
  if (!term) return []
  return Array.from(wordSegmenter.segment(term))
    .filter((s) => s.isWordLike)
    .map((s) => s.segment)
}

const truncateAroundMatch = (label, tokenizedTerm) => {
  const maxCharLength = 80
  if (label.length <= maxCharLength) return label
  const emphasisRegex = new RegExp(tokenizedTerm.split(' ').join('|'), 'i')
  const m = label.match(emphasisRegex)
  const matchLen = m[0].length
  const budget = maxCharLength - matchLen
  const half = Math.floor(budget / 2)
  let start = m.index - half
  let end = m.index + matchLen + half
  if (start < 0) {
    end -= start
    start = 0
  }
  if (end > label.length) {
    start = Math.max(0, start - (end - label.length))
    end = label.length
  }
  const prefix = start > 0 ? '…' : ''
  const suffix = end < label.length ? '…' : ''
  return `${prefix}${label.slice(start, end)}${suffix}`
}

const highlightMatch = (text, tokenizedTerm) => {
  if (!tokenizedTerm) return text
  const regex = new RegExp(`(${tokenizedTerm.split(' ').join('|')})`, 'gi')
  const segments = text.split(regex)
  return (
    <>
      {segments.map((segment, index) =>
        index % 2 === 1 ? <strong key={index}>{segment}</strong> : segment
      )}
    </>
  )
}

const searchFieldsConfig = [
  { key: 'domain', label: 'Domain', getValue: (venue) => venue.domain },
  { key: 'title', label: 'Title', getValue: (venue) => venue.content?.title?.value },
  { key: 'subtitle', label: 'Subtitle', getValue: (venue) => venue.content?.subtitle?.value },
  { key: 'location', label: 'Location', getValue: (venue) => venue.content?.location?.value },
  { key: 'website', label: 'Website', getValue: (venue) => venue.content?.website?.value },
]

const findFieldMatch = (venue, term) => {
  const tokens = tokenizeTerm(term).map((t) => t.toLowerCase())
  if (!tokens.length) return null
  const result = searchFieldsConfig.find((fieldConfig) => {
    const value = fieldConfig.getValue(venue)
    if (!value) return false
    const lowerValue = value.toLowerCase()
    return tokens.some((token) => lowerValue.includes(token))
  })
  return result ? { field: result.label, fieldValue: result.getValue(venue) } : null
}

export default function AllVenuesWithSearch() {
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [venueSearchResults, setVenueSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchUnavailable, setSearchUnavailable] = useState(false)
  const latestTermRef = useRef('')
  const router = useRouter()

  const tokenizedTerm = useMemo(
    () => tokenizeTerm(immediateSearchTerm).join(' '),
    [immediateSearchTerm]
  )

  useEffect(() => {
    latestTermRef.current = tokenizedTerm
    if (tokenizedTerm.length < MIN_SEARCH_LENGTH) {
      setVenueSearchResults([])
      setSearchUnavailable(false)
      setLoading(false)
      return undefined
    }

    const eventsHandler = setTimeout(async () => {
      setLoading(true)
      try {
        const result = await api.get('/venues/search', {
          term: tokenizedTerm,
          limit: 10,
        })
        if (tokenizedTerm !== latestTermRef.current) return
        if (result.searchUnavailable) {
          setVenueSearchResults([])
          setSearchUnavailable(true)
          setLoading(false)
          return
        }
        setSearchUnavailable(false)
        setVenueSearchResults(
          result.venues.map((venue) => {
            const name = prettyId(venue.id)
            const lowerName = name.toLowerCase()
            const nameMatches = tokenizeTerm(tokenizedTerm).some((t) =>
              lowerName.includes(t.toLowerCase())
            )
            const matchedField = nameMatches ? null : findFieldMatch(venue, tokenizedTerm)

            return {
              value: venue.id,
              label: (
                <>
                  <div>{highlightMatch(name, tokenizedTerm)}</div>
                  {matchedField && (
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {matchedField.field} -{' '}
                      {highlightMatch(
                        truncateAroundMatch(matchedField.fieldValue, tokenizedTerm),
                        tokenizedTerm
                      )}
                    </div>
                  )}
                </>
              ),
            }
          })
        )
      } catch (error) {
        if (tokenizedTerm !== latestTermRef.current) return
        promptError(error.message)
      } finally {
        if (tokenizedTerm === latestTermRef.current) setLoading(false)
      }
    }, 300)

    return () => clearTimeout(eventsHandler)
  }, [tokenizedTerm])

  const handleSelect = (value) => {
    setImmediateSearchTerm('')
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
  } else if (searchUnavailable) {
    notFoundContent = (
      <span style={{ color: '#8c1b13' }}>
        OpenReview is experiencing degraded performance in search functionality. Please try
        again later.
      </span>
    )
  } else if (tokenizedTerm.length < MIN_SEARCH_LENGTH) {
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
        value={immediateSearchTerm}
        options={venueSearchResults}
        onChange={setImmediateSearchTerm}
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
