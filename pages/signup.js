/* globals promptError: false */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import debounce from 'lodash/debounce'
import api from '../lib/api-client'

// Page Styles
import '../styles/pages/signup.less'

const SignupForm = ({ setRegisteredEmail }) => {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [matchingProfiles, setMatchingProfiles] = useState(null)
  const [error, setError] = useState(null)
  const [passwordVisible, setPasswordVisible] = useState(false)

  const getNewUsername = async () => {
    try {
      const { username } = await api.get('/tildeusername', { first: firstName, middle: middleName, last: lastName })
      if (username) {
        setNewUsername(username)
      }
    } catch (apiError) {
      setNewUsername('')
      setError(apiError)
      promptError(apiError.message)
    }
  }

  const getMatchingProfiles = async () => {
    try {
      const apiRes = await api.get('/profiles', {
        first: firstName, middle: middleName, last: lastName, limit: 50,
      })
      if (apiRes.profiles) {
        setMatchingProfiles(apiRes.profiles)
      }
    } catch (apiError) {
      setError(apiError)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newUsername) {
      return
    }
    if (!passwordVisible) {
      setPasswordVisible(true)
      return
    }

    const name = { first: firstName.trim(), middle: middleName.trim(), last: lastName.trim() }
    try {
      const apiRes = await api.post('/register', { email, password, name })
      setRegisteredEmail(apiRes.content?.preferredEmail || email)
    } catch (apiError) {
      setError(apiError)
      promptError(apiError.message)
    }
  }

  useEffect(() => {
    setError(null)
    if (firstName === '' || lastName === '') {
      setNewUsername('')
      return
    }

    getNewUsername()
    getMatchingProfiles()
  }, [firstName, middleName, lastName])

  useEffect(() => {
    setPasswordVisible(false)
  }, [email])

  return (
    <div className="signup-form-container">
      <form onSubmit={e => e.preventDefault()}>
        <div className="row">
          <div className="form-group col-xs-12 col-sm-4">
            <label htmlFor="first-input">First</label>
            <input
              type="text"
              id="first-input"
              className="form-control"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>

          <div className="form-group col-xs-12 col-sm-4">
            <label htmlFor="middle-input">
              Middle
              {' '}
              <span className="hint">(optional)</span>
            </label>
            <input
              type="text"
              id="middle-input"
              className="form-control"
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
              placeholder="Middle name"
            />
          </div>

          <div className="form-group col-xs-12 col-sm-4">
            <label htmlFor="last-input">Last</label>
            <input
              type="text"
              id="last-input"
              className="form-control"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>
      </form>

      <hr className="spacer" />

      <form className="form-inline" onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value.trim())}
            placeholder="Email address"
          />
          {!passwordVisible && (
            <button type="submit" className="btn btn-signup" disabled={!newUsername || !email}>
              Sign Up
            </button>
          )}
          {newUsername && (
            <span className="new-username hint">{`as ${newUsername}`}</span>
          )}
        </div>
        {passwordVisible && (
          <div style={{ 'padding-top': '.25rem' }}>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
            />
            {passwordVisible && (
              <button type="submit" className="btn btn-signup">
                Sign Up
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}

const ConfirmationMessage = ({ registeredEmail }) => (
  <div className="confirm-message col-sm-12 col-md-10 col-lg-8 col-md-offset-1 col-lg-offset-2">
    <h1>Thank You for Signing Up</h1>
    <p>
      An email with the subject &quot;OpenReview signup confirmation&quot; has been sent to your email
      {' '}
      <span className="email">{registeredEmail}</span>
      . Please click the link in this email and follow the instructions to confirm your email address
      and complete registration.
    </p>
    <p>
      <strong>
        To ensure that you receive all emails from OpenReview, please add noreply@openreview.net to
        your contacts list.
      </strong>
      {' '}
      In some rare cases email providers may delay delivery for up to 8 hours. If you have not
      received the confirmation email by then, please contact us.
    </p>
  </div>
)

const SignUp = () => {
  const [registeredEmail, setRegisteredEmail] = useState('')

  return (
    <div className="row">
      <Head>
        <title key="title">Sign Up | OpenReview</title>
      </Head>

      {registeredEmail ? (
        <ConfirmationMessage registeredEmail={registeredEmail} />
      ) : (
        <div className="col-sm-12 col-md-10 col-lg-8 col-md-offset-1 col-lg-offset-2">
          <h1>Sign Up for OpenReview</h1>
          <p className="text-muted">
            Enter your name and email as you would normally write it as the author of a paper.
          </p>

          <SignupForm setRegisteredEmail={setRegisteredEmail} />
        </div>
      )}
    </div>
  )
}

SignUp.bodyClass = 'sign-up'

export default SignUp
