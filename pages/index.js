import { useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import uniqBy from 'lodash/uniqBy'
import Icon from '../components/Icon'
import LoadingSpinner from '../components/LoadingSpinner'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import { prettyId, deburrString, formatTimestamp } from '../lib/utils'
import ErrorAlert from '../components/ErrorAlert'

export default function Home() {
  const [venues, setVenues] = useState({
    user: null,
    active: null,
    open: null,
    all: null,
  })
  const [error, setError] = useState(null)
  const { user, userLoading } = useUser()

  useEffect(() => {
    if (userLoading) return

    const formatGroupResults = (apiRes) =>
      (apiRes.groups?.[0]?.members || []).map((groupId) => ({ groupId, dueDate: null }))

    const formatInvitationResults = (apiRes) =>
      uniqBy(
        (apiRes.invitations || []).map((inv) => ({
          groupId: inv.id.split('/-/')[0],
          dueDate: inv.duedate,
        })),
        'groupId'
      ).sort((a, b) => a.dueDate - b.dueDate)

    const sortAlpha = (arr) =>
      arr.sort((a, b) => prettyId(a.groupId).localeCompare(prettyId(b.groupId)))

    const loadVenues = async () => {
      try {
        const [userVenues, activeVenues, openVenues, allVenues] = await Promise.allSettled([
          user
            ? api
                .get('/groups', { member: user.id, web: true, select: 'id' })
                .then((apiRes) => apiRes.groups || [])
            : Promise.resolve([]),
          api.get('/groups', { id: 'active_venues' }).then(formatGroupResults),
          api
            .get('/invitations', { invitee: '~', pastdue: false, type: 'note' })
            .then(formatInvitationResults),
          api.get('/groups', { id: 'host' }).then(formatGroupResults).then(sortAlpha),
        ])
        const activeAndOpenVenues = (activeVenues.value ?? []).concat(openVenues.value ?? [])
        const filteredUserVenues = (userVenues.value ?? [])
          .filter((group) =>
            (activeAndOpenVenues ?? []).find((v) => group.id.startsWith(v.groupId))
          )
          .map((group) => ({ groupId: group.id, dueDate: null }))

        setVenues({
          user: filteredUserVenues,
          active: activeVenues.value,
          open: openVenues.value,
          all: allVenues.value,
        })
      } catch (apiError) {
        setError(apiError)
      }
    }

    loadVenues()
  }, [user?.id, userLoading])

  return (
    <div className="homepage-container">
      <Head>
        <title key="title">Venues | OpenReview</title>
      </Head>

      {error && <ErrorAlert error={error} />}

      {venues.user?.length > 0 ? (
        // Logged in view
        <div className="row hidden-xs">
          <div className="col-xs-12 col-sm-6">
            <VenueSection
              title="Your Active Consoles"
              name="active consoles"
              venues={venues.user}
            />
            <VenueSection title="Active Venues" name="active venues" venues={venues.active} />
          </div>

          <div className="col-xs-12 col-sm-6">
            <VenueSection
              title="Open for Submissions"
              name="open venues"
              venues={venues.open}
              maxVisible={9}
            />
          </div>

          <div className="col-xs-12">
            <VenueSection
              title="All Venues"
              name="all venues"
              venues={venues.all}
              maxVisible={1000}
              listType="horizontal"
            />
          </div>
        </div>
      ) : (
        // Logged out view
        <div className="row hidden-xs">
          <div className="col-xs-12 col-sm-6">
            <VenueSection title="Active Venues" name="active venues" venues={venues.active} />
          </div>

          <div className="col-xs-12 col-sm-6">
            <VenueSection
              title="Open for Submissions"
              name="open venues"
              venues={venues.open}
              maxVisible={9}
            />
          </div>

          <div className="col-xs-12">
            <VenueSection
              title="All Venues"
              name="all venues"
              venues={venues.all}
              maxVisible={1000}
              listType="horizontal"
            />
          </div>
        </div>
      )}

      {/* Mobile view */}
      <div className="row visible-xs">
        <div className="col-xs-12">
          {venues.user?.length > 0 && (
            <VenueSection
              title="Your Active Consoles"
              name="active consoles"
              id="active-consoles-mobile"
              venues={venues.user}
            />
          )}
          <VenueSection
            title="Open for Submissions"
            name="open venues"
            id="open-venues-mobile"
            venues={venues.open}
            maxVisible={9}
          />
          <VenueSection
            title="Active Venues"
            name="active venues"
            id="active-venues-mobile"
            venues={venues.active}
          />
          <VenueSection
            title="All Venues"
            name="all venues"
            id="all-venues-mobile"
            venues={venues.all}
            maxVisible={100}
            listType="horizontal"
          />
        </div>
      </div>
    </div>
  )
}
Home.bodyClass = 'home'

function VenueSection({ title, name, id, venues, maxVisible, listType }) {
  const containerId = id || name.toLowerCase().split(' ').join('-')

  return (
    <section id={containerId}>
      <h1>{title}</h1>
      <hr className="small" />
      <VenueList name={name} venues={venues} maxVisible={maxVisible} listType={listType} />
    </section>
  )
}

function VenueList({ name, venues, maxVisible = 14, listType = 'vertical' }) {
  const [expanded, setExpanded] = useState(false)

  if (!venues) {
    return <LoadingSpinner inline />
  }

  if (venues.length === 0) {
    return (
      <div>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <p className="empty">There are currently no {name}.</p>
      </div>
    )
  }

  function deburrFirstLetter(venue) {
    // return first letter of venue without accents and aumlats
    if (!venue) {
      return ''
    }

    return deburrString(prettyId(venue.groupId).charAt(0), true)
  }

  return (
    <div>
      <ul className={`conferences list-${listType === 'vertical' ? 'unstyled' : 'inline'}`}>
        {venues.map((venue, i) => {
          const isLeadingVenue =
            name === 'all venues'
              ? deburrFirstLetter(venue) > deburrFirstLetter(venues[i - 1])
              : false
          return (
            <VenueListItem
              key={`${name}-${venue.groupId}`}
              groupId={venue.groupId}
              dueDate={venue.dueDate}
              hidden={!expanded && i > maxVisible}
              isLeadingVenue={isLeadingVenue}
            />
          )
        })}
      </ul>

      {venues.length > maxVisible && (
        <button
          type="button"
          className="btn-link"
          onClick={() => {
            setExpanded(!expanded)
          }}
        >
          {expanded ? 'Show fewer venues' : `Show all ${venues.length} venues`}
        </button>
      )}
    </div>
  )
}

function VenueListItem({ groupId, dueDate, hidden, isLeadingVenue = false }) {
  const styles = hidden ? { display: 'none' } : {}

  return (
    <li style={styles}>
      <h2>
        <Link
          href={`/group?id=${groupId}&referrer=${encodeURIComponent('[Homepage](/)')}`}
          className={`${isLeadingVenue ? 'leading-venue' : ''}`}
        >
          {prettyId(groupId)}
        </Link>
      </h2>
      {dueDate && (
        <p>
          <Icon name="time" />
          Due {formatTimestamp(dueDate)}
        </p>
      )}
    </li>
  )
}
