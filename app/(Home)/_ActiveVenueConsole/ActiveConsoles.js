import chunk from 'lodash/chunk'
import uniq from 'lodash/uniq'
import { headers } from 'next/headers'
import api from '../../../lib/api-client'
import VenueList from '../VenueList'
import ActiveVenues from './ActiveVenues'

export default async function ActiveConsoles({ activeVenues, openVenues, user, token }) {
  const activeAndOpenVenues = activeVenues.concat(openVenues)

  if (!user) return null

  let venues = null
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')
  const memberIds = [...user.profile.emails, ...user.profile.usernames]
  try {
    const userGroups = await api.getAllWithAfter(
      '/groups',
      { members: memberIds, select: 'id' },
      { accessToken: token, remoteIpAddress }
    )
    const authorsGroupIds = userGroups.flatMap((group) => {
      if (!group.id.endsWith('/Authors')) return []
      if (!activeAndOpenVenues.find((p) => group.id.startsWith(p.groupId))) return []
      return group.id
    })

    const consoleGroups = await chunk([...memberIds, ...authorsGroupIds], 25).reduce(
      (prev, membersChunk) =>
        prev.then((acc) =>
          api
            .get(
              '/groups',
              { members: membersChunk, web: true, select: 'id' },
              { accessToken: token, remoteIpAddress }
            )
            .then((result) => acc.concat(result.groups))
        ),
      Promise.resolve([])
    )
    venues = uniq(consoleGroups.map((group) => group.id)).flatMap((groupId) => {
      if (!activeAndOpenVenues.find((p) => groupId.startsWith(p.groupId))) return []
      return { groupId }
    })
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.log('Error in ActiveConsoles', {
      page: 'Home',
      component: 'ActiveConsoles',
      user: user?.id,
      apiError: error,
      apiRequest: {
        endpoint: '/groups',
        params: { members: memberIds, select: 'id' },
      },
    })
  }

  if (!venues?.length) return <ActiveVenues venues={activeVenues} />

  return (
    <section>
      <h1>Your Active Consoles</h1>
      <hr className="small" />
      <VenueList name="active consoles" venues={venues} />
    </section>
  )
}
