import serverAuth from '../../auth'
import ActiveConsoles from './ActiveConsoles'
import ActiveVenues from './ActiveVenues'

export default async function ActiveVenueConsole({ activeVenues, openVenues }) {
  const { user, token } = await serverAuth()

  return user ? (
    <ActiveConsoles
      activeVenues={activeVenues}
      openVenues={openVenues}
      user={user}
      token={token}
    />
  ) : (
    <ActiveVenues venues={activeVenues} />
  )
}
