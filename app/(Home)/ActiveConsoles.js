import { headers } from 'next/headers'
import api from '../../lib/api-client'
import VenueList from './VenueList'
import serverAuth from '../auth'

export default async function ActiveConsoles({ activeVenues, openVenues }) {
  const { user, token } = await serverAuth()
  const activeAndOpenVenues = activeVenues.concat(openVenues)

  if (!user) return null

  let venues = null
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')
  try {
    const result = await api.get(
      '/groups',
      { member: user.id, web: true, select: 'id' },
      { accessToken: token, remoteIpAddress }
    )
    venues = result.groups.flatMap((venue) => {
      if (!activeAndOpenVenues.find((p) => venue.id.startsWith(p.groupId))) return []
      return { groupId: venue.id }
    })
  } catch (error) {
    console.log('Error in ActiveConsoles', {
      page: 'Home',
      component: 'ActiveConsoles',
      user: user?.id,
      apiError: error,
      apiRequest: {
        endpoint: '/groups',
        params: { member: user?.id, web: true, select: 'id' },
      },
    })
  }

  if (!venues?.length) return null

  return (
    <section>
      <h1>Your Active Consoles</h1>
      <hr className="small" />
      <VenueList name="active consoles" venues={venues} />
    </section>
  )
}
