import { useEffect, useRef, useState } from 'react'
import useTurnstileToken from './useTurnstileToken'

const supersededError = () => {
  const error = new Error(
    'Your change was not saved. Please complete the verification and try again.'
  )
  error.name = 'HumanVerificationSupersededError'
  return error
}

// Wraps a request so that a HumanVerificationRequiredError puts it on hold instead of
// failing: a Turnstile widget is rendered and the request is replayed with the token the
// user earns by solving it. The promise handed back to the caller settles with the replay,
// so call sites only have to merge the options they are given into their api call.
export default function useHumanVerification(key) {
  const [needsHumanVerification, setNeedsHumanVerification] = useState(false)
  const pendingRequestRef = useRef(null)
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken(
    key,
    needsHumanVerification
  )

  const runWithHumanVerification = (sendRequest) =>
    sendRequest({}).catch((error) => {
      if (error.name !== 'HumanVerificationRequiredError') throw error

      return new Promise((resolve, reject) => {
        // Only one request can be held at a time, so let go of any earlier one to keep
        // whatever is waiting on it from hanging.
        pendingRequestRef.current?.reject(supersededError())
        pendingRequestRef.current = { sendRequest, resolve, reject }
        setNeedsHumanVerification(true)
      })
    })

  // The challenge is rendered wherever the page has room for it, which is not necessarily
  // next to the control the user just used, so bring it into view.
  useEffect(() => {
    if (!needsHumanVerification) return
    turnstileContainerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }, [needsHumanVerification])

  useEffect(() => {
    if (!turnstileToken || !pendingRequestRef.current) return

    const { sendRequest, resolve, reject } = pendingRequestRef.current
    pendingRequestRef.current = null
    setNeedsHumanVerification(false)
    sendRequest({ 'cf-turnstile-token': turnstileToken }).then(resolve, reject)
  }, [turnstileToken])

  return { runWithHumanVerification, needsHumanVerification, turnstileContainerRef }
}
