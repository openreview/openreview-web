'use client'

import { Drawer } from 'antd'
import truncate from 'lodash/truncate'
import Link from 'next/link'
import LogoutLink from './LogoutLink'
import NavSearch from './NavSearch'

import legacyNavStyles from '../../styles/components/legacy-bootstrap-nav.module.scss'
import styles from '../../styles/components/nav.module.scss'

export default function NavSm({
  user,
  notificationCountSlot,
  drawerOpen,
  setDrawerOpen,
  drawerUserMenuOpen,
  setDrawerUserMenuOpen,
  closeDrawer,
}) {
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
        onClose={closeDrawer}
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
              onClick={closeDrawer}
            >
              Notifications
              {notificationCountSlot}
            </Link>
            <Link
              href="/activity"
              prefetch={false}
              className={legacyNavStyles.navDrawerLink}
              onClick={closeDrawer}
            >
              Activity
            </Link>
            <Link
              href="/tasks"
              prefetch={false}
              className={legacyNavStyles.navDrawerLink}
              onClick={closeDrawer}
            >
              Tasks
            </Link>
            <hr className={legacyNavStyles.navDrawerDivider} />
            <button
              type="button"
              className={legacyNavStyles.navDrawerUserToggle}
              onClick={() => setDrawerUserMenuOpen(!drawerUserMenuOpen)}
              aria-expanded={drawerUserMenuOpen}
            >
              <span>
                {truncate(user.profile.fullname, { length: 22 })}
                {user.impersonator && ' (Impersonated)'}
              </span>
              <span
                className={`${legacyNavStyles.navCaret}${drawerUserMenuOpen ? ` ${legacyNavStyles.isOpen}` : ''}`}
              />
            </button>
            {drawerUserMenuOpen && (
              <>
                <Link
                  href="/profile"
                  className={legacyNavStyles.navDrawerSubLink}
                  onClick={closeDrawer}
                >
                  Profile
                </Link>
                <Link
                  href="/profile/password-security"
                  className={legacyNavStyles.navDrawerSubLink}
                  onClick={closeDrawer}
                >
                  Password &amp; Security
                </Link>
              </>
            )}
            <hr className={legacyNavStyles.navDrawerDivider} />
            <LogoutLink className={legacyNavStyles.navDrawerLink} onClick={closeDrawer} />
          </>
        ) : (
          <a href="/login" className={legacyNavStyles.navDrawerLink} onClick={closeDrawer}>
            Login
          </a>
        )}
      </Drawer>
    </div>
  )
}
