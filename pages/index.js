import Link from 'next/link'
import Head from 'next/head'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import api from '../lib/api-client'
import { prettyId, formatTimestamp } from '../lib/utils'

// Page Styles
import '../styles/pages/home.less'

const VenueList = ({ name, venues }) => (
  <div id={name} className="conferences">
    {venues.length ? venues.map(venue => (
      <Venue
        key={`${name}-${venue.groupId}`}
        groupId={venue.groupId}
        dueDate={venue.dueDate}
      />
    )) : (
      <p className="empty">
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        There are currently no {name.split('-').join(' ')}.
      </p>
    )}
  </div>
)

const Venue = ({ groupId, dueDate }) => (
  <h2>
    <Link href={`/group?id=${groupId}`}><a>{prettyId(groupId)}</a></Link>
    {dueDate && (
      <span>
        Due
        {' '}
        {formatTimestamp(dueDate)}
      </span>
    )}
  </h2>
)

const Home = ({ activeVenues, openVenues, allVenues }) => (
  <div>
    <Head>
      <title key="title">Venues | OpenReview</title>
    </Head>

    <h1>Active Venues</h1>
    <hr className="small" />
    <VenueList name="active-venues" venues={activeVenues} />

    <h1>Open for Submissions</h1>
    <hr className="small" />
    <VenueList name="open-venues" venues={openVenues} />

    <h1>All Venues</h1>
    <hr className="small" />
    <VenueList name="all-venues" venues={allVenues} />
  </div>
)

Home.getInitialProps = async () => {
  const formatGroupResults = apiRes => get(apiRes, 'groups[0].members', [])
    .map(groupId => ({ groupId, dueDate: null }))

  const formatInvitationResults = apiRes => uniqBy(
    get(apiRes, 'invitations', [])
      .map(inv => ({ groupId: inv.id.split('/-/')[0], dueDate: inv.duedate })),
    'group',
  )

  const [activeVenues, openVenues, allVenues] = await Promise.all([
    api.get('/groups', { id: 'active_venues' }).then(formatGroupResults),
    api.get('/invitations', { invitee: '~', pastdue: false }).then(formatInvitationResults),
    api.get('/groups', { id: 'host' }).then(formatGroupResults),
  ])

  return {
    activeVenues,
    openVenues,
    allVenues,
  }
}

Home.bodyClass = 'home'

export default Home
