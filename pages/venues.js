import Head from 'next/head'
import Link from 'next/link'
import withError from '../components/withError'
import api from '../lib/api-client'
import PaginationLinks from '../components/PaginationLinks'
import { auth } from '../lib/auth'

// Page Styles
import '../styles/pages/venues.less'

const VenueItem = ({ venue }) => (
  <p>
    {venue.content.shortname}
    {' – '}
    <Link href={`/venue?id=${venue.id}`}>
      <a title={`View proceedings of ${venue.content.name}`}>{venue.content.name}</a>
    </Link>
  </p>
)

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
      {process.env.USE_DBLP_VENUES ? venues.map(venue => (
        <VenueItem key={venue.id} venue={venue} />
      )) : (
        <h4>Venue</h4>
      )}
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
  if (process.env.USE_DBLP_VENUES) {
    const currentPage = Math.max(parseInt(ctx.query.page, 10) || 1, 1)
    const notesPerPage = 25

    const { token } = auth(ctx)
    const { venues, count } = await api.get('/venues', {
      invitations: 'dblp.org/-/conference',
      limit: notesPerPage,
      offset: notesPerPage * (currentPage - 1),
    }, { accessToken: token })

    if (!venues) {
      return {
        statusCode: 400,
        message: 'Venues list unavailable. Please try again later',
      }
    }

    const pagination = {
      currentPage,
      notesPerPage,
      totalCount: count,
      baseUrl: '/venues',
    }
    return { venues, pagination }
  } else {
    return {}
  }
}

Venues.bodyClass = 'venues'

export default withError(Venues)
