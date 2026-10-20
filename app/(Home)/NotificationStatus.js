'use client'

import { use, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setUnreadNotification } from '../../notificationSlice'

import legacyNavStyles from '../../styles/components/legacy-bootstrap-nav.module.scss'

export default function NotificationStatus({ hasUnreadNotificationP }) {
  const initialHasUnreadNotification = use(hasUnreadNotificationP)
  const { hasUnreadNotification: storeHasUnreadNotification } = useSelector(
    (state) => state.notification
  )
  const hasUnreadNotification = storeHasUnreadNotification ?? initialHasUnreadNotification

  const dispatch = useDispatch()

  useEffect(() => {
    if (storeHasUnreadNotification === null) {
      dispatch(setUnreadNotification(initialHasUnreadNotification))
    }
  }, [storeHasUnreadNotification])

  if (!hasUnreadNotification) return null
  return (
    <span className={legacyNavStyles.navBadge}>
      <span className="sr-only">unread</span>
    </span>
  )
}
