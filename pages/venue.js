/* globals $: false */

import Head from 'next/head'
import { useState, useEffect } from 'react'
import Router from 'next/router'
import { groupBy } from 'lodash'
import withError from '../components/withError'
import api from '../lib/api-client'
import LoadingSpinner from '../components/LoadingSpinner'
import Accordion from '../components/Accordion'
import { referrerLink } from '../lib/banner-links'
import { auth } from '../lib/auth'

// Page Styles
import '../styles/pages/venue.less'
import VenueDetails from '../components/VenueDetails'

function VenuesList({ filteredVenues }) {
  return (
    <div className="groups">
      <ul className="list-unstyled venues-list">
        {filteredVenues.map(venue => (
          <li className="mb-4" key={venue.id}>
            <VenueDetails venue={venue} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function GroupHeading({ year, venuesGroupedByYear }) {
  return (
    <>
      <span className="h3">{year}</span>
      {' '}
      <span className="h4">
        (
        {venuesGroupedByYear[year].length}
        {' '}
        {venuesGroupedByYear[year].length > 1 ? 'venues' : 'venue'}
        )
      </span>
    </>
  )
}

function Venue({ venueSeries, venuesGroupedByYear, appContext }) {
  const [venuesByYear, setVenuesByYear] = useState(null)
  const { clientJsLoading, setBannerContent } = appContext

  useEffect(() => {
    if (clientJsLoading) return
    setBannerContent(referrerLink('[All Venues](/venues)'))

    setVenuesByYear(Object.keys(venuesGroupedByYear).sort().reverse().map((year, index) => ({
      id: year,
      heading: <GroupHeading year={year} venuesGroupedByYear={venuesGroupedByYear} />,
      body: <VenuesList filteredVenues={venuesGroupedByYear[year]} />,
    })))
  }, [clientJsLoading])

  useEffect(() => {
    if (!venuesByYear) return

    // Scroll to and expand venue referenced in URL
    if (window.location.hash) {
      const $titleLink = $(`#questions .panel-title a[href="${window.location.hash}"]`).eq(0)
      if ($titleLink.length) {
        $titleLink.click()

        setTimeout(() => {
          const scrollPos = $titleLink.closest('.panel-default').offset().top - 55
          $('html, body').animate({ scrollTop: scrollPos }, 400)
        }, 200)
      }
    }
  }, [venuesByYear])

  return (
    <>
      <Head>
        <title key="title">Venue Directory | OpenReview</title>
      </Head>

      <header className="clearfix">
        <h1>{venueSeries.content.name}</h1>
        {venueSeries.content.noteline && (
          <p className="noteline">{venueSeries.content.noteline}</p>
        )}
        {venueSeries.content.external_links?.length > 0 && (
          <>
            <span className="external-links">External Links:</span>
            {' '}
            {venueSeries.content.external_links.map((el) => {
              if (el.link && el.domain) {
                return (
                  <span className="external-links" key={el.link}>
                    <a href={el.link}>{el.domain.toUpperCase()}</a>
                  </span>
                )
              }
              return null
            }).filter(Boolean).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
          </>
        )}
        <hr />
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
  if (!process.env.USE_DBLP_VENUES) {
    return { statusCode: 404, message: 'The page could not be found' }
  }

  const venueSeriesRes = await api.get('/venues', { id: ctx.query.id })
  const venueSeries = venueSeriesRes.venues?.length > 0 ? venueSeriesRes.venues[0] : null

  const { user, token } = auth(ctx)
  try {
    const { venues } = await api.get('/venues', { 'content.parents': ctx.query.id }, { accessToken: token })
    const venuesGroupedByYear = groupBy(venues, venue => venue.content.year)

    if (!venuesGroupedByYear) {
      return {
        statusCode: 400,
        message: 'Venues list unavailable. Please try again later',
      }
    }
    return { venueSeries, venuesGroupedByYear }
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
      return { statusCode: 403, message: 'You don\'t have permission to view this venue' }
    }
    return { statusCode: error.status || 500, message: error.message }
  }
}

Venue.bodyClass = 'venue'

export default withError(Venue)
