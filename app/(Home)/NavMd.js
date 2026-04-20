'use client'

import { Dropdown } from 'antd'
import truncate from 'lodash/truncate'
import Link from 'next/link'
import { useState } from 'react'
import LogoutLink from './LogoutLink'
import NavSearch from './NavSearch'

export default function NavMd({ user, notificationCountSlot }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const dropdownItems = user
    ? [
        {
          key: 'profile',
          label: (
            <Link href="/profile" className="or-nav-dropdown-item">
              Profile
            </Link>
          ),
          style: { padding: 0 },
        },
        {
          key: 'password',
          label: (
            <Link href="/profile/password-security" className="or-nav-dropdown-item">
              Password &amp; Security
            </Link>
          ),
          style: { padding: 0 },
        },
        {
          key: 'notifications',
          label: (
            <Link href="/notifications" prefetch={false} className="or-nav-dropdown-item">
              Notifications
              {notificationCountSlot}
            </Link>
          ),
          style: { padding: 0 },
        },
        {
          key: 'activity',
          label: (
            <Link href="/activity" prefetch={false} className="or-nav-dropdown-item">
              Activity
            </Link>
          ),
          style: { padding: 0 },
        },
        {
          key: 'tasks',
          label: (
            <Link href="/tasks" prefetch={false} className="or-nav-dropdown-item">
              Tasks
            </Link>
          ),
          style: { padding: 0 },
        },
        { type: 'divider' },
        {
          key: 'logout',
          label: <LogoutLink className="or-nav-dropdown-item" />,
          style: { padding: 0 },
        },
      ]
    : []

  return (
    <div className="or-nav-tablet or-nav-container">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link href="/" className="or-nav-brand">
          <strong>OpenReview</strong>.net
        </Link>
        <NavSearch />
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {user ? (
          <Dropdown
            menu={{ items: dropdownItems }}
            trigger={['click']}
            placement="bottomRight"
            open={dropdownOpen}
            onOpenChange={setDropdownOpen}
          >
            <a
              id="user-menu"
              className={`or-nav-user-trigger${dropdownOpen ? ' is-open' : ''}`}
              onClick={(e) => e.preventDefault()}
            >
              <span>
                {truncate(user.profile.fullname, {
                  length: user.impersonator ? 12 : 22,
                })}
                {user.impersonator && ' (Impersonated)'}
              </span>{' '}
              <span className="or-nav-caret" />
            </a>
          </Dropdown>
        ) : (
          <a href="/login" className="or-nav-link">
            Login
          </a>
        )}
      </div>
    </div>
  )
}
