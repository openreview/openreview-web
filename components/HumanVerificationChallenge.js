// Renders the Turnstile challenge raised by useHumanVerification, next to a note explaining
// why the user is suddenly being asked to solve one. The container is always mounted;
// useTurnstileToken puts the widget in it only while a request is waiting on verification.
export default function HumanVerificationChallenge({ open, turnstileContainerRef, message }) {
  return (
    <>
      {open && <div className="alert alert-warning">{message}</div>}
      <div ref={turnstileContainerRef} />
    </>
  )
}
