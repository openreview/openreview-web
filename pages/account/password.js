/* globals promptError: false */
/* globals promptMessage: false */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import withError from '../../components/withError'
import api from '../../lib/api-client'

import '../../styles/pages/reset.less'

const ResetForm = ({ resetToken }) => {
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length === 0) {
      setError('Password cannot be empty')
      return
    }
    if (password !== passwordConfirmation) {
      setError('Passwords must match')
      return
    }

    try {
      const apiRes = await api.put(`/reset/${resetToken}`, { password })
      promptMessage('Your password has been updated. Please log in with your new password to continue.')
      router.push('/login')
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (error) {
      promptError(error)
    }
  }, [error])

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="password-input">Password</label>
        <input
          id="password-input"
          type="password"
          className={`form-control ${error ? 'form-invalid' : ''}`}
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password-input-2">Confirm Password</label>
        <input
          id="password-input-2"
          type="password"
          className={`form-control ${error ? 'form-invalid' : ''}`}
          placeholder="Confirm new password"
          value={passwordConfirmation}
          onChange={e => setPasswordConfirmation(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Reset Password
      </button>
    </form>
  )
}

const PasswordReset = ({ resetToken }) => (
  <div className="row">
    <Head>
      <title key="title">Change Password | OpenReview</title>
    </Head>

    <div className="reset-container col-sm-12 col-md-8 col-lg-6 col-md-offset-2 col-lg-offset-3">
      <h1>Reset Password</h1>

      <p className="text-muted">
        Enter your new password below.
      </p>
      <ResetForm resetToken={resetToken} />

      <p className="help-block">
        <Link href="/login"><a>Back to Login</a></Link>
      </p>
    </div>
  </div>
)

PasswordReset.getInitialProps = async (ctx) => {
  if (!ctx.query.token) {
    return { statusCode: 404, message: 'Page not found' }
  }

  const resetToken = ctx.query.token
  try {
    const apiRes = await api.get(`/resettable/${resetToken}`)
  } catch (error) {
    return { statusCode: 400, message: error.message }
  }

  return { resetToken }
}

PasswordReset.bodyClass = 'reset'

export default withError(PasswordReset)
