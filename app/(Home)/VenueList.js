import { deburrString, prettyId } from '../../lib/utils'
import VenueListItem from './VenueListItem'
import VenueListWithExpandButton from './VenueListWithExpandButton'

export default function VenueList({ name, venues, maxVisible = 14, listType = 'vertical' }) {
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

  if (venues.length > maxVisible)
    return (
      <VenueListWithExpandButton
        name={name}
        venues={venues}
        maxVisible={maxVisible}
        listType={listType}
      />
    )
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
              hidden={false}
              isLeadingVenue={isLeadingVenue}
            />
          )
        })}
      </ul>
    </div>
  )
}
