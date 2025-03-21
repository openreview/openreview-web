/* globals promptError,promptMessage,$: false */

import { useState, useContext, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import truncate from 'lodash/truncate'
import UserContext from '../components/UserContext'
import api from '../lib/api-client'
import { isValidEmail } from '../lib/utils'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const { loginUser } = useContext(UserContext)
  const { query } = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError(null)

    try {
      const { user, token } = await api.post('/login', { id: email, password })
      loginUser(user, token, query?.redirect || '/')
    } catch (error) {
      setLoginError(error)
      promptError(error.message)
    }
  }

  const handleResendConfirmation = async (e) => {
    e.preventDefault()

    try {
      await api.post('/activatable', { id: email })
      promptMessage(
        `A confirmation email with the subject "OpenReview signup confirmation" has been sent to ${email}.
        Please click the link in this email to confirm your email address and complete registration.`,
        { noTimeout: true }
      )
    } catch (error) {
      setLoginError(error)
      promptError(error.message)
    }
  }

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip()
  }, [])

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email-input">Email</label>
        <input
          id="email-input"
          type="text"
          className={`form-control ${loginError ? 'form-invalid' : ''}`}
          placeholder="Email"
          value={email}
          maxLength={254}
          onChange={(e) => setEmail(e.target.value.trim())}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password-input">Password</label>
        <input
          id="password-input"
          type="password"
          className={`form-control ${loginError ? 'form-invalid' : ''}`}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <p className="help-block">
        By logging in, you agree to the{' '}
        <a href="/legal/terms" target="_blank" rel="noopener noreferrer">
          <strong>Terms of Use</strong>
        </a>
        , last updated September 24, 2024.
      </p>
      <button
        type="submit"
        className="btn btn-login"
        disabled={!isValidEmail(email) || !password}
        data-original-title={
          email && !isValidEmail(email) ? 'Please enter a valid email address' : ''
        }
        data-toggle="tooltip"
      >
        Login to OpenReview
      </button>

      <p className="help-block">
        <Link href="/reset">Forgot your password?</Link>
        <br />
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a href="#" onClick={handleResendConfirmation}>
          Didn&apos;t receive email confirmation?
        </a>
      </p>
    </form>
  )
}

const Login = ({ appContext }) => {
  const { user, userLoading } = useContext(UserContext)
  const { isReady, query, replace } = useRouter()
  const { setLayoutOptions } = appContext

  useEffect(() => {
    setLayoutOptions({ fullWidth: false, minimalFooter: false })
  }, [])

  // Redirect user to the specified page or the homepage if already logged in.
  // Effect should not run when user changes, otherwise the page will redirect
  // as soon as the login form is submitted
  useEffect(() => {
    if (!isReady || userLoading) return

    if (user) {
      replace(query.redirect || '/')
    } else if (query.redirect && !query.noprompt) {
      promptMessage(`Please login to access ${truncate(query.redirect, { length: 100 })}`)
    }
  }, [isReady, query, userLoading])

  return (
    <div className="row">
      <Head>
        <title key="title">Login | OpenReview</title>
      </Head>

      <div className="login-container col-sm-6 col-md-5 col-lg-4 col-md-offset-1 col-lg-offset-2">
        <h1>Login</h1>
        <LoginForm />
      </div>

      <div className="signup-container col-sm-6 col-md-5 col-lg-4">
        <h1>New User?</h1>
        <div>
          <Link href="/signup" className="btn">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

Login.bodyClass = 'login'

export default Login
