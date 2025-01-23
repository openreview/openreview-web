'use client'

/* globals promptMessage,promptError: false */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import api from '../../../lib/api-client'
import { setUser } from '../../../rootSlice'

const ResetForm = ({ resetToken }) => {
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()
  const dispatch = useDispatch()

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
      const result = await api.put(`/reset/${resetToken}`, { password })
      promptMessage(
        'Your password has been updated. Please log in with your new password to continue.'
      )
      dispatch(setUser(result))
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

export default function Password({ loadResetTokenP }) {
  const { resettable, errorMessage } = use(loadResetTokenP)
  if (errorMessage) throw new Error(errorMessage)
  if (!resettable?.token) throw new Error('Token not found')

  return (
    <>
      <p className="text-muted">Enter your new password below.</p>
      <ResetForm resetToken={resettable.token} />

      <p className="help-block">
        <Link href="/login">Back to Login</Link>
      </p>
    </>
  )
}
