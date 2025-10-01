'use client'

import { use, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setNotificationCount } from '../../notificationSlice'

export default function NotificationCount({ notificationCountP }) {
  const { count: initialCount } = use(notificationCountP)
  const { count: storeCount } = useSelector((state) => state.notification)
  const [count, setCount] = useState(initialCount)

  const dispatch = useDispatch()

  useEffect(() => {
    if (storeCount === null) {
      dispatch(setNotificationCount(initialCount))
      return
    }
    setCount(storeCount)
  }, [storeCount])

  if (!count) return null
  return <span className="badge">{count}</span>
}
