'use client'

import { Drawer } from 'antd'
import truncate from 'lodash/truncate'
import Link from 'next/link'
import { useState } from 'react'
import LogoutLink from './LogoutLink'
import NavSearch from './NavSearch'

export default function NavSm({ user, notificationCountSlot }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const close = () => setDrawerOpen(false)

  return (
    <div className="or-nav-mobile or-nav-container">
      <Link href="/" className="or-nav-brand">
        <strong>OpenReview</strong>.net
      </Link>

      <button
        type="button"
        className="or-nav-toggle"
        onClick={() => setDrawerOpen(!drawerOpen)}
        aria-label="Toggle navigation"
        aria-expanded={drawerOpen}
      >
        <span className="or-nav-toggle-bar" />
        <span className="or-nav-toggle-bar" />
        <span className="or-nav-toggle-bar" />
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
        mask
        maskClosable
      >
        <NavSearch inDrawer />
        {user ? (
          <>
            <Link
              href="/notifications"
              prefetch={false}
              className="or-nav-drawer-link"
              onClick={close}
            >
              Notifications
              {notificationCountSlot}
            </Link>
            <Link
              href="/activity"
              prefetch={false}
              className="or-nav-drawer-link"
              onClick={close}
            >
              Activity
            </Link>
            <Link
              href="/tasks"
              prefetch={false}
              className="or-nav-drawer-link"
              onClick={close}
            >
              Tasks
            </Link>
            <hr className="or-nav-drawer-divider" />
            <span className="or-nav-drawer-user-name">
              {truncate(user.profile.fullname, { length: 22 })}
              {user.impersonator && ' (Impersonated)'}
            </span>
            <Link href="/profile" className="or-nav-drawer-link" onClick={close}>
              Profile
            </Link>
            <Link
              href="/profile/password-security"
              className="or-nav-drawer-link"
              onClick={close}
            >
              Password &amp; Security
            </Link>
            <hr className="or-nav-drawer-divider" />
            <LogoutLink className="or-nav-drawer-link" onClick={close} />
          </>
        ) : (
          <a href="/login" className="or-nav-drawer-link" onClick={close}>
            Login
          </a>
        )}
      </Drawer>
    </div>
  )
}
