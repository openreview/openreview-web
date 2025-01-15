'use client'

/* globals promptMessage: false */
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { truncate } from 'lodash'
import CommonLayout from '../CommonLayout'
import useUser from '../../hooks/useUser'

export default function Layout({ children }) {
  // const { user } = useSelector((state) => state.root)
  const { user } = useUser()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  useEffect(() => {
    if (user === null) return // refresh failed
    if (user) {
      window.location.replace(redirect ?? '/')
    } else if (redirect) {
      promptMessage(`Please login to access ${truncate(redirect, { length: 100 })}`)
    }
  }, [user])
  return <CommonLayout>{children}</CommonLayout>
}
