import Head from 'next/head'
import withError from '../components/withError'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import Accordion from '../components/Accordion'
import { renderToString } from 'react-dom/server'

// Page Styles
import '../styles/pages/venues.less'
import VenueDetails from '../components/VenueDetails'

const VenuesForYear = ({ year, filtered_venues }) => (
  <>
    {/* <h2>{year} : {filtered_venues.length}</h2>
    <hr /> */}

    <div className="groups">
      <ul className="list-unstyled venues-list">
        {filtered_venues.map(venue => (
          <li key={venue.id}>
            <VenueDetails venue={venue} />
            <br />
          </li>
        ))}
      </ul>
    </div>
  </>
)

const Venues = ({ venueSeries, groupByYear }) => (
  <>
    <Head>
      <title key="title">Venue Directory | OpenReview</title>
    </Head>

    <header className="clearfix">
      <h2>{venueSeries.content.name}</h2>
      {venueSeries.content.noteline && (<p>{venueSeries.content.noteline}</p>)}
      {
        venueSeries.content.external_links && venueSeries.content.external_links.length > 0 &&
        (<span Style="padding-right: 5px; word-wrap: break-word">External Links: </span>)
      }
      {venueSeries.content.external_links.map(el => {
        if (el.link && el.name) {
          return (<span Style="padding-right: 15px; word-wrap: break-word" key={el.link}><a href={el.link}>{el.name}</a></span>)
        }
      })}
      <hr />
    </header>
  </>
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
      heading: <><span className="h3">{year}</span>{' '}<span className="h5">({groupByYear[year].length} {groupByYear[year].length > 1 ? 'venues' : 'venue'})</span></>,
      body: renderToString(<VenuesForYear year={year} filtered_venues={groupByYear[year]} />),
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
        <h2>{venueSeries.content.name}</h2>
        {venueSeries.content.noteline && (<p>{venueSeries.content.noteline}</p>)}
        {
          venueSeries.content.external_links && venueSeries.content.external_links.length > 0 &&
          (<span Style="padding-right: 5px; word-wrap: break-word">External Links: </span>)
        }
        {venueSeries.content.external_links.map(el => {
          // <li key={pc.url}><a href={pc.url}>{pc.name}</a></li>
          if (el.link && el.name) {
            return (<span Style="padding-right: 15px; word-wrap: break-word" key={el.link}><a href={el.link}>{el.name}</a></span>)
          }
        })}
        <hr></hr>
      </header>

      <div className="row">

        {venuesByYear ? (
          <Accordion
            sections={venuesByYear}
            options={{ id: 'venues', collapsed: true, html: true }}
          />
        ) : (
            <LoadingSpinner />
          )}

      </div>
    </>
  )
}

Venue.getInitialProps = async (ctx) => {
  const venueSeriesResponse = await api.get('/venues', { id: ctx.query.id })
  let venueSeries;
  if (venueSeriesResponse.venues.length > 0)
    venueSeries = venueSeriesResponse.venues[0]

  const apiRes = await api.get('/venues', { parents: ctx.query.id })
  const filtered_venues = apiRes.venues

  const groupBy = (array, key) => {
    return array.reduce((result, currentValue) => {
      (result[currentValue.content[key]] = result[currentValue.content[key]] || []).push(
        currentValue
      );
      return result;
    }, {});
  };

  const groupByYear = groupBy(filtered_venues, 'year');

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
