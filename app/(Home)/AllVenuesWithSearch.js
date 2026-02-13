'use client'

/* globals promptError: false */
import { useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash'
import Link from 'next/link'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

export default function AllVenuesWithSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [venueResults, setVenueResults] = useState(null)

  const searchVenues = async (term) => {
    try {
      const result = await api.get('/venues/search', { term, limit: 10 })
      setVenueResults(result.venues.map((p) => ({ value: p.id, label: prettyId(p.id) })))
    } catch (error) {
      promptError(error.message)
    }
  }

  const delaySearch = useCallback(
    debounce((term) => setSearchTerm(term), 300),
    []
  )

  useEffect(() => {
    const cleanSeachTerm = searchTerm?.trim()
    if (!cleanSeachTerm) {
      setVenueResults(null)
      return
    }
    if (cleanSeachTerm.length >= 3) {
      searchVenues(cleanSeachTerm)
    }
  }, [searchTerm])

  return (
    <>
      <section id="all-venues">
        <h1>Search Venues</h1>
        <div>
          <input
            className="form-control"
            type="text"
            value={immediateSearchTerm}
            placeholder="Type to search for venues..."
            onChange={(e) => {
              setImmediateSearchTerm(e.target.value)
              delaySearch(e.target.value)
            }}
          />
        </div>
        <div className="mt-3">
          <ul className="list-unstyled venues-list">
            {venueResults && venueResults.length === 0 ? (
              <>
                <li className="text-muted">
                  Your search did not return any results.{' '}
                  <Link href={`/venues`} className="all-venues-link">
                    View All Venues
                  </Link>
                </li>
              </>
            ) : (
              <>
                {venueResults?.map(({ value, label }) => (
                  <li key={value}>
                    <Link href={`/group?id=${value}`}>{label}</Link>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      </section>
    </>
  )
}
