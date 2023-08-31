import Link from 'next/link'
import Icon from './Icon'

const VenueDetails = ({ venue }) => (
  <>
    <Link href={`/submissions?venue=${venue.id}`} title="View submissions for this venue">
      {venue.content.name}
    </Link>

    <p className="mt-1 mb-0">
      {venue.content.location && (
        <span className="mr-4">
          <Icon name="map-marker" extraClasses="mr-1" /> {venue.content.location}
        </span>
      )}

      {venue.content.startdate && venue.content.enddate && (
        <span className="mr-4">
          <Icon name="calendar" extraClasses="mr-1" />
          {new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
          }).format(venue.content.startdate)}
          {' – '}
          {new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
          }).format(venue.content.enddate)}
        </span>
      )}

      {venue.content.dblp_url && (
        <span className="mr-4">
          <Icon name="link" extraClasses="mr-1" />{' '}
          <a href={venue.content.dblp_url} target="_blank" rel="noreferrer">
            DBLP Page
          </a>
        </span>
      )}
    </p>

    {venue.content.publisher && (
      <p className="mt-1 mb-0">Publisher: {venue.content.publisher}</p>
    )}

    {venue.content.program_chairs?.length > 0 && (
      <p className="mt-1 mb-0">
        Program chairs:{' '}
        {venue.content.program_chairs
          .map((pc) => (
            <a key={pc.url} href={pc.url} target="_blank" rel="noreferrer">
              {pc.name}
            </a>
          ))
          .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
      </p>
    )}
  </>
)

export default VenueDetails
