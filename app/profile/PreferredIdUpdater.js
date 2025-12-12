'use client'

import { useEffect } from 'react'

export default function PreferredIdUpdater({ shouldRedirect, preferredId, children }) {
  useEffect(() => {
    if (shouldRedirect && preferredId) {
      const urlSearchParams = new URLSearchParams()
      urlSearchParams.set('id', preferredId)
      window.history.pushState(null, '', `?${urlSearchParams.toString()}`)
    }
  }, [shouldRedirect, preferredId])

  return children
}
