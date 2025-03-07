import Head from 'next/head'
import Link from 'next/link'
import withError from '../components/withError'
import api from '../lib/api-client'
import PaginationLinks from '../components/PaginationLinks'
import { auth } from '../lib/auth'
import { prettyId } from '../lib/utils'

const VenueItemDBLP = ({ venue }) => (
  <p>
    {venue.content.shortname}
    {' – '}
    <Link href={`/venue?id=${venue.id}`} title={`View proceedings of ${venue.content.name}`}>
      {venue.content.name}
    </Link>
  </p>
)

// Post migration Delete this
const VenueItem = ({ id, name }) => (
  <h3>
    <Link href={`/venue?id=${id}`} title={`View venues of ${name}`}>
      {name}
    </Link>
  </h3>
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
      {process.env.USE_DBLP_VENUES === 'true' ? (
        venues.map((venue) => <VenueItemDBLP key={venue.id} venue={venue} />)
      ) : (
        <ul className="list-unstyled venues-list">
          {venues.map((group) => (
            <li key={group.id}>
              <VenueItem id={group.id} name={group.name} />
            </li>
          ))}
        </ul>
      )}
    </div>

    {process.env.USE_DBLP_VENUES === 'true' && (
      <PaginationLinks
        currentPage={pagination.currentPage}
        itemsPerPage={pagination.notesPerPage}
        totalCount={pagination.totalCount}
        baseUrl={pagination.baseUrl}
      />
    )}
  </>
)

Venues.getInitialProps = async (ctx) => {
  if (process.env.USE_DBLP_VENUES === 'true') {
    const currentPage = Math.max(parseInt(ctx.query.page, 10) || 1, 1)
    const notesPerPage = 25

    const { token } = auth(ctx)
    const { venues, count } = await api.get(
      '/venues',
      {
        invitations: 'dblp.org/-/conference',
        limit: notesPerPage,
        offset: notesPerPage * (currentPage - 1),
      },
      { accessToken: token }
    )

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

    // Post migration delete the entire else clause
    // eslint-disable-next-line no-else-return
  } else {
    const { groups } = await api.get(
      '/groups',
      { id: 'host' },
      { remoteIpAddress: ctx.req?.headers['x-forwarded-for'] }
    )
    const group = groups?.length > 0 ? groups[0] : null
    if (!group) {
      return {
        statusCode: 400,
        message: 'Venues list unavailable. Please try again later',
      }
    }

    const venues = group.members
      .map((id) => ({ id, name: prettyId(id) }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return { venues }
  }
}

Venues.bodyClass = 'venues'

export default withError(Venues)
