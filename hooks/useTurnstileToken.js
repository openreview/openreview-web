/* globals promptError: false */
import { useEffect, useState } from 'react'

export default function useTurnstileToken(key, renderWidget) {
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [widgetId, setWidgetId] = useState(null)
  const [turnstileContainer, setTurnstileContainer] = useState(null)

  useEffect(() => {
    if (!turnstileContainer || renderWidget === false) {
      setTurnstileToken(null)
      if (widgetId) {
        window.turnstile.remove(widgetId)
        setWidgetId(null)
      }
      return
    }
    if (window.turnstile) {
      try {
        const id = window.turnstile.render(turnstileContainer, {
          sitekey: process.env.TURNSTILE_SITEKEY,
          action: key,
          callback: (token) => {
            setTurnstileToken(token)
          },
        })
        setWidgetId(id)
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.log('Error rendering Turnstile widget:', error)
      }
    } else {
      promptError(
        'Could not verify browser. Please make sure third-party scripts are not being blocked and try again.'
      )
    }
  }, [key, renderWidget, turnstileContainer])

  return { turnstileToken, turnstileContainerRef: setTurnstileContainer }
}
