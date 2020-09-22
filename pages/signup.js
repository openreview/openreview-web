/* globals promptError: false */
/* globals $: false */

import {
  useState, useEffect, useCallback, useContext,
} from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import debounce from 'lodash/debounce'
import UserContext from '../components/UserContext'
import NoteList from '../components/NoteList'
import api from '../lib/api-client'
import { isValidEmail } from '../lib/utils'

// Page Styles
import '../styles/pages/signup.less'

const SignupForm = ({ setSignupConfirmation }) => {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [existingProfiles, setExistingProfiles] = useState([])

  const getNewUsername = useCallback(debounce(async (first, middle, last) => {
    try {
      const { username } = await api.get('/tildeusername', { first, middle, last })
      if (username) {
        setNewUsername(username)
      }
    } catch (apiError) {
      setNewUsername('')
      promptError(apiError.message)
    }
  }, 200), [])

  const getMatchingProfiles = useCallback(debounce(async (first, last) => {
    try {
      // Don't include middle name in profile search to find more results
      const { profiles } = await api.get('/profiles', { first, last, limit: 50 })
      if (profiles) {
        setExistingProfiles(profiles.map(profile => ({
          id: profile.id,
          emails: profile.content?.emailsConfirmed || [],
          active: profile.active,
          password: profile.password,
        })))
      }
    } catch (error) {
      setExistingProfiles([])
    }
  }, 300), [])

  const registerUser = async (registrationType, email, password, id) => {
    let bodyData = {}
    if (registrationType === 'new') {
      const name = { first: firstName.trim(), middle: middleName.trim(), last: lastName.trim() }
      bodyData = { email, password, name }
    } else if (registrationType === 'claim') {
      bodyData = { id, email, password }
    }

    try {
      const { content } = await api.post('/register', bodyData)
      setSignupConfirmation({
        type: 'register',
        registeredEmail: content?.preferredEmail || email,
      })
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const resetPassword = async (username, email) => {
    try {
      const { id: registeredEmail } = await api.post('/resettable', { id: email })
      setSignupConfirmation({ type: 'reset', registeredEmail: registeredEmail || email })
    } catch (apiError) {
      if (apiError.message === 'User not found') {
        promptError(`The given email does not match the email on record for ${username}`)
      } else {
        promptError(apiError.message)
      }
    }
  }

  const sendActivationLink = async (email) => {
    try {
      const { id: registeredEmail } = await api.post('/activatable', { id: email })
      setSignupConfirmation({ type: 'activate', registeredEmail: registeredEmail || email })
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const populateFeedbackForm = () => {
    $('#feedback-modal [name="subject"]').val('Merge Profiles')
    $('#feedback-modal [name="message"]').val('Hi OpenReview,\n\nBelow are my profile e-mail addresses:\n<replace-me>@<some-domain.com>\n<replace-me>@<some-domain.com>\n\nThanks.')
  }

  useEffect(() => {
    if (firstName.trim().length < 1 || lastName.trim().length < 1) {
      setNewUsername('')
      return
    }
    getNewUsername(firstName, middleName, lastName)
  }, [firstName, middleName, lastName])

  useEffect(() => {
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setExistingProfiles([])
      return
    }
    getMatchingProfiles(firstName, lastName)
  }, [firstName, lastName])

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
              onChange={e => setFirstName(e.target.value.length === 1 ? e.target.value.toUpperCase() : e.target.value)}
              placeholder="First name"
              autoComplete="given-name"
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
              onChange={e => setMiddleName(e.target.value.length === 1 ? e.target.value.toUpperCase() : e.target.value)}
              placeholder="Middle name"
              autoComplete="additional-name"
            />
          </div>

          <div className="form-group col-xs-12 col-sm-4">
            <label htmlFor="last-input">Last</label>
            <input
              type="text"
              id="last-input"
              className="form-control"
              value={lastName}
              onChange={e => setLastName(e.target.value.length === 1 ? e.target.value.toUpperCase() : e.target.value)}
              placeholder="Last name"
              autoComplete="family-name"
            />
          </div>
        </div>
      </form>

      <hr className="spacer" />

      {existingProfiles.map((profile) => {
        let formComponents
        if (profile.emails.length > 0) {
          formComponents = profile.emails.map(confirmedEmail => (
            <ExistingProfileForm
              key={confirmedEmail}
              id={profile.id}
              obfuscatedEmail={confirmedEmail}
              hasPassword={profile.password}
              isActive={profile.active}
              registerUser={registerUser}
              resetPassword={resetPassword}
              sendActivationLink={sendActivationLink}
            />
          ))
        } else {
          formComponents = [
            <ClaimProfileForm key={profile.id} id={profile.id} registerUser={registerUser} />,
          ]
        }
        return formComponents.concat(<hr key={`${profile.id}-spacer`} className="spacer" />)
      })}

      <NewProfileForm id={newUsername} registerUser={registerUser} />

      {existingProfiles.length > 0 && (
        <p className="merge-message hint">
          If two or more of the profiles above belong to you, please
          {' '}
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a href="#" data-toggle="modal" data-target="#feedback-modal" onClick={populateFeedbackForm}>contact us</a>
          {' '}
          and we will assist you in merging your profiles.
        </p>
      )}
    </div>
  )
}

const ExistingProfileForm = ({
  id, obfuscatedEmail, hasPassword, isActive, registerUser, resetPassword, sendActivationLink,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)

  let buttonLabel
  let usernameLabel
  if (hasPassword) {
    buttonLabel = isActive ? 'Reset Password' : 'Send Activation Link'
    usernameLabel = 'for'
  } else {
    buttonLabel = 'Sign Up'
    usernameLabel = 'as'
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!passwordVisible) {
      setPasswordVisible(true)
      return
    }

    if (hasPassword && isActive) {
      resetPassword(id, email)
    } else if (hasPassword && !isActive) {
      sendActivationLink(email)
    } else {
      registerUser('claim', email, password, id)
    }
  }

  return (
    <form className="form-inline" onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          className="form-control"
          value={obfuscatedEmail}
          readOnly
        />
        {!passwordVisible && (
          <button type="submit" className="btn">{buttonLabel}</button>
        )}
        <span className="new-username hint">{`${usernameLabel} ${id}`}</span>
      </div>
      {passwordVisible && (
        <div className="password-row">
          <input
            type="email"
            className="form-control"
            placeholder={`Full email for ${obfuscatedEmail}`}
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          {hasPassword && <button type="submit" className="btn" disabled={!isValidEmail(email)}>{buttonLabel}</button>}
        </div>
      )}
      {passwordVisible && !hasPassword && (
        <div className="password-row">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn" disabled={!isValidEmail(email) || !password}>{buttonLabel}</button>
        </div>
      )}
    </form>
  )
}

const ClaimProfileForm = ({ id, registerUser }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [recentPublications, setRecentPublications] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!passwordVisible) {
      setPasswordVisible(true)
      return
    }

    registerUser('claim', email, password, id)
  }

  const loadRecentPublications = async () => {
    try {
      const { notes } = await api.get('/notes', {
        'content.authorids': id, sort: 'cdate:desc', limit: 3,
      })
      setRecentPublications(notes || [])
    } catch (error) {
      setRecentPublications([])
    }
  }

  useEffect(() => {
    loadRecentPublications()
  }, [])

  useEffect(() => {
    if (!email && passwordVisible) {
      setPasswordVisible(false)
    }
  }, [email, passwordVisible])

  return (
    <form className="form-inline" onSubmit={handleSubmit}>
      {recentPublications && (
        <NoteList notes={recentPublications} displayOptions={{ pdfLink: true, htmlLink: true }} />
      )}

      <div>
        <input
          type="email"
          className="form-control"
          placeholder="Your email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {!passwordVisible && (
          <button type="submit" className="btn" disabled={!isValidEmail(email)}>Claim Profile</button>
        )}
        <span className="new-username hint">{`for ${id}`}</span>
      </div>

      {passwordVisible && (
        <div className="password-row">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button type="submit" className="btn" disabled={!password}>Claim Profile</button>
        </div>
      )}
    </form>
  )
}

const NewProfileForm = ({ id, registerUser }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!passwordVisible) {
      setPasswordVisible(true)
      return
    }

    registerUser('new', email, password)
  }

  useEffect(() => {
    if ((!id || !email) && passwordVisible) {
      setPasswordVisible(false)
    }
  }, [id, email, passwordVisible])

  return (
    <form className="form-inline" onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          className="form-control"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value.trim())}
          autoComplete="email"
        />
        {!passwordVisible && (
          <button type="submit" className="btn" disabled={!id || !isValidEmail(email)}>Sign Up</button>
        )}
        {id && (
          <span className="new-username hint">{`as ${id}`}</span>
        )}
      </div>
      {passwordVisible && (
        <div className="password-row">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button type="submit" className="btn" disabled={!password}>Sign Up</button>
        </div>
      )}
    </form>
  )
}

const ConfirmationMessage = ({ registrationType, registeredEmail }) => {
  if (registrationType === 'reset') {
    return (
      <div className="confirm-message col-sm-12 col-md-10 col-lg-8 col-md-offset-1 col-lg-offset-2">
        <h1>Password Reset in Progress</h1>
        <p>
          An email with the subject &quot;OpenReview Password Reset&quot; has been sent to
          {'  '}
          <span className="email">{registeredEmail}</span>
          . Please follow the link in this email to reset your password.
        </p>
      </div>
    )
  }

  return (
    <div className="confirm-message col-sm-12 col-md-10 col-lg-8 col-md-offset-1 col-lg-offset-2">
      <h1>Thank You for Signing Up</h1>
      <p>
        An email with the subject &quot;OpenReview signup confirmation&quot; has been
        sent to your email
        {' '}
        <span className="email">{registeredEmail}</span>
        . Please click the link in this email and follow the instructions to confirm
        your email address and complete registration.
      </p>
      <p>
        <strong>
          To ensure that you receive all emails from OpenReview, please add noreply@openreview.net
          to your contacts list.
        </strong>
        {' '}
        In some rare cases email providers may delay delivery for up to 8 hours. If you have
        not received the confirmation email by then, please contact us.
      </p>
    </div>
  )
}

const SignUp = () => {
  const [signupConfirmation, setSignupConfirmation] = useState(null)
  const { user, userLoading } = useContext(UserContext)
  const router = useRouter()

  // Redirect user to the homepage if not logged in
  useEffect(() => {
    if (!userLoading && user) {
      router.replace('/')
    }
  }, [userLoading, user])

  return (
    <div className="row">
      <Head>
        <title key="title">Sign Up | OpenReview</title>
      </Head>

      {signupConfirmation ? (
        <ConfirmationMessage
          registrationType={signupConfirmation.type}
          registeredEmail={signupConfirmation.registeredEmail}
        />
      ) : (
        <div className="col-sm-12 col-md-10 col-lg-8 col-md-offset-1 col-lg-offset-2">
          <h1>Sign Up for OpenReview</h1>
          <p className="text-muted">
            Enter your name as you would normally write it as the author of a paper.
          </p>

          <SignupForm setSignupConfirmation={setSignupConfirmation} />
        </div>
      )}
    </div>
  )
}

SignUp.bodyClass = 'sign-up'

export default SignUp
