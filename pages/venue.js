/* globals $: false */

import Head from 'next/head'
import { useEffect } from 'react'
import Link from 'next/link'
import groupBy from 'lodash/groupBy'
import withError from '../components/withError'
import api from '../lib/api-client'
import Accordion from '../components/Accordion'
import { auth } from '../lib/auth'
import { referrerLink } from '../lib/banner-links'
import { inflect, prettyId } from '../lib/utils'

function VenuesList({ filteredVenues }) {
  return (
    <div className="groups">
      <ul className="list-unstyled venues-list">
        {filteredVenues.map((venue) => (
          <li key={venue.id}>
            <Link
              href={`/submissions?venue=${venue.id}`}
              title="View submissions for this venue"
            >
              {prettyId(venue.id)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function GroupHeading({ year, count }) {
  return (
    <>
      <span className="h3">{year}</span>{' '}
      <span className="h4">{`(${count} ${inflect(count, 'venue', 'venues')})`}</span>
    </>
  )
}

function Venue({ hostGroup, venuesByYear, appContext }) {
  const { setBannerContent } = appContext

  const descriptionRe = /^ {2}title: ["'](.+)["'], *$/gm
  const groupDescription = hostGroup.web ? descriptionRe.exec(hostGroup.web)?.[1] ?? '' : ''

  useEffect(() => {
    setBannerContent(referrerLink('[All Venues](/venues)'))
  }, [])

  useEffect(() => {
    if (!venuesByYear || !window.location.hash) return

    // Scroll to and expand venue referenced in URL
    const $titleLink = $(`#questions .panel-title a[href="${window.location.hash}"]`).eq(0)
    if ($titleLink.length) {
      $titleLink.trigger('click')

      setTimeout(() => {
        const scrollPos = $titleLink.closest('.panel-default').offset().top - 55
        $('html, body').animate({ scrollTop: scrollPos }, 400)
      }, 200)
    }
  }, [venuesByYear])

  return (
    <>
      <Head>
        <title key="title">Venues | OpenReview</title>
      </Head>

      <header className="clearfix">
        <h1 className="mb-4">
          {groupDescription
            ? `${groupDescription} (${prettyId(hostGroup.id)})`
            : prettyId(hostGroup.id)}
        </h1>
      </header>

      <div className="row">
        <div className="col-xs-12">
          {venuesByYear?.length > 0 ? (
            <Accordion
              sections={venuesByYear.map((obj) => ({
                id: obj.year,
                heading: <GroupHeading year={obj.year} count={obj.venues.length} />,
                body: <VenuesList filteredVenues={obj.venues} />,
              }))}
              options={{ id: 'venues', collapsed: true, bodyContainer: 'div' }}
            />
          ) : (
            <p className="mt-2 empty-message">No venues found for group {hostGroup.id}</p>
          )}
        </div>
      </div>
    </>
  )
}

Venue.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Missing required parameter id' }
  }

  const { token } = auth(ctx)
  const requestOptions = {
    accessToken: token,
    remoteIpAddress: ctx.req?.headers['x-forwarded-for'],
  }

  const [hostGroup, venues] = await Promise.all([
    api
      .get('/groups', { id: ctx.query.id }, requestOptions)
      .then((res) => res.groups?.[0] ?? null),
    api.get('/groups', { host: ctx.query.id }, requestOptions).then((res) => res.groups ?? []),
  ])

  if (!hostGroup) {
    return {
      statusCode: 400,
      message: `Venues list for ${ctx.query.id} is unavailable. Please try again later`,
    }
  }
  if (venues.length === 0) {
    return { hostGroup, venuesByYear: [] }
  }

  const groupedVenues = groupBy(venues, (group) => {
    // Assumes that the host group id is a prefix of the venue id
    const firstYear = group.id
      .replace(hostGroup.id, '')
      .split('/')
      .slice(1)
      .find((part) => Number.parseInt(part, 10))
    // Use small number as default to ensure it shows up last in the list
    return firstYear || 0
  })
  const venuesByYear = Object.keys(groupedVenues)
    .sort()
    .reverse()
    .map((year) => ({
      year,
      venues: groupedVenues[year],
    }))

  const lastEntry = venuesByYear[venuesByYear.length - 1]
  if (lastEntry.year === '0') {
    lastEntry.year = 'Other'
  }

  return { hostGroup, venuesByYear }
}

Venue.bodyClass = 'venue'

export default withError(Venue)
