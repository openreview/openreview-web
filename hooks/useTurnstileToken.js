/* globals promptError: false */
import { useEffect, useState } from 'react'

export default function useTurnstileToken(key, renderWidget) {
  const [turnstileToken, setTurnstileToken] = useState(null)

  useEffect(() => {
    if (!renderWidget) setTurnstileToken(null)
    if (window.turnstile) {
      window.turnstile.render(`#turnstile-${key}`, {
        sitekey: process.env.TURNSTILE_SITEKEY,
        action: key,
        callback: (token) => {
          setTurnstileToken(token)
        },
      })
    } else {
      promptError(
        'Could not verify browser. Please make sure third-party scripts are not being blocked and try again.'
      )
    }
  }, [key, renderWidget])

  return turnstileToken
}
