'use client'

import { Drawer } from 'antd'
import truncate from 'lodash/truncate'
import Link from 'next/link'
import { useState } from 'react'
import LogoutLink from './LogoutLink'
import NavSearch from './NavSearch'

import legacyNavStyles from '../../styles/components/legacy-bootstrap-nav.module.scss'
import styles from '../../styles/components/nav.module.scss'

export default function NavSm({ user, notificationCountSlot }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const close = () => setDrawerOpen(false)

  return (
    <div className={`${styles.navMobile} ${legacyNavStyles.navContainer}`}>
      <Link href="/" className={legacyNavStyles.navBrand}>
        <strong>OpenReview</strong>.net
      </Link>

      <button
        type="button"
        className={legacyNavStyles.navToggle}
        onClick={() => setDrawerOpen(!drawerOpen)}
        aria-label="Toggle navigation"
        aria-expanded={drawerOpen}
      >
        <span className={legacyNavStyles.navToggleBar} />
        <span className={legacyNavStyles.navToggleBar} />
        <span className={legacyNavStyles.navToggleBar} />
      </button>

      <Drawer
        placement="top"
        open={drawerOpen}
        onClose={close}
        closable={false}
        size="auto"
        styles={{
          body: { padding: 0 },
          wrapper: { boxShadow: 'none' },
        }}
        rootStyle={{ top: 50 }}
        mask={{ closable: true }}
      >
        <NavSearch inDrawer />
        {user ? (
          <>
            <Link
              href="/notifications"
              prefetch={false}
              className={legacyNavStyles.navDrawerLink}
              onClick={close}
            >
              Notifications
              {notificationCountSlot}
            </Link>
            <Link
              href="/activity"
              prefetch={false}
              className={legacyNavStyles.navDrawerLink}
              onClick={close}
            >
              Activity
            </Link>
            <Link
              href="/tasks"
              prefetch={false}
              className={legacyNavStyles.navDrawerLink}
              onClick={close}
            >
              Tasks
            </Link>
            <hr className={legacyNavStyles.navDrawerDivider} />
            <span className={legacyNavStyles.navDrawerUserName}>
              {truncate(user.profile.fullname, { length: 22 })}
              {user.impersonator && ' (Impersonated)'}
            </span>
            <Link href="/profile" className={legacyNavStyles.navDrawerLink} onClick={close}>
              Profile
            </Link>
            <Link
              href="/profile/password-security"
              className={legacyNavStyles.navDrawerLink}
              onClick={close}
            >
              Password &amp; Security
            </Link>
            <hr className={legacyNavStyles.navDrawerDivider} />
            <LogoutLink className={legacyNavStyles.navDrawerLink} onClick={close} />
          </>
        ) : (
          <a href="/login" className={legacyNavStyles.navDrawerLink} onClick={close}>
            Login
          </a>
        )}
      </Drawer>
    </div>
  )
}
