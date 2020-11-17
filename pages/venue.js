/* globals $: false */
/* globals marked: false */

import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { renderToString } from 'react-dom/server'
import { groupBy } from 'lodash'
import withError from '../components/withError'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'
import LoadingSpinner from '../components/LoadingSpinner'
import Accordion from '../components/Accordion'

// Page Styles
import '../styles/pages/venues.less'
import VenueDetails from '../components/VenueDetails'

const VenuesForYear = ({ year, filteredVenues }) => (
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

function Venue({ venueSeries, groupByYear, appContext }) {
  const [venuesByYear, setVenuesByYear] = useState(null)
  const router = useRouter()
  const { clientJsLoading } = appContext

  useEffect(() => {
    if (clientJsLoading) return

    const defaultRenderer = new marked.Renderer()
    setVenuesByYear(Object.keys(groupByYear).sort().reverse().map((year, index) => ({
      id: year,
      heading: <>
        <span className="h3">{year}</span>
        {' '}
        <span className="h4" style={{ color: '#777777' }}>
          (
          {groupByYear[year].length}
          {' '}
          {groupByYear[year].length > 1 ? 'venues' : 'venue'}
          )
        </span>
      </>,
      body: renderToString(<VenuesForYear year={year} filteredVenues={groupByYear[year]} />),
    })))
  }, [clientJsLoading])

  useEffect(() => {
    if (!venuesByYear) return

    // Scroll to and expand question referenced in URL
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
        {venueSeries.content.noteline && (<p Style="font-size: 1.25rem; color:@subtleGray">{venueSeries.content.noteline}</p>)}
        {
          venueSeries.content.external_links && venueSeries.content.external_links.length > 0
          && (<span Style="padding-right: 5px; word-wrap: break-word">External Links: </span>)
        }
        {venueSeries.content.external_links.map((el) => {
          if (el.link && el.domain) {
            return (<span Style="word-wrap: break-word" key={el.link}><a href={el.link}>{el.domain.toUpperCase()}</a></span>)
          }
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
  let venueSeries
  if (venueSeriesResponse.venues.length > 0) venueSeries = venueSeriesResponse.venues[0]

  const apiRes = await api.get('/venues', { 'content.parents': ctx.query.id })
  const filteredVenues = apiRes.venues
  const groupByYear = groupBy(filteredVenues, venue => venue.content.year)

  if (!groupByYear) {
    return {
      statusCode: 400,
      message: 'Venues list unavailable. Please try again later',
    }
  }

  return { venueSeries, groupByYear }
}

Venue.bodyClass = 'venues'

export default withError(Venue)
