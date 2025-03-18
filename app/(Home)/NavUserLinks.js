import truncate from 'lodash/truncate'
import Link from 'next/link'
import { connection } from 'next/server'
import LogoutLink from './LogoutLink'
import NavNotificationCount from './NavNotificationCount'
import serverAuth from '../auth'

export default async function NavUserLinks() {
  await connection()
  const { user } = await serverAuth()

  if (!user) {
    return (
      <ul className="nav navbar-nav navbar-right">
        <li id="user-menu">
          <Link href="/login">Login</Link>
        </li>
      </ul>
    )
  }

  return (
    <ul className="nav navbar-nav navbar-right">
      <li className="hidden-sm">
        <Link href="/notifications">
          Notifications
          <NavNotificationCount />
        </Link>
      </li>
      <li className="hidden-sm">
        <Link href="/activity">Activity</Link>
      </li>
      <li className="hidden-sm">
        <Link href="/tasks">Tasks</Link>
      </li>
      <li id="user-menu" className="dropdown">
        <a
          className="dropdown-toggle"
          data-toggle="dropdown"
          role="button"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <span>
            {truncate(user.profile.fullname, { length: user.impersonator ? 15 : 22 })}
            {user.impersonator && ' (Impersonated)'}
          </span>{' '}
          <span className="caret" />
        </a>

        <ul className="dropdown-menu">
          <li>
            <Link href="/profile">Profile</Link>
          </li>
          <li className="visible-sm-block">
            <Link href="/notifications">
              Notifications
              <NavNotificationCount />
            </Link>
          </li>
          <li className="visible-sm-block">
            <Link href="/activity">Activity</Link>
          </li>
          <li className="visible-sm-block">
            <Link href="/tasks">Tasks</Link>
          </li>
          <li role="separator" className="divider hidden-xs" />
          <li>
            <LogoutLink />
          </li>
        </ul>
      </li>
    </ul>
  )
}
