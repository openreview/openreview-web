import serverAuth from '../auth'
import NavLg from './NavLg'
import NavMd from './NavMd'
import NavNotificationCount from './NavNotificationCount'
import NavSm from './NavSm'

export default async function Nav() {
  const { user } = await serverAuth()
  const notificationCountSlot = user ? <NavNotificationCount /> : null

  // All three layout components are rendered. CSS media queries show exactly
  // one at a time based on viewport. This avoids JS-based hydration layout
  // shift and keeps each component's logic focused on its breakpoint.
  return (
    <nav className="or-navbar" role="navigation">
      <NavSm user={user ?? null} notificationCountSlot={notificationCountSlot} />
      <NavMd user={user ?? null} notificationCountSlot={notificationCountSlot} />
      <NavLg user={user ?? null} notificationCountSlot={notificationCountSlot} />
    </nav>
  )
}
