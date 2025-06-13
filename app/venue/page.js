import { groupBy } from 'lodash'
import Link from 'next/link'
import { headers } from 'next/headers'
import ErrorDisplay from '../../components/ErrorDisplay'
import api from '../../lib/api-client'
import serverAuth from '../auth'
import { inflect, prettyId } from '../../lib/utils'
import Accordion from '../../components/Accordion'
import styles from './Venue.module.scss'
import CommonLayout from '../CommonLayout'
import Banner from '../../components/Banner'
import { referrerLink } from '../../lib/banner-links'

export const metadata = {
  title: 'Venues | OpenReview',
}

export const dynamic = 'force-dynamic'

const GroupHeading = ({ year, count }) => (
  <>
    <span className="h3">{year}</span>{' '}
    <span className="h4">{`(${count} ${inflect(count, 'venue', 'venues')})`}</span>
  </>
)

const VenuesList = ({ filteredVenues }) => (
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

export default async function page({ searchParams }) {
  const { id } = await searchParams
  const { token } = await serverAuth()
  if (!id) return <ErrorDisplay message="Missing required parameter id" />

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  let hostGroup
  let venues
  let venuesByYear
  try {
    hostGroup = await api
      .get('/groups', { id, limit: 1 }, { accessToken: token, remoteIpAddress })
      .then((res) => res.groups?.[0] ?? null)
    if (!hostGroup) throw new Error()
    venues = await api
      .get('/groups', { host: id }, { accessToken: token, remoteIpAddress })
      .then((res) => res.groups ?? [])
    if (venues.length === 0) {
      venuesByYear = []
    } else {
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
      venuesByYear = Object.keys(groupedVenues)
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
    }
  } catch (error) {
    return (
      <ErrorDisplay
        message={
          error.message
            ? error.message
            : `Venues list for ${id} is unavailable. Please try again later`
        }
      />
    )
  }

  const descriptionRe = /^ {2}title: ["'](.+)["'], *$/gm
  const groupDescription = hostGroup.web ? (descriptionRe.exec(hostGroup.web)?.[1] ?? '') : ''

  return (
    <CommonLayout
      banner={<Banner>{referrerLink('[All Venues](/venues)')}</Banner>}
      editBanner={null}
    >
      <div className={styles.venue}>
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
                options={{
                  id: 'venues',
                  collapsed: true,
                  bodyContainer: 'div',
                }}
              />
            ) : (
              <p className="mt-2 empty-message">No venues found for group {hostGroup.id}</p>
            )}
          </div>
        </div>
      </div>
    </CommonLayout>
  )
}
