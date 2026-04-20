import serverAuth from '../auth'
import NavLg from './NavLg'
import NavMd from './NavMd'
import NavNotificationCount from './NavNotificationCount'
import NavSm from './NavSm'

import legacyNavStyles from '../../styles/components/legacy-bootstrap-nav.module.scss'
import styles from '../../styles/components/nav.module.scss'

export default async function Nav() {
  const { user } = await serverAuth()
  const notificationCountSlot = user ? <NavNotificationCount /> : null

  return (
    <nav className={`${styles.navBar} ${legacyNavStyles.navBar}`} role="navigation">
      <NavSm user={user ?? null} notificationCountSlot={notificationCountSlot} />
      <NavMd user={user ?? null} notificationCountSlot={notificationCountSlot} />
      <NavLg user={user ?? null} notificationCountSlot={notificationCountSlot} />
    </nav>
  )
}
