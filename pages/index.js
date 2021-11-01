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
        const filteredUserVenues = userVenues.filter(group => activeAndOpenVenues.find(v => v.groupId === group.id))
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
    <div>
      <Head>
        <title key="title">Venues | OpenReview</title>
      </Head>

      {venues.user?.length > 0 && (
        <>
          <h1>Your Active Venues</h1>
          <hr className="small" />
          <div id="your-active-venues" className="conferences">
            <VenueList name="active venues" venues={venues.user} />
          </div>
        </>
      )}

      <h1>Active Venues</h1>
      <hr className="small" />
      <div id="active-venues" className="conferences">
        <VenueList name="active venues" venues={venues.active} />
      </div>

      <h1>Open for Submissions</h1>
      <hr className="small" />
      <div id="open-venues" className="conferences">
        <VenueList name="open venues" venues={venues.open} />
      </div>

      <h1>All Venues</h1>
      <hr className="small" />
      <div id="all-venues" className="conferences">
        <VenueList name="all venues" venues={venues.all} />
      </div>
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

  return venues.map(venue => (
    <Venue
      key={`${name}-${venue.groupId}`}
      groupId={venue.groupId}
      dueDate={venue.dueDate}
    />
  ))
}

function Venue({ groupId, dueDate }) {
  return (
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
}
