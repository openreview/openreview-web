/* globals promptError: false */
/* globals promptMessage: false */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'

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
      promptMessage(
        'Your password has been updated. Please log in with your new password to continue.'
      )
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
          onChange={(e) => setPassword(e.target.value)}
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
          onChange={(e) => setPasswordConfirmation(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Reset Password
      </button>
    </form>
  )
}

const PasswordReset = () => {
  const [resetToken, setResetToken] = useState(null)
  const [error, setError] = useState(null)
  const query = useQuery()

  const loadResetToken = async (token) => {
    try {
      const { resettable } = await api.get(`/resettable/${token}`)
      if (resettable?.token) {
        setResetToken(resettable.token)
      } else {
        setError({ statusCode: 400, message: 'Token not found' })
      }
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  useEffect(() => {
    if (!query) return

    if (!query.token) {
      setError({ statusCode: 404, message: 'Page not found' })
      return
    }

    loadResetToken(query.token)
  }, [query])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <div className="row">
      <Head>
        <title key="title">Change Password | OpenReview</title>
      </Head>

      <div className="reset-container col-sm-12 col-md-8 col-lg-6 col-md-offset-2 col-lg-offset-3">
        <h1>Reset Password</h1>

        {resetToken ? (
          <>
            <p className="text-muted">Enter your new password below.</p>
            <ResetForm resetToken={resetToken} />

            <p className="help-block">
              <Link href="/login">Back to Login</Link>
            </p>
          </>
        ) : (
          <LoadingSpinner inline />
        )}
      </div>
    </div>
  )
}

PasswordReset.bodyClass = 'reset'

export default PasswordReset
