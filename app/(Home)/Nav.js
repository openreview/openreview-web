import serverAuth from '../auth'
import NavClient from './NavClient'
import NavNotificationCount from './NavNotificationCount'

import legacyNavStyles from '../../styles/components/legacy-bootstrap-nav.module.scss'
import styles from '../../styles/components/nav.module.scss'

export default async function Nav() {
  const { user } = await serverAuth()
  const notificationCountSlot = user ? <NavNotificationCount /> : null

  return (
    <nav className={`${styles.navBar} ${legacyNavStyles.navBar}`} role="navigation">
      <NavClient user={user ?? null} notificationCountSlot={notificationCountSlot} />
    </nav>
  )
}
