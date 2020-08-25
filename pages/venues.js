import Head from 'next/head'
import Link from 'next/link'
import withError from '../components/withError'
import api from '../lib/api-client'
import PaginationLinks from '../components/PaginationLinks'
import { prettyId } from '../lib/utils'

// Page Styles
import '../styles/pages/venues.less'

const VenueItem = ({ venue }) => {
  return (
    <>
      <p>{venue.content.shortname} &#8211;
      <Link href={`/venue?id=${venue.id}`}>
          <a title="Click to view the proceedings of this conference"> {venue.content.name}</a>
        </Link>
      </p>
    </>
  )
}

const Venues = ({ venues, pagination }) => (
  <>
    <Head>
      <title key="title">Venue Directory | OpenReview</title>
    </Head>

    <header className="clearfix">
      <h1>All Venues</h1>
      <hr />
    </header>

    <div className="groups">
      {/* <ul className="list-unstyled venues-list"> */}
      {venues.map(venue => {
        // console.log("venue.id: " + venue.id + " , venue.content.name: " + venue.content.name);
        return (
          // <li key={venue.id}>
          <VenueItem key={venue.id} venue={venue} />
          // </li>
        )
      })}
      {/* </ul> */}
    </div>

    <PaginationLinks
      currentPage={pagination.currentPage}
      itemsPerPage={pagination.notesPerPage}
      totalCount={pagination.totalCount}
      baseUrl={pagination.baseUrl}
    />
  </>
)

Venues.getInitialProps = async (ctx) => {
  const currentPage = Math.max(parseInt(ctx.query.page, 10) || 1, 1)
  const notesPerPage = 25
  // TODO: Check API error and return correct status code from catch code block
  const { venues, count } = await api.get('/venues', {
    invitations: 'Venue/-/Conference',
    limit: notesPerPage,
    offset: notesPerPage * (currentPage - 1),
  })
  // console.log("count: " + count)
  // console.log("venue: " + JSON.stringify(venues))

  const pagination = {
    currentPage,
    notesPerPage,
    totalCount: count,
    baseUrl: '/venues'
  }

  if (!venues) {
    return {
      statusCode: 400,
      message: 'Venues list unavailable. Please try again later',
    }
  }
  return { venues, pagination }
}

Venues.bodyClass = 'venues'

export default withError(Venues)
