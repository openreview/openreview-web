/* globals $: false */
/* globals marked: false */

import Head from 'next/head'
import { useState, useEffect } from 'react'
import Router from 'next/router'
import { renderToString } from 'react-dom/server'
import { groupBy } from 'lodash'
import withError from '../components/withError'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'
import LoadingSpinner from '../components/LoadingSpinner'
import Accordion from '../components/Accordion'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'
import { auth } from '../lib/auth'

// Page Styles
import '../styles/pages/venue.less'
import VenueDetails from '../components/VenueDetails'

function VenuesForYear({ filteredVenues }) {
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

function HeadingElement({ year, venuesGroupedByYear }) {
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
      heading: <HeadingElement year={year} venuesGroupedByYear={venuesGroupedByYear} />,
      body: renderToString(<VenuesForYear filteredVenues={venuesGroupedByYear[year]} />),
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
        {venueSeries.content.noteline && (<p className="noteline">{venueSeries.content.noteline}</p>)}
        {
          venueSeries.content.external_links?.length > 0
          && (<span className="external-links">External Links: </span>)
        }
        {venueSeries.content.external_links.map((el) => {
          if (el.link && el.domain) {
            return (<span className="external-links" key={el.link}><a href={el.link}>{el.domain.toUpperCase()}</a></span>)
          }
          return (<span />)
        }).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
        <hr />
      </header>

      <div className="row">
        {
          venuesByYear ? (
            <Accordion
              sections={venuesByYear}
              options={{ id: 'venues', collapsed: true, html: true }}
            />
          ) : (
            <LoadingSpinner />
          )
        }
      </div>
    </>
  )
}

Venue.getInitialProps = async (ctx) => {
  const venueSeriesResponse = await api.get('/venues', { id: ctx.query.id })
  const venueSeries = venueSeriesResponse.venues.length > 0 ? venueSeriesResponse.venues[0] : null

  const { user, token } = auth(ctx)
  try {
    const { venues } = await api.get('/venues', { 'content.parents': ctx.query.id })
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
      return { statusCode: 403, message: 'You don\'t have permission to read this venue' }
    }
    return { statusCode: error.status || 500, message: error.message }
  }
}

Venue.bodyClass = 'venue'

export default withError(Venue)
