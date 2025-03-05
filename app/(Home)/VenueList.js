'use client'

import { useEffect, useState } from 'react'
import { deburrString, prettyId } from '../../lib/utils'
import VenueListItem from './VenueListItem'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function VenueList({ name, venues, maxVisible = 14, listType = 'vertical' }) {
  const [expanded, setExpanded] = useState(false)
  const [isClientRendering, setIsClientRendering] = useState(false)

  useEffect(() => {
    setIsClientRendering(true)
  }, [])

  if (!isClientRendering) return <LoadingSpinner inline />

  if (!venues) {
    return null
  }

  if (venues.length === 0) {
    return (
      <div>
        <p className="empty">There are currently no {name}.</p>
      </div>
    )
  }
  function deburrFirstLetter(venue) {
    // return first letter of venue without accents and aumlats
    if (!venue) {
      return ''
    }

    return deburrString(prettyId(venue.groupId).charAt(0), true)
  }

  return (
    <div>
      <ul className={`conferences list-${listType === 'vertical' ? 'unstyled' : 'inline'}`}>
        {venues.map((venue, i) => {
          const isLeadingVenue =
            name === 'all venues'
              ? deburrFirstLetter(venue) > deburrFirstLetter(venues[i - 1])
              : false
          return (
            <VenueListItem
              key={`${name}-${venue.groupId}`}
              groupId={venue.groupId}
              dueDate={venue.dueDate}
              hidden={!expanded && i > maxVisible}
              isLeadingVenue={isLeadingVenue}
            />
          )
        })}
      </ul>

      {venues.length > maxVisible && (
        <button
          type="button"
          className="btn-link"
          onClick={() => {
            setExpanded(!expanded)
          }}
        >
          {expanded ? 'Show fewer venues' : `Show all ${venues.length} venues`}
        </button>
      )}
    </div>
  )
}
