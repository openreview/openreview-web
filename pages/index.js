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
          <VenueList name="your active venues" venues={venues.user} />
        </section>
      )}

      <section>
        <h1>Open for Submissions</h1>
        <hr className="small" />
        <VenueList name="open venues" venues={venues.open} />
      </section>

      <section>
        <h1>Active Venues</h1>
        <hr className="small" />
        <VenueList name="active venues" venues={venues.active} />
      </section>

      <section>
        <h1>All Venues</h1>
        <hr className="small" />
        <VenueList name="all venues" venues={venues.all} />
      </section>
    </div>
  )
}
Home.bodyClass = 'home'

function VenueList({ name, venues }) {
  if (!venues) {
    return <LoadingSpinner inline />
  }

  const containerId = name.toLowerCase().split(' ').join('-')
  if (venues.length === 0) {
    return (
      <div id={containerId}>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <p className="empty">There are currently no {name}.</p>
      </div>
    )
  }

  const cutoff = 12
  return (
    <div id={containerId}>
      <ul className="conferences list-unstyled">
        {venues.map((venue, i) => (
          <Venue
            key={`${containerId}-${venue.groupId}`}
            groupId={venue.groupId}
            dueDate={venue.dueDate}
            hidden={i > cutoff}
          />
        ))}
      </ul>

      {venues.length > cutoff && (
        // eslint-disable-next-line react/jsx-one-expression-per-line
        <button type="button" className="btn-link">Show all {venues.length} venues</button>
      )}
    </div>
  )
}

function Venue({ groupId, dueDate, hidden }) {
  const styles = hidden ? { display: 'none' } : {}

  return (
    <li style={styles}>
      <h2>
        <Link href={`/group?id=${groupId}`}><a>{prettyId(groupId)}</a></Link>
      </h2>
      {dueDate && (
        <p>
          Due
          {' '}
          {formatTimestamp(dueDate)}
        </p>
      )}
    </li>
  )
}
