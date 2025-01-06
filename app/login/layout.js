'use client'

/* globals promptMessage: false */
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { truncate } from 'lodash'
import CommonLayout from '../CommonLayout'

function LoginLayout({ children }) {
  const { user } = useSelector((state) => state.root)
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

export default function SuspensedLoginLayout({ children }) {
  return (
    <Suspense fallback={<CommonLayout>{children}</CommonLayout>}>
      <LoginLayout>{children}</LoginLayout>
    </Suspense>
  )
}
