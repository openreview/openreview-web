'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function PreferredIdUpdater({ shouldRedirect, preferredId, children }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (shouldRedirect && preferredId) {
      const urlSearchParams = new URLSearchParams(searchParams.toString())
      urlSearchParams.set('id', preferredId)
      window.history.pushState(null, '', `?${urlSearchParams.toString()}`)
    }
  }, [shouldRedirect, preferredId, searchParams])

  return children
}
