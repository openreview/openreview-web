'use client'

import { useCallback, useState } from 'react'
import useBreakpoint from '../../hooks/useBreakPoint'
import NavLg from './NavLg'
import NavMd from './NavMd'
import NavSm from './NavSm'

export default function NavClient({ user, notificationCountSlot }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerUserMenuOpen, setDrawerUserMenuOpen] = useState(false)

  const isMd = useBreakpoint('md')
  const isLg = useBreakpoint('lg')

  const closeDrawer = useCallback(() => {
    setMenuOpen(false)
    setDrawerUserMenuOpen(false)
  }, [])

  return (
    <>
      <NavSm
        user={user}
        notificationCountSlot={notificationCountSlot}
        drawerOpen={menuOpen && !isMd}
        setDrawerOpen={setMenuOpen}
        drawerUserMenuOpen={drawerUserMenuOpen}
        setDrawerUserMenuOpen={setDrawerUserMenuOpen}
        closeDrawer={closeDrawer}
      />
      <NavMd
        user={user}
        notificationCountSlot={notificationCountSlot}
        dropdownOpen={menuOpen && isMd && !isLg}
        setDropdownOpen={setMenuOpen}
      />
      <NavLg
        user={user}
        notificationCountSlot={notificationCountSlot}
        dropdownOpen={menuOpen && isLg}
        setDropdownOpen={setMenuOpen}
      />
    </>
  )
}
