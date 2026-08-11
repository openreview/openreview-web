'use client'

import { Dropdown } from 'antd'
import truncate from 'lodash/truncate'
import Link from 'next/link'
import LogoutLink from './LogoutLink'
import NavSearch from './NavSearch'

import legacyNavStyles from '../../styles/components/legacy-bootstrap-nav.module.scss'
import styles from '../../styles/components/nav.module.scss'

export default function NavLg({ user, notificationCountSlot, dropdownOpen, setDropdownOpen }) {
  const dropdownItems = user
    ? [
        {
          key: 'profile',
          label: (
            <Link href="/profile" className={legacyNavStyles.navDropdownItem}>
              Profile
            </Link>
          ),
          style: { padding: 0 },
        },
        {
          key: 'password',
          label: (
            <Link
              href="/profile/password-security"
              className={legacyNavStyles.navDropdownItem}
            >
              Password &amp; Security
            </Link>
          ),
          style: { padding: 0 },
        },
        { type: 'divider' },
        {
          key: 'logout',
          label: <LogoutLink className={legacyNavStyles.navDropdownItem} />,
          style: { padding: 0 },
        },
      ]
    : []

  return (
    <div className={`${styles.navDesktop} ${legacyNavStyles.navContainer}`}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link href="/" className={legacyNavStyles.navBrand}>
          <strong>OpenReview</strong>.net
        </Link>
        <NavSearch />
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {user ? (
          <>
            <Link href="/notifications" prefetch={false} className={legacyNavStyles.navLink}>
              Notifications
              {notificationCountSlot}
            </Link>
            <Link href="/activity" prefetch={false} className={legacyNavStyles.navLink}>
              Activity
            </Link>
            <Link href="/tasks" prefetch={false} className={legacyNavStyles.navLink}>
              Tasks
            </Link>
            <Dropdown
              menu={{ items: dropdownItems }}
              trigger={['click']}
              placement="bottomRight"
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
            >
              <a
                id="user-menu"
                className={`${legacyNavStyles.navUserTrigger}${dropdownOpen ? ` ${legacyNavStyles.isOpen}` : ''}`}
                onClick={(e) => e.preventDefault()}
              >
                <span>
                  {truncate(user.profile.fullname, {
                    length: user.impersonator ? 12 : 22,
                  })}
                  {user.impersonator && ' (Impersonated)'}
                </span>{' '}
                <span className={legacyNavStyles.navCaret} />
              </a>
            </Dropdown>
          </>
        ) : (
          <a href="/login" className={legacyNavStyles.navLink}>
            Login
          </a>
        )}
      </div>
    </div>
  )
}
