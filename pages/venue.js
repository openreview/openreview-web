/* globals $: false */

import Head from 'next/head'
import { useState, useEffect } from 'react'
import Router from 'next/router'
import Link from 'next/link'
import groupBy from 'lodash/groupBy'
import withError from '../components/withError'
import api from '../lib/api-client'
import LoadingSpinner from '../components/LoadingSpinner'
import Accordion from '../components/Accordion'
import { auth } from '../lib/auth'
import { referrerLink } from '../lib/banner-links'
import { inflect, prettyId } from '../lib/utils'

function VenuesList({ filteredVenues }) {
  return (
    <div className="groups">
      <ul className="list-unstyled venues-list">
        {filteredVenues.map(venue => (
          <li className="mb-4" key={venue.id}>
            <Link href={`/submissions?venue=${venue.id}`}>
              <a title="View submissions for this venue">
                {prettyId(venue.id)}
              </a>
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
      <span className="h3">{year}</span>
      {' '}
      <span className="h4">
        {`(${count} ${inflect(count, 'venue', 'venues')})`}
      </span>
    </>
  )
}

function Venue({ parent, venues, appContext }) {
  const [venuesByYear, setVenuesByYear] = useState(null)
  const { setBannerContent } = appContext

  useEffect(() => {
    setBannerContent(referrerLink('[All Venues](/venues)'))

    const groupedVenues = groupBy(venues, (group) => {
      const parts = group.id.split('/')
      const firstPart = Number.parseInt(parts[1], 10)
      return firstPart || null
    })
    setVenuesByYear(Object.keys(groupedVenues).sort().reverse().map((year) => ({
      id: year,
      heading: <GroupHeading year={year} count={groupedVenues[year].length} />,
      body: <VenuesList filteredVenues={groupedVenues[year]} />,
    })))
  }, [venues])

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
        <h1>{prettyId(parent)}</h1>
      </header>

      <div className="row">
        <div className="col-xs-12">
          {venuesByYear ? (
            <Accordion
              sections={venuesByYear}
              options={{ id: 'venues', collapsed: true }}
            />
          ) : (
            <LoadingSpinner />
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

  try {
    const { groups } = await api.get('/groups', { parent: ctx.query.id, web: true }, { accessToken: token })
    if (!groups) {
      return {
        statusCode: 400,
        message: 'Venues list unavailable. Please try again later',
      }
    }
    return { parent: ctx.query.id, venues: groups }
  } catch (error) {
    if (error.name === 'ForbiddenError') {
      if (!token) {
        if (ctx.req) {
          ctx.res.writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` }).end()
        } else {
          Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
        }
        return {}
      }
      return { statusCode: 403, message: 'You don\'t have permission to view this venue' }
    }
    return { statusCode: error.status || 500, message: error.message }
  }
}

Venue.bodyClass = 'venue'

export default withError(Venue)
