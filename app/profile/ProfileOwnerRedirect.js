'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ({ shouldRedirect, preferredId }) {
  const router = useRouter()
  useEffect(() => {
    if (!shouldRedirect || !preferredId) return
    router.replace(`/profile?id=${preferredId}`)
  }, [shouldRedirect, preferredId])
  return null
}
