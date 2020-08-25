import Link from 'next/link'

const VenueDetails = ({ venue }) => (
  <>
    <Link href={`/submissions?venue=${venue.id}`}>
      <a title="View submissions for this venue">
        {venue.content.name}
      </a>
    </Link>

    <p>
      <br />
      {venue.content.location && (
        <>
          <span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span>
            &nbsp;{venue.content.location}
        </>
      )}
      &nbsp;&nbsp;&nbsp;&nbsp;
      {venue.content.startdate && venue.content.enddate && (
        <>
          <span class="glyphicon glyphicon-calendar"></span>
          &nbsp;
          {new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "long", day: "2-digit" }).format(venue.content.startdate)}
              &nbsp;&#8211;&nbsp;
          {new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "long", day: "2-digit" }).format(venue.content.enddate)}
        </>
      )}
      &nbsp;&nbsp;&nbsp;&nbsp;
      {venue.content.dblp_url && (
        <>
          <span class="glyphicon glyphicon-link"></span>
          &nbsp;<a href={venue.content.dblp_url}>DBLP Link</a>
        </>
      )}
    </p>
    {venue.content.publisher && (
      <p>
        Publisher: {venue.content.publisher}
      </p>
    )}
    {venue.content.program_chairs && venue.content.program_chairs.length > 0 && (
      <p>
        Program chairs:
        {venue.content.program_chairs.map(pc => (
          <a key={pc.url} href={pc.url}>{pc.name}</a>
        )).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)
        }
      </p>
    )}
  </>
)

export default VenueDetails
