'use client'

import Link from 'next/link'
import api from '../../lib/api-client'

export default function LeaveImpersonationLink({ className, style, onClick }) {
  const handleLeaveImpersonation = async (e) => {
    e.preventDefault()
    onClick?.()

    try {
      await api.post('/impersonate/exit')
      window.location.assign('/user/impersonate')
    } catch (error) {
      // oxlint-disable-next-line no-console
      console.log('Error in LeaveImpersonationLink', {
        page: 'Home',
        component: 'LeaveImpersonationLink',
        apiError: error,
        apiRequest: {
          endpoint: '/impersonate/exit',
        },
      })
      promptError(error.message)
    }
  }

  return (
    <Link href="#" onClick={handleLeaveImpersonation} className={className} style={style}>
      Leave Impersonation
    </Link>
  )
}
