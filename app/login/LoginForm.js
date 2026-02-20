'use client'

/* globals promptError,promptMessage,$: false */
import Link from 'next/link'
import { useReducer, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import api from '../../lib/api-client'
import { isValidEmail, sanitizeRedirectUrl } from '../../lib/utils'
import { setNotificationCount } from '../../notificationSlice'
import { resetRefreshTokenStatus } from '../../lib/clientAuth'
import LoginMFAModal from './LoginMFAModal'

export default function LoginForm() {
  // eslint-disable-next-line no-use-before-define
  const [formState, setFormState] = useReducer(loginFormReducer, {
    email: '',
    password: '',
    loading: false,
    error: null,
  })
  const [mfaStatus, setMfaStatus] = useState(null)
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  function loginFormReducer(state, action) {
    switch (action.type) {
      case 'UPDATE_EMAIL':
        return {
          email: action.payload,
          password: state.password,
          loading: false,
          error: false,
        }
      case 'UPDATE_PASSWORD':
        return { email: state.email, password: action.payload, loading: false, error: false }
      case 'START_LOADING':
        return { ...state, loading: true, error: false }
      case 'HAS_ERROR':
        return { ...state, loading: false, error: true }
      default:
        return state
    }
  }

  const handleResendConfirmation = async (e) => {
    e.preventDefault()

    try {
      await api.post('/activatable', { id: formState.email })
      promptMessage(
        `A confirmation email with the subject "OpenReview signup confirmation" has been sent to ${formState.email}.
        Please click the link in this email to confirm your email address and complete registration.`,
        8
      )
    } catch (error) {
      setFormState({ type: 'HAS_ERROR' })
      promptError(error.message)
    }
  }

  const completeLogin = () => {
    resetRefreshTokenStatus()
    dispatch(setNotificationCount(null))
    window.location.replace(sanitizeRedirectUrl(redirect))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormState({ type: 'START_LOADING' })
    try {
      const result = await api.post('/login', {
        id: formState.email,
        password: formState.password,
      })
      if (!result.mfaPending) {
        completeLogin()
      } else {
        setMfaStatus(result)
        $('#login-mfa-modal').modal('show')
      }
    } catch (error) {
      setFormState({ type: 'HAS_ERROR' })
      promptError(error.message)
    }
  }

  return (
    <>
      <form>
        <div className="form-group">
          <label htmlFor="email-input">Email</label>
          <input
            id="email-input"
            type="text"
            className={`form-control ${formState.error ? 'form-invalid' : ''}`}
            placeholder="Email"
            value={formState.email}
            maxLength={254}
            onChange={(e) =>
              setFormState({ type: 'UPDATE_EMAIL', payload: e.target.value.trim() })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="password-input">Password</label>
          <input
            id="password-input"
            type="password"
            className={`form-control ${formState.error ? 'form-invalid' : ''}`}
            placeholder="Password"
            value={formState.password}
            onChange={(e) =>
              setFormState({ type: 'UPDATE_PASSWORD', payload: e.target.value.trim() })
            }
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
          disabled={!isValidEmail(formState.email) || !formState.password || formState.loading}
          data-original-title={
            formState.email && !isValidEmail(formState.email)
              ? 'Please enter a valid email address'
              : ''
          }
          data-toggle="tooltip"
          onClick={handleSubmit}
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
      <LoginMFAModal
        mfaStatus={mfaStatus}
        completeLogin={completeLogin}
        setFormState={setFormState}
      />
    </>
  )
}
