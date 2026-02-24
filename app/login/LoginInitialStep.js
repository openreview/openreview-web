import { useState } from 'react'
import { isValidEmail } from '../../lib/utils'
import Link from 'next/link'
import SpinnerButton from '../../components/SpinnerButton'

import styles from './Login.module.scss'

const ResetPasswordResendConfirmationLinks = ({ email }) => {
  const handleResendConfirmation = async (e) => {
    e.preventDefault()

    try {
      await api.post('/activatable', { id: email })
      promptMessage(
        `A confirmation email with the subject "OpenReview signup confirmation" has been sent to ${email}.
        Please click the link in this email to confirm your email address and complete registration.`,
        8
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <p className="help-block">
      <Link href="/reset">Forgot your password?</Link>
      <br />
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a href="#" onClick={handleResendConfirmation}>
        Didn&apos;t receive email confirmation?
      </a>
    </p>
  )
}

const LoginInitialStep = ({ handleInitialSubmit }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className={styles.login}>
      <div className="row">
        <div className="login-container col-sm-6 col-md-5 col-lg-4 col-md-offset-1 col-lg-offset-2">
          <h1>Login</h1>
          <div>
            <div className="form-group">
              <label htmlFor="email-input">Email</label>
              <input
                id="email-input"
                type="text"
                className="form-control"
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
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value.trim())}
              />
            </div>
            <p className="help-block">
              By logging in, you agree to the{' '}
              <a href="/legal/terms" target="_blank" rel="noopener noreferrer">
                <strong>Terms of Use</strong>
              </a>
              , last updated September 24, 2024.
            </p>
            <SpinnerButton
              type="login"
              disabled={!isValidEmail(email) || !password || isLoading}
              loading={isLoading}
              data-original-title={
                email && !isValidEmail(email) ? 'Please enter a valid email address' : ''
              }
              data-toggle="tooltip"
              onClick={async () => {
                setIsLoading(true)
                const success = await handleInitialSubmit(email, password)
                if (!success) setIsLoading(false)
              }}
            >
              Login to OpenReview
            </SpinnerButton>
            <ResetPasswordResendConfirmationLinks email={email} />
          </div>
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
    </div>
  )

  return <></>
}

export default LoginInitialStep
