'use client'

import { Flex, Segmented, Tag } from 'antd'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

import { findVenueFieldMatch, highlightMatch, truncateAroundMatch } from '../../lib/searchHighlight'
import styles from './Search.module.scss'

const LIMIT = 50

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Open for Submission', value: 'open' },
  { label: 'Active', value: 'active' },
]

export default function VenuesResults({
  term,
  activeVenues = [],
  openVenues = [],
  onResultCount,
}) {
  const [venues, setVenues] = useState(null)
  const [error, setError] = useState(null)
  const [searchUnavailable, setSearchUnavailable] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (!term) return undefined
    let cancelled = false
    setVenues(null)
    setError(null)
    setSearchUnavailable(false)

    api
      .get('/venues/search', {
        term,
        limit: LIMIT,
        select: 'id,domain,content.title,content.subtitle,content.location,content.website',
      })
      .then((result) => {
        if (cancelled) return
        if (result.searchUnavailable) {
          setSearchUnavailable(true)
          setVenues([])
          onResultCount?.(0)
          return
        }
        const items = result.venues ?? []
        setVenues(items)
        onResultCount?.(items.length)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        onResultCount?.(0)
      })

    return () => {
      cancelled = true
    }
  }, [term, onResultCount])

  const annotatedVenues = useMemo(() => {
    if (!venues) return null
    return venues.map((venue) => {
      const isOpen = openVenues.some((v) => v?.groupId === venue.id)
      const isActive = activeVenues.some((v) => v?.groupId === venue.id)
      return { ...venue, isOpen, isActive }
    })
  }, [venues, openVenues, activeVenues])

  const filteredVenues = useMemo(() => {
    if (!annotatedVenues) return null
    if (statusFilter === 'open') return annotatedVenues.filter((v) => v.isOpen)
    if (statusFilter === 'active') return annotatedVenues.filter((v) => v.isActive)
    return annotatedVenues
  }, [annotatedVenues, statusFilter])

  if (error) return <p style={{ color: '#8c1b13' }}>{error.message ?? 'Search error'}</p>
  if (searchUnavailable) {
    return (
      <p style={{ color: '#8c1b13' }}>
        OpenReview is experiencing degraded performance in search functionality. Please try
        again later.
      </p>
    )
  }
  if (annotatedVenues === null) return <LoadingSpinner />

  return (
    <div>
      <Flex
        align="center"
        gap={12}
        wrap="wrap"
        className={styles.filterRow}
      >
        <span>Status</span>
        <Segmented
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />
      </Flex>
      {filteredVenues.length === 0 ? (
        <p className="empty-message">
          No venues match &quot;{term}&quot;
          {statusFilter !== 'all' && ` with status "${STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label}"`}
          .
        </p>
      ) : (
        <ul className={styles.resultList}>
          {filteredVenues.map((venue) => {
            const name = prettyId(venue.id)
            const subtitle = venue.content?.subtitle?.value
            const lowerTerm = term.toLowerCase()
            const nameHasTerm = name.toLowerCase().includes(lowerTerm)
            const subtitleHasTerm = subtitle?.toLowerCase().includes(lowerTerm) ?? false
            // If the term didn't surface in the visible title/subtitle, fall
            // back to other searchable fields (domain, location, website,
            // full title) so the row still shows *why* it matched — same
            // affordance the homepage dropdown provides.
            const matchedField =
              nameHasTerm || subtitleHasTerm ? null : findVenueFieldMatch(venue, term)
            return (
              <li key={venue.id} className={styles.resultRow}>
                <Flex align="baseline" gap={8} wrap="wrap">
                  <Link
                    href={`/group?id=${venue.id}&referrer=${encodeURIComponent('[Search](/search?term=' + term + ')')}`}
                    className={styles.resultTitle}
                  >
                    {highlightMatch(name, term)}
                  </Link>
                  {venue.isOpen && <Tag color="#8c1b13">Open for Submission</Tag>}
                  {venue.isActive && !venue.isOpen && <Tag>Active</Tag>}
                  {subtitle && (
                    <span className={styles.resultMeta}>
                      {highlightMatch(subtitle, term)}
                    </span>
                  )}
                </Flex>
                {matchedField && (
                  <div className={styles.resultMatch}>
                    <span className={styles.resultMatchLabel}>{matchedField.field}</span>
                    {' — '}
                    {highlightMatch(
                      truncateAroundMatch(matchedField.fieldValue, term),
                      term
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
