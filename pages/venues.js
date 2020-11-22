import Head from 'next/head'
import Link from 'next/link'
import Router from 'next/router'
import withError from '../components/withError'
import api from '../lib/api-client'
import PaginationLinks from '../components/PaginationLinks'
import { prettyId } from '../lib/utils'
import { auth } from '../lib/auth'

// Page Styles
import '../styles/pages/venues.less'

const VenueItem = ({ venue }) => (
  <p>
    {venue.content.shortname}
    {' '}
    &#8211;
    {' '}
    <Link href={`/venue?id=${venue.id}`}>
      <a title="Click to view the proceedings of this conference">
        {venue.content.name}
      </a>
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
      {venues.map(venue => (
        <VenueItem key={venue.id} venue={venue} />
      ))}
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

  const { user, token } = auth(ctx)
  try {
    const { venues, count } = await api.get('/venues', {
      invitations: 'dblp.org/-/conference',
      limit: notesPerPage,
      offset: notesPerPage * (currentPage - 1),
    })

    const pagination = {
      currentPage,
      notesPerPage,
      totalCount: count,
      baseUrl: '/venues',
    }

    if (!venues) {
      return {
        statusCode: 400,
        message: 'Venues list unavailable. Please try again later',
      }
    }
    return { venues, pagination }
  } catch (error) {
    if (error.name === 'forbidden') {
      if (!token) {
        if (ctx.req) {
          ctx.res.writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` }).end()
        } else {
          Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
        }
        return {}
      }
      return { statusCode: 403, message: 'You don\'t have permission to read this page' }
    }
    return { statusCode: error.status || 500, message: error.message }
  }
}

Venues.bodyClass = 'venues'

export default withError(Venues)
