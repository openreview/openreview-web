/* globals promptError: false */

import { useState, useEffect, useContext } from 'react'
import truncate from 'lodash/truncate'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import UserContext from './UserContext'
import api from '../lib/api-client'

const NavUserLinks = () => {
  const { userLoading, logoutUser } = useContext(UserContext) ?? {}
  const { user, token } = useSelector((state) => state.root)
  const router = useRouter()
  const [loginPath, setLoginPath] = useState('/login')
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  async function loadUnreadNotificationCount(userEmail, accessToken) {
    if (!userEmail || !accessToken) return

    try {
      const { count } = await api.get(
        '/messages',
        { to: userEmail, viewed: false, transitiveMembers: true },
        { accessToken }
      )
      setUnreadNotifications(count)
    } catch (error) {
      /* empty */
    }
  }

  const handleLogout = async (e) => {
    e.preventDefault()

    try {
      await api.post('/logout')
      logoutUser()
      window.localStorage.setItem('openreview.lastLogout', Date.now())
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (userLoading || user) return

    const routesToSkipRedirection = [
      '/',
      '/login',
      '/confirm',
      '/logout',
      '/signup',
      '/404',
      '/profile/activate',
      '/reset',
      '/user/password',
    ]
    if (routesToSkipRedirection.includes(router.pathname)) {
      setLoginPath('/login')
      return
    }

    setLoginPath(`/login?redirect=${encodeURIComponent(router.asPath)}&noprompt=true`)
  }, [user, userLoading, router.asPath])

  useEffect(() => {
    if (!user) return
    loadUnreadNotificationCount(user.profile.emails?.[0], token)
  }, [user])

  if (!user) {
    return (
      <ul className="nav navbar-nav navbar-right">
        <li id="user-menu">
          <Link href={loginPath}>Login</Link>
        </li>
      </ul>
    )
  }

  return (
    <ul className="nav navbar-nav navbar-right">
      <li className="hidden-sm">
        <Link href="/notifications">
          Notifications
          {unreadNotifications > 0 && <span className="badge">{unreadNotifications}</span>}
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
              {unreadNotifications > 0 && <span className="badge">{unreadNotifications}</span>}
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
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/logout" onClick={handleLogout}>
              Logout
            </a>
          </li>
        </ul>
      </li>
    </ul>
  )
}

export default NavUserLinks
