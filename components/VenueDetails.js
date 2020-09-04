import Link from 'next/link'

const VenueDetails = ({ venue }) => (
  <>
    <Link href={`/submissions?venue=${venue.id}`}>
      <a title="View submissions for this venue">
        {venue.content.name}
      </a>
    </Link>

    <p className="mt-1 mb-0">
      {venue.content.location && (
        <>
          <span className="glyphicon glyphicon-map-marker mr-1" aria-hidden="true" />
            &nbsp;
          {venue.content.location}
        </>
      )}
      <span className="mr-4" />
      {venue.content.startdate && venue.content.enddate && (
        <>
          <span className="glyphicon glyphicon-calendar mr-1" />
          {new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'long', day: '2-digit' }).format(venue.content.startdate)}
              &nbsp;&#8211;&nbsp;
          {new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'long', day: '2-digit' }).format(venue.content.enddate)}
        </>
      )}
      <span className="mr-4" />
      {venue.content.dblp_url && (
        <>
          <span className="glyphicon glyphicon-link mr-1" />
          <a href={venue.content.dblp_url}>DBLP Page</a>
        </>
      )}
    </p>
    {venue.content.publisher && (
      <p className="mt-1 mb-0">
        Publisher:
        {' '}
        {venue.content.publisher}
      </p>
    )}
    {venue.content.program_chairs && venue.content.program_chairs.length > 0 && (
      <p className="mt-1 mb-0">
        Program chairs:
        {' '}
        {venue.content.program_chairs.map(pc => (
          <a key={pc.url} href={pc.url}>{pc.name}</a>
        )).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
      </p>
    )}
  </>
)

export default VenueDetails
