/* globals promptError,$,clearMessage: false */

import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import debounce from 'lodash/debounce'
import UserContext from '../components/UserContext'
import NoteList from '../components/NoteList'
import BasicModal from '../components/BasicModal'
import api from '../lib/api-client'
import { isValidEmail, isValidPassword } from '../lib/utils'
import ProfileMergeModal from '../components/ProfileMergeModal'

const LoadingContext = createContext()

const SignupForm = ({ setSignupConfirmation }) => {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [existingProfiles, setExistingProfiles] = useState([])
  const [isComposing, setIsComposing] = useState(false)

  const getNewUsername = useCallback(
    debounce(async (first, middle, last) => {
      try {
        const { username } = await api.get('/tildeusername', { first, middle, last })
        if (username) {
          setNewUsername(username)
        }
      } catch (apiError) {
        setNewUsername('')
        promptError(apiError.message)
      }
    }, 500),
    []
  )

  const getMatchingProfiles = useCallback(
    debounce(async (first, last) => {
      try {
        // Don't include middle name in profile search to find more results
        const { profiles } = await api.get('/profiles', { first, last, limit: 100 })
        if (profiles) {
          setExistingProfiles(
            profiles.map((profile) => ({
              id: profile.id,
              emails: profile.content?.emails || [],
              emailsConfirmed: profile.content?.emailsConfirmed || [],
              active: profile.active,
              password: profile.password,
            }))
          )
        }
      } catch (error) {
        setExistingProfiles([])
      }
    }, 300),
    []
  )

  const registerUser = async (registrationType, email, password, id) => {
    setLoading(true)

    let bodyData = {}
    if (registrationType === 'new') {
      const name = {
        first: firstName.trim(),
        middle: middleName.trim(),
        last: lastName.trim(),
      }
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
      setNameConfirmed(false)
    }
    setLoading(false)
  }

  const resetPassword = async (username, email) => {
    setLoading(true)

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
    setLoading(false)
  }

  const sendActivationLink = async (email) => {
    setLoading(true)

    try {
      const { id: registeredEmail } = await api.post('/activatable', { id: email })
      setSignupConfirmation({ type: 'activate', registeredEmail: registeredEmail || email })
    } catch (apiError) {
      promptError(apiError.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isComposing) return

    if (firstName.length === 1) setFirstName(firstName.toUpperCase())
    if (middleName.length === 1) setMiddleName(middleName.toUpperCase())
    if (lastName.length === 1) setLastName(lastName.toUpperCase())

    if (firstName.trim().length < 1) {
      setNewUsername('')
      return
    }

    getNewUsername(firstName, middleName, lastName)
  }, [firstName, middleName, lastName, isComposing])

  useEffect(() => {
    if (isComposing) return

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setExistingProfiles([])
      return
    }

    getMatchingProfiles(firstName, lastName)
  }, [firstName, lastName, isComposing])

  return (
    <div className="signup-form-container">
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="row">
          <div className="form-group col-xs-12 col-sm-4">
            <label htmlFor="first-input">First</label>
            <input
              type="text"
              id="first-input"
              className="form-control"
              value={firstName}
              onInput={(e) => setIsComposing(e.nativeEvent.isComposing)}
              onCompositionEnd={() => setIsComposing(false)}
              onChange={(e) => {
                clearMessage()
                setFirstName(e.target.value)
              }}
              placeholder="First name"
              autoComplete="given-name"
            />
          </div>

          <div className="form-group col-xs-12 col-sm-4">
            <label htmlFor="middle-input">
              Middle <span className="hint">(optional)</span>
            </label>
            <input
              type="text"
              id="middle-input"
              className="form-control"
              value={middleName}
              onInput={(e) => setIsComposing(e.nativeEvent.isComposing)}
              onCompositionEnd={() => setIsComposing(false)}
              onChange={(e) => {
                clearMessage()
                setMiddleName(e.target.value)
              }}
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
              onInput={(e) => setIsComposing(e.nativeEvent.isComposing)}
              onCompositionEnd={() => setIsComposing(false)}
              onChange={(e) => {
                clearMessage()
                setLastName(e.target.value)
              }}
              placeholder="Last name"
              autoComplete="family-name"
            />
          </div>
        </div>
      </form>

      <hr className="spacer" />

      <LoadingContext.Provider value={loading}>
        {existingProfiles.map((profile) => {
          let formComponents
          const allEmails = profile.active
            ? profile.emailsConfirmed
            : [...profile.emailsConfirmed, ...profile.emails]

          if (allEmails.length > 0) {
            formComponents = Array.from(new Set(allEmails)).map((email) => (
              <ExistingProfileForm
                key={`${profile.id} ${email}`}
                id={profile.id}
                obfuscatedEmail={email}
                hasPassword={profile.password}
                isActive={profile.active}
                registerUser={registerUser}
                resetPassword={resetPassword}
                sendActivationLink={sendActivationLink}
              />
            ))
          } else {
            formComponents = [
              <ClaimProfileForm
                key={profile.id}
                id={profile.id}
                registerUser={registerUser}
              />,
            ]
          }
          return formComponents.concat(<hr key={`${profile.id}-spacer`} className="spacer" />)
        })}

        <NewProfileForm
          id={newUsername}
          registerUser={registerUser}
          nameConfirmed={nameConfirmed}
        />
      </LoadingContext.Provider>

      {existingProfiles.length > 0 && (
        <p className="merge-message hint">
          If two or more of the profiles above belong to you, please{' '}
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a href="#" data-toggle="modal" data-target="#profilemerge-modal">
            contact us
          </a>{' '}
          and we will assist you in merging your profiles.
        </p>
      )}

      <ConfirmNameModal
        firstName={firstName}
        middleName={middleName}
        lastName={lastName}
        newUsername={newUsername}
        onConfirm={() => {
          $('#confirm-name-modal').modal('hide')
          setNameConfirmed(true)
        }}
      />

      <ProfileMergeModal />
    </div>
  )
}

const ExistingProfileForm = ({
  id,
  obfuscatedEmail,
  hasPassword,
  isActive,
  registerUser,
  resetPassword,
  sendActivationLink,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)

  let buttonLabel
  let usernameLabel
  if (hasPassword) {
    buttonLabel = isActive ? 'Reset Password' : 'Send Activation Link'
    usernameLabel = 'for'
  } else {
    buttonLabel = 'Claim Profile'
    usernameLabel = 'for'
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
          maxLength={254}
          readOnly
        />
        {!passwordVisible && (
          <>
            <button type="submit" className="btn">
              {buttonLabel}
            </button>
            <span className="new-username hint">
              {usernameLabel}{' '}
              <Link href={`/profile?id=${id}`}>
                <a>{id}</a>
              </Link>
            </span>
          </>
        )}
      </div>
      {passwordVisible && (
        <div className="email-row">
          <input
            type="email"
            className="form-control"
            placeholder={`Full email for ${obfuscatedEmail}`}
            value={email}
            maxLength={254}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {hasPassword && (
            <>
              <SubmitButton disabled={!isValidEmail(email)}>{buttonLabel}</SubmitButton>
              <span className="new-username hint">
                {usernameLabel}{' '}
                <Link href={`/profile?id=${id}`}>
                  <a>{id}</a>
                </Link>
              </span>
            </>
          )}
        </div>
      )}
      {passwordVisible && !hasPassword && (
        <>
          <div className="password-row">
            <input
              type="password"
              className="form-control"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="claim-button-row">
            <input
              type="password"
              className="form-control"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <SubmitButton
              disabled={!isValidEmail(email) || !isValidPassword(password, confirmPassword)}
            >
              {buttonLabel}
            </SubmitButton>
            <span className="new-username hint">
              {usernameLabel}{' '}
              <Link href={`/profile?id=${id}`}>
                <a>{id}</a>
              </Link>
            </span>
          </div>
        </>
      )}
    </form>
  )
}

const ClaimProfileForm = ({ id, registerUser }) => {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailVisible, setEmailVisible] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [recentPublications, setRecentPublications] = useState(null)

  const validateFullName = () => {
    // Compare the first and last words of the id and full name entered by the user
    const idWords = id.toLowerCase().replace(/[\d~]/g, '').split('_')
    const nameWords = fullName.toLowerCase().split(' ')
    return `${nameWords[0]} ${nameWords.pop()}` === `${idWords[0]} ${idWords.pop()}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!emailVisible) {
      if (!validateFullName()) {
        promptError('Your name must match the name of the profile you are claiming', {
          scrollToTop: false,
        })
        return
      }
      setEmailVisible(true)
      return
    }

    if (!passwordVisible) {
      setPasswordVisible(true)
      return
    }

    registerUser('claim', email, password, id)
  }

  const loadRecentPublications = async () => {
    try {
      const { notes } = await api.get('/notes', {
        'content.authorids': id,
        sort: 'cdate:desc',
        limit: 3,
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
        <NoteList
          notes={recentPublications}
          displayOptions={{ pdfLink: true, htmlLink: true }}
        />
      )}

      <div>
        <input
          type="text"
          className="form-control"
          placeholder="Your full name"
          value={fullName}
          maxLength={254}
          onChange={(e) => setFullName(e.target.value)}
        />
        {!emailVisible && (
          <>
            <button type="submit" className="btn" disabled={!fullName}>
              Claim Profile
            </button>
            <span className="new-username hint">
              for{' '}
              <Link href={`/profile?id=${id}`}>
                <a>{id}</a>
              </Link>
            </span>
          </>
        )}
      </div>

      {emailVisible && (
        <div className="pt-2">
          <input
            type="email"
            className="form-control"
            placeholder="Your email address"
            value={email}
            maxLength={254}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!passwordVisible && (
            <>
              <button type="submit" className="btn" disabled={!isValidEmail(email)}>
                Claim Profile
              </button>
              <span className="new-username hint">
                for{' '}
                <Link href={`/profile?id=${id}`}>
                  <a>{id}</a>
                </Link>
              </span>
            </>
          )}
        </div>
      )}

      {passwordVisible && (
        <>
          <div className="password-row">
            <input
              type="password"
              className="form-control"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="claim-button-row">
            <input
              type="password"
              className="form-control"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <SubmitButton disabled={!isValidPassword(password, confirmPassword)}>
              Claim Profile
            </SubmitButton>
            <span className="new-username hint">
              for{' '}
              <Link href={`/profile?id=${id}`}>
                <a>{id}</a>
              </Link>
            </span>
          </div>
        </>
      )}
    </form>
  )
}

const NewProfileForm = ({ id, registerUser, nameConfirmed }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!passwordVisible) {
      setPasswordVisible(true)
      return
    }

    $('#confirm-name-modal').modal({ show: true, backdrop: 'static' })
  }

  useEffect(() => {
    if ((!id || !email) && passwordVisible) {
      setPasswordVisible(false)
    }
  }, [id, email, passwordVisible])

  useEffect(() => {
    if (nameConfirmed) {
      registerUser('new', email, password)
    }
  }, [nameConfirmed])

  return (
    <form className="form-inline" onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          className="form-control"
          placeholder="Email address"
          value={email}
          maxLength={254}
          onChange={(e) => setEmail(e.target.value.trim())}
          autoComplete="email"
        />
        {!passwordVisible && (
          <button type="submit" className="btn" disabled={!id || !isValidEmail(email)}>
            Sign Up
          </button>
        )}
        {!passwordVisible && id && <span className="new-username hint">{`as ${id}`}</span>}
      </div>
      {passwordVisible && (
        <>
          <div className="password-row">
            <input
              type="password"
              className="form-control"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="claim-button-row">
            <input
              type="password"
              className="form-control"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <SubmitButton disabled={!isValidPassword(password, confirmPassword)}>
              Sign Up
            </SubmitButton>
            {id && <span className="new-username hint">{`as ${id}`}</span>}
          </div>
        </>
      )}
    </form>
  )
}

const SubmitButton = ({ disabled, children }) => {
  const loading = useContext(LoadingContext)

  return (
    <button type="submit" className="btn" disabled={disabled || loading}>
      {children}{' '}
      {loading && (
        <div className="spinner-small">
          <div className="rect1" />
          <div className="rect2" />
          <div className="rect3" />
          <div className="rect4" />
        </div>
      )}
    </button>
  )
}

const ConfirmNameModal = ({ firstName, middleName, lastName, newUsername, onConfirm }) => {
  const [agreeTerms, setAgreeTerms] = useState(false)
  return (
    <BasicModal
      id="confirm-name-modal"
      title="Confirm Full Name"
      primaryButtonText="Register"
      onPrimaryButtonClick={onConfirm}
      primaryButtonDisabled={!agreeTerms}
      onClose={() => setAgreeTerms(false)}
    >
      <p className="mb-3">
        You are registering with the first name <strong>{firstName}</strong>
        {middleName && (
          <>
            {', '}
            middle name <strong>{middleName}</strong>
            {','}
          </>
        )}
        {lastName && (
          <>
            {' and '}
            last name <strong>{lastName}</strong>
          </>
        )}
        {'. '}
        On your OpenReview profile your name will appear as{' '}
        <strong>{`${firstName} ${lastName}`}</strong> and your username will be{' '}
        <strong>{newUsername}</strong>.
      </p>
      <div className="checkbox">
        <label>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={() => setAgreeTerms((value) => !value)}
          />{' '}
          I confirm my name is correct.
        </label>
      </div>
    </BasicModal>
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
          <span className="email">{registeredEmail}</span>. Please follow the link in this
          email to reset your password.
        </p>
      </div>
    )
  }

  return (
    <div className="confirm-message col-sm-12 col-md-10 col-lg-8 col-md-offset-1 col-lg-offset-2">
      <h1>Thank You for Signing Up</h1>
      <p>
        An email with the subject &quot;OpenReview signup confirmation&quot; has been sent to
        your email <span className="email">{registeredEmail}</span>. Please click the link in
        this email and follow the instructions to confirm your email address and complete
        registration.
      </p>
      <p>
        <strong>
          To ensure that you receive all emails from OpenReview, please add
          noreply@openreview.net to your contacts list.
        </strong>{' '}
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
