/* globals promptError: false */

import { useState, useContext, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import UserContext from '../components/UserContext'
import Alert from '../components/Alert'
import api from '../lib/api-client'
import { isValidEmail } from '../lib/utils'

const ResetForm = ({ setEmailSent }) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const { user } = useContext(UserContext)

  useEffect(() => {
    if (!user) return

    setEmail(user.profile.preferredEmail)
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const apiRes = await api.post('/resettable', { id: email })
      setEmailSent(apiRes.id)
    } catch (apiError) {
      setError(apiError)
      if (apiError.message === 'User not found') {
        promptError('Sorry, no OpenReview profile with that email exists')
      } else {
        promptError(apiError.message)
      }
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

      <button type="submit" className="btn btn-primary" disabled={!isValidEmail(email)}>
        Reset Password
      </button>
    </form>
  )
}

function Reset() {
  const [emailSent, setEmailSent] = useState('')

  return (
    <div className="row">
      <Head>
        <title key="title">Reset Password | OpenReview</title>
      </Head>

      <div className="reset-container col-sm-12 col-md-8 col-lg-6 col-md-offset-2 col-lg-offset-3">
        <h1>Request Password Reset</h1>

        {emailSent ? (
          <Alert color="success">
            An email with the subject &quot;OpenReview Password Reset&quot; has been sent to
            {'  '}
            <strong>{emailSent}</strong>. Please follow the link in this email to reset your
            password.
          </Alert>
        ) : (
          <>
            <p className="text-muted">
              Enter your email address below and we&apos;ll send you a link to reset your
              password.
            </p>
            <ResetForm setEmailSent={setEmailSent} />
          </>
        )}

        <p className="help-block">
          <Link href="/login">
            <a>Back to Login</a>
          </Link>
          <br />
          <Link href="/signup">
            <a>Sign Up for OpenReview</a>
          </Link>
        </p>
      </div>
    </div>
  )
}

Reset.bodyClass = 'reset'

export default Reset
