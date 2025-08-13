'use client'

/* globals promptError,clearMessage */
import { debounce } from 'lodash'
import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '../../lib/api-client'
import NoteList from '../../components/NoteList'
import BasicModal from '../../components/BasicModal'
import { isInstitutionEmail, isValidEmail, isValidPassword } from '../../lib/utils'
import Icon from '../../components/Icon'
import useTurnstileToken from '../../hooks/useTurnstileToken'

const LoadingContext = createContext()

const SignupForm = ({ setSignupConfirmation }) => {
  const [fullName, setFullName] = useState('')
  const [confirmFullName, setConfirmFullName] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [existingProfiles, setExistingProfiles] = useState([])
  const [isComposing, setIsComposing] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)

  const getNewUsername = useCallback(
    debounce(async (name) => {
      try {
        const { username } = await api.get('/tildeusername', { fullname: name })
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
    debounce(async (name) => {
      try {
        const { profiles } = await api.get('/profiles/search', {
          fullname: name,
          limit: 100,
          es: true,
        })
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
      bodyData = { email, password, fullname: fullName.trim(), token: turnstileToken }
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

  const resetPassword = async (username, email, token) => {
    setLoading(true)

    try {
      const { id: registeredEmail } = await api.post('/resettable', { id: email, token })
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

    if (fullName.length === 1) setFullName(fullName.toUpperCase())

    if (fullName.trim().length < 1) {
      setNewUsername('')
      return
    }

    getNewUsername(fullName)
  }, [fullName, isComposing])

  useEffect(() => {
    if (isComposing) return

    if (fullName.trim().length < 2) {
      setExistingProfiles([])
      return
    }

    getMatchingProfiles(fullName)
  }, [fullName, isComposing])

  return (
    <div className="signup-form-container">
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="row">
          <div className="form-group col-xs-12">
            <label htmlFor="first-input" className="mb-2">
              Enter your full name as you would write it as the author of a paper
            </label>
            <input
              type="text"
              id="first-input"
              className="form-control"
              value={fullName}
              onInput={(e) => setIsComposing(e.nativeEvent.isComposing)}
              onCompositionEnd={() => setIsComposing(false)}
              onChange={(e) => {
                clearMessage()
                setFullName(e.target.value)
              }}
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
        </div>
        <div className=" checkbox">
          <label className="name-confirmation">
            <input
              type="checkbox"
              checked={confirmFullName}
              onChange={() => {
                if (!newUsername) {
                  setConfirmFullName(false)
                  return
                }
                setConfirmFullName((confirmFullNameProp) => !confirmFullNameProp)
              }}
            />
            I confirm that this name is typed exactly as it would appear as an author in my
            publications. I understand that any future changes to my name will require
            moderation by the OpenReview.net Staff, and may require two weeks processing time.
          </label>
        </div>
      </form>

      {confirmFullName && (
        <>
          {existingProfiles.length > 0 && (
            <div className="existing-profiles-title">
              We found the following profiles with the name {fullName}
            </div>
          )}
          <hr className="spacer" />
          <LoadingContext.Provider value={loading}>
            {existingProfiles.map((profile, index) => {
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
              return formComponents.concat(
                <hr key={`${profile.id}-spacer`} className="spacer" />
              )
            })}

            <div className="new-profile-title">
              Create a new profile{' '}
              {existingProfiles.length > 0
                ? 'if none of the profiles above belong to you'
                : ''}
            </div>

            <NewProfileForm
              id={newUsername}
              registerUser={registerUser}
              nameConfirmed={nameConfirmed}
            />
          </LoadingContext.Provider>

          <ConfirmNameModal
            fullName={fullName}
            newUsername={newUsername}
            onConfirm={() => {
              setNameConfirmed(true)
              $('#confirm-name-modal').modal('hide')
            }}
            setTurnstileToken={setTurnstileToken}
          />
        </>
      )}
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
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken(
    'reset',
    passwordVisible && isValidEmail(email)
  )

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
      resetPassword(id, email, turnstileToken)
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
              {usernameLabel} <Link href={`/profile?id=${id}`}>{id}</Link>
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
                {usernameLabel} <Link href={`/profile?id=${id}`}>{id}</Link>
              </span>
              {isActive && <div className="mt-1" ref={turnstileContainerRef} />}
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
              {usernameLabel} <Link href={`/profile?id=${id}`}>{id}</Link>
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
              for <Link href={`/profile?id=${id}`}>{id}</Link>
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
                for <Link href={`/profile?id=${id}`}>{id}</Link>
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
              for <Link href={`/profile?id=${id}`}>{id}</Link>
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
  const [institutionDomains, setInstitutionDomains] = useState([])
  const [nonInstitutionEmail, setNonInstitutionEmail] = useState(null)
  const router = useRouter()

  const storeFeedbackInfo = (e) => {
    e.preventDefault()
    sessionStorage.setItem('feedbackInstitution', email)
    router.push('/contact')
  }

  const InstitutionErrorMessage = ({ email: invalidEmail }) => (
    <span>
      <strong>{invalidEmail.split('@').pop()}</strong> does not appear in our list of
      publishing institutions. It can take up to <strong>2 weeks</strong> for profiles using
      public email services to be activated. To activate immediately, please sign up with an
      email address that uses an educational or employing institution domain. If your
      institution is not yet in our list,{' '}
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <Link href="#" onClick={storeFeedbackInfo}>
        contact us
      </Link>{' '}
      to request that it be added.
    </span>
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isInstitutionEmail(email, institutionDomains)) {
      setNonInstitutionEmail(email)
    }

    if (!passwordVisible) {
      setPasswordVisible(true)
      return
    }

    $('#confirm-name-modal').modal({ show: true, backdrop: 'static' })
  }

  const getInstitutionDomains = async () => {
    try {
      const domains = await api.get('/settings/institutionDomains')
      setInstitutionDomains(domains)
    } catch (error) {
      setInstitutionDomains([])
    }
  }

  useEffect(() => {
    if (passwordVisible) {
      $('[data-toggle="tooltip"]').tooltip({ html: true })
    }
    if ((!id || !email) && passwordVisible) {
      setPasswordVisible(false)
    }
  }, [id, email, passwordVisible])

  useEffect(() => {
    if (nameConfirmed) {
      registerUser('new', email, password)
    }
  }, [nameConfirmed])

  useEffect(() => {
    getInstitutionDomains()
  }, [])

  return (
    <form className="form-inline" onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          className="form-control"
          placeholder="Email address"
          value={email}
          maxLength={254}
          onChange={(e) => {
            const cleanEmail = e.target.value.trim()
            setEmail(cleanEmail)
            if (!cleanEmail) setNonInstitutionEmail(null)
          }}
          onBlur={(e) => {
            const cleanEmail = e.target.value.trim()
            if (cleanEmail && !isInstitutionEmail(cleanEmail, institutionDomains)) {
              setNonInstitutionEmail(cleanEmail)
            }
            if (!cleanEmail || isInstitutionEmail(cleanEmail, institutionDomains))
              setNonInstitutionEmail(null)
          }}
          autoComplete="email"
        />
        {!passwordVisible && (
          <button type="submit" className="btn" disabled={!id || !isValidEmail(email)}>
            Sign Up
          </button>
        )}
        {!passwordVisible && id && <span className="new-username hint">{`as ${id}`}</span>}
      </div>
      {nonInstitutionEmail && (
        <div className="activation-message-row">
          <div>
            <Icon name="warning-sign" extraClasses="email-tooltip" />
            <InstitutionErrorMessage email={nonInstitutionEmail} />
          </div>
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
              minLength={10}
              maxLength={64}
              required
            />
            <Icon
              name="info-sign"
              extraClasses="password-tooltip"
              tooltip="Password must be between 10 and 64 characters long and contain at least one
              uppercase letter, one lowercase letter and one digit."
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

const ConfirmNameModal = ({ fullName, newUsername, onConfirm, setTurnstileToken }) => {
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken('registration', isOpen)

  useEffect(() => {
    setTurnstileToken(turnstileToken)
  }, [turnstileToken])

  return (
    <BasicModal
      id="confirm-name-modal"
      title="Confirm Full Name"
      primaryButtonText="Register"
      onPrimaryButtonClick={() => {
        setIsOpen(false)
        onConfirm()
      }}
      primaryButtonDisabled={!agreeTerms || !turnstileToken}
      onClose={() => {
        setAgreeTerms(false)
        setIsOpen(false)
      }}
      onOpen={() => setIsOpen(true)}
    >
      <p className="mb-3">
        You are registering with the name <strong>{fullName}</strong>. On your OpenReview
        profile your username will be <strong>{newUsername}</strong>.
      </p>
      <div className="checkbox mb-3">
        <label>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={() => setAgreeTerms((value) => !value)}
          />{' '}
          I confirm my name is correct
        </label>
      </div>
      <div className="mt-3 mb-2 text-center" ref={turnstileContainerRef}></div>
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

export default function Signup() {
  const [signupConfirmation, setSignupConfirmation] = useState(null)

  if (signupConfirmation)
    return (
      <ConfirmationMessage
        registrationType={signupConfirmation.type}
        registeredEmail={signupConfirmation.registeredEmail}
      />
    )
  return (
    <div className="col-sm-12 col-md-10 col-lg-8 col-md-offset-1 col-lg-offset-2">
      <h1>Sign Up for OpenReview</h1>
      <SignupForm setSignupConfirmation={setSignupConfirmation} />
    </div>
  )
}
