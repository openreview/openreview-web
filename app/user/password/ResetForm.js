/* globals promptMessage,promptError: false */

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import api from '../../../lib/api-client'

export default function ResetForm({ resetToken }) {
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
      await api.put(`/reset/${resetToken}`, { password })
      promptMessage(
        'Your password has been updated. Please log in with your new password to continue.'
      )
      router.push('/login')
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (!error) return
    if (error) {
      promptError(error)
    }
    setError(null)
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
