'use client'

/* globals promptMessage,promptError: false */
import { useEffect, useState } from 'react'
import Alert from '../../components/Alert'
import api from '../../lib/api-client'
import useTurnstileToken from '../../hooks/useTurnstileToken'
import { isValidEmail } from '../../lib/utils'
import useUser from '../../hooks/useUser'

const ResetForm = ({ setEmailSent }) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const { user } = useUser()
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken('reset')

  useEffect(() => {
    if (!user) return

    setEmail(user.profile.preferredEmail)
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const apiRes = await api.post('/resettable', { id: email, token: turnstileToken })
      setEmailSent(apiRes.id)
    } catch (apiError) {
      setError(apiError)
      promptError(apiError.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email-input">Email</label>
        <input
          id="email-input"
          type="email"
          className={`form-control ${error ? 'form-invalid' : ''}`}
          placeholder="Email address"
          value={email}
          maxLength={254}
          onChange={(e) => setEmail(e.target.value.trim())}
        />
      </div>
      <div ref={turnstileContainerRef} />
      <button
        type="submit"
        className="btn btn-primary"
        disabled={!isValidEmail(email) || !turnstileToken}
      >
        Reset Password
      </button>
    </form>
  )
}

export default function Reset() {
  const [emailSent, setEmailSent] = useState('')

  return emailSent ? (
    <Alert color="success">
      Your request has been received. If an account matches the email
      {'  '}
      <strong>{emailSent}</strong>, you will receive an email with the subject &quot;OpenReview
      Password Reset&quot;. Please follow the link in this email to reset your password.
    </Alert>
  ) : (
    <>
      <p className="text-muted">
        Enter your email address below and we&apos;ll send you a link to reset your password.
      </p>
      <ResetForm setEmailSent={setEmailSent} />
    </>
  )
}
