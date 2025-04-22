'use client'

import { useState } from 'react'
import VenueListItem from './VenueListItem'
import { deburrString, prettyId } from '../../lib/utils'

function deburrFirstLetter(venue) {
  // return first letter of venue without accents and aumlats
  if (!venue) {
    return ''
  }

  return deburrString(prettyId(venue.groupId).charAt(0), true)
}

export default function VenueListWithExpandButton({ name, venues, maxVisible, listType }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
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
      </div>
      <button
        type="button"
        className="btn-link"
        onClick={() => {
          setExpanded(!expanded)
        }}
      >
        {expanded ? 'Show fewer venues' : `Show all ${venues.length} venues`}
      </button>
    </>
  )
}
