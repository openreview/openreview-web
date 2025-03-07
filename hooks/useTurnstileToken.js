/* globals promptError: false */
import { useEffect, useRef, useState } from 'react'

export default function useTurnstileToken(key, renderWidget) {
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [widgetId, setWidgetId] = useState(null)
  const turnstileContainerRef = useRef()

  useEffect(() => {
    if (!turnstileContainerRef.current || renderWidget === false) {
      setTurnstileToken(null)
      if (widgetId) {
        window.turnstile.remove(widgetId)
      }
      return
    }
    if (window.turnstile) {
      const id = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: process.env.TURNSTILE_SITEKEY,
        action: key,
        callback: (token) => {
          setTurnstileToken(token)
        },
      })
      setWidgetId(id)
    } else {
      promptError(
        'Could not verify browser. Please make sure third-party scripts are not being blocked and try again.'
      )
    }
  }, [key, renderWidget])

  return { turnstileToken, turnstileContainerRef }
}
