import { useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import uniqBy from 'lodash/uniqBy'
import LoadingSpinner from '../components/LoadingSpinner'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import { prettyId, formatTimestamp } from '../lib/utils'

// Page Styles
import '../styles/pages/home.less'

export default function Home() {
  const [venues, setVenues] = useState({
    user: null, active: null, open: null, all: null,
  })
  const [error, setError] = useState(null)
  const { user, userLoading } = useUser()

  useEffect(() => {
    if (userLoading) return

    const formatGroupResults = apiRes => (apiRes.groups?.[0]?.members || [])
      .map(groupId => ({ groupId, dueDate: null }))

    const formatInvitationResults = apiRes => uniqBy(
      (apiRes.invitations || []).map(inv => ({ groupId: inv.id.split('/-/')[0], dueDate: inv.duedate })),
      'groupId',
    ).sort((a, b) => a.dueDate - b.dueDate)

    const loadVenues = async () => {
      try {
        const [userVenues, activeVenues, openVenues, allVenues] = await Promise.all([
          user ? api.get('/groups', { member: user.id, web: true }).then(apiRes => (apiRes.groups || [])) : Promise.resolve([]),
          api.get('/groups', { id: 'active_venues' }).then(formatGroupResults),
          api.getCombined('/invitations', { invitee: '~', pastdue: false }).then(formatInvitationResults),
          api.get('/groups', { id: 'host' }).then(formatGroupResults),
        ])
        const activeAndOpenVenues = activeVenues.concat(openVenues)
        const filteredUserVenues = userVenues
          .filter(group => activeAndOpenVenues.find(v => group.id.startsWith(v.groupId)))
          .map(group => ({ groupId: group.id, dueDate: null }))

        setVenues({
          user: filteredUserVenues,
          active: activeVenues,
          open: openVenues,
          all: allVenues,
        })
      } catch (apiError) {
        setError(apiError)
      }
    }

    loadVenues()
  }, [user, userLoading])

  return (
    <div className="homepage-container">
      <Head>
        <title key="title">Venues | OpenReview</title>
      </Head>

      {venues.user?.length > 0 && (
        <section>
          <h1>Your Active Venues</h1>
          <hr className="small" />
          <div id="your-active-venues" className="conferences">
            <VenueList name="active venues" venues={venues.user} />
          </div>
        </section>
      )}

      <section>
        <h1>Open for Submissions</h1>
        <hr className="small" />
        <div id="open-venues" className="conferences">
          <VenueList name="open venues" venues={venues.open} />
        </div>
      </section>

      <section>
        <h1>Active Venues</h1>
        <hr className="small" />
        <div id="active-venues" className="conferences">
          <VenueList name="active venues" venues={venues.active} />
        </div>
      </section>

      <section>
        <h1>All Venues</h1>
        <hr className="small" />
        <div id="all-venues" className="conferences">
          <VenueList name="all venues" venues={venues.all} />
        </div>
      </section>
    </div>
  )
}
Home.bodyClass = 'home'

function VenueList({ name, venues }) {
  if (!venues) {
    return <LoadingSpinner inline />
  }
  if (venues.length === 0) {
    // eslint-disable-next-line react/jsx-one-expression-per-line
    return <p className="empty">There are currently no {name}.</p>
  }

  const cutoff = 12
  return venues.map((venue, i) => (
    <Venue
      key={`${name}-${venue.groupId}`}
      groupId={venue.groupId}
      dueDate={venue.dueDate}
      hidden={i > cutoff}
    />
  )).concat(venues.length > cutoff ? (
    // eslint-disable-next-line react/jsx-one-expression-per-line
    <button type="button" className="btn-link">Show all {venues.length} venues</button>
  ) : null)
}

function Venue({ groupId, dueDate, hidden }) {
  const styles = hidden ? { display: 'none' } : {}

  return (
    <h2 style={styles}>
      <Link href={`/group?id=${groupId}`}><a>{prettyId(groupId)}</a></Link>
      {dueDate && (
        <>
          <br />
          <span>
            Due
            {' '}
            {formatTimestamp(dueDate)}
          </span>
        </>
      )}
    </h2>
  )
}
