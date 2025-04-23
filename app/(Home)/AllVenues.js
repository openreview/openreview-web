import { headers } from 'next/headers'
import api from '../../lib/api-client'
import { deburrString, formatGroupResults, prettyId } from '../../lib/utils'
import VenueList from './VenueList'
import VenueListItem from './VenueListItem'

export const revalidate = 600

export default async function AllVenues() {
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const sortAlpha = (arr) =>
    arr.sort((a, b) => prettyId(a.groupId).localeCompare(prettyId(b.groupId)))

  let venues = []
  try {
    venues = await api
      .get('/groups', { id: 'host' }, { remoteIpAddress })
      .then(formatGroupResults)
      .then(sortAlpha)
  } catch (error) {
    console.log('Error in AllVenues', {
      page: 'Home',
      component: 'AllVenues',
      apiError: error,
      apiRequest: {
        endpoint: '/groups',
        params: { id: 'host' },
      },
    })
  }

  const deburrFirstLetter = (venue) => {
    // return first letter of venue without accents and aumlats
    if (!venue) {
      return ''
    }

    return deburrString(prettyId(venue.groupId).charAt(0), true)
  }

  return (
    <>
      <section id="all-venues" className=" hidden-xs">
        <h1>All Venues</h1>
        <hr className="small" />
        <div>
          <ul className="conferences list-inline">
            {venues.map((venue, i) => {
              const isLeadingVenue =
                deburrFirstLetter(venue) > deburrFirstLetter(venues[i - 1])
              return (
                <VenueListItem
                  key={venue.groupId}
                  groupId={venue.groupId}
                  dueDate={venue.dueDate}
                  isLeadingVenue={isLeadingVenue}
                />
              )
            })}
          </ul>
        </div>
      </section>
      <section id="all-venues-mobile" className=" visible-xs">
        <h1>All Venues</h1>
        <hr className="small" />
        <VenueList name="all venues" venues={venues} maxVisible={100} listType="horizontal" />
      </section>
    </>
  )
}
