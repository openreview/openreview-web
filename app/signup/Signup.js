'use client'

/* globals promptError,$ */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '../../lib/api-client'
import BasicModal from '../../components/BasicModal'
import { isInstitutionEmail, isValidEmail, isValidPassword } from '../../lib/utils'
import Icon from '../../components/Icon'
import useTurnstileToken from '../../hooks/useTurnstileToken'

const SignupForm = ({ setSignupConfirmation }) => {
  const [fullName, setFullName] = useState('')
  const [confirmFullName, setConfirmFullName] = useState(false)
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)

  const registerUser = async (email, password) => {
    let bodyData = {}
    bodyData = { email, password, fullname: fullName.trim(), token: turnstileToken }

    try {
      await api.post('/register', bodyData)
      setSignupConfirmation({
        type: 'register',
        registeredEmail: email,
      })
    } catch (apiError) {
      promptError(apiError.message, 8)
      setNameConfirmed(false)
    }
  }

  useEffect(() => {
    if (isComposing) return

    if (fullName.length === 1) setFullName(fullName.toUpperCase())

    if (fullName.trim().length < 1) {
      setConfirmFullName(false)
    }
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
              disabled={!fullName.length}
              onChange={() => {
                if (!fullName) {
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
          <hr className="spacer" />

          <NewProfileForm registerUser={registerUser} nameConfirmed={nameConfirmed} />

          <ConfirmNameModal
            fullName={fullName}
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

const NewProfileForm = ({ registerUser, nameConfirmed }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [institutionDomains, setInstitutionDomains] = useState([])
  const [nonInstitutionEmail, setNonInstitutionEmail] = useState(null)

  const InstitutionErrorMessage = () => (
    <span>
      It can take up to <strong>2 weeks</strong> for your profile to be activated. We encourage
      you to sign up with an email address from an educational or employing institution for
      faster processing.
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
    if (!email && passwordVisible) {
      setPasswordVisible(false)
    }
  }, [email, passwordVisible])

  useEffect(() => {
    if (nameConfirmed) {
      registerUser(email, password)
    }
  }, [nameConfirmed])

  useEffect(() => {
    getInstitutionDomains()
  }, [])

  return (
    <>
      <div className="new-profile-title">
        {passwordVisible
          ? 'Enter a password'
          : 'Enter an email address to be associated with your profile'}
      </div>
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
            <button type="submit" className="btn" disabled={!isValidEmail(email)}>
              Sign Up
            </button>
          )}
        </div>
        {nonInstitutionEmail && (
          <div className="activation-message-row">
            <div>
              <Icon name="warning-sign" extraClasses="email-tooltip" />
              <InstitutionErrorMessage />
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
              <button
                type="submit"
                className="btn"
                disabled={!isValidPassword(password, confirmPassword)}
              >
                Sign Up
              </button>
            </div>
          </>
        )}
      </form>
    </>
  )
}

const ConfirmNameModal = ({ fullName, onConfirm, setTurnstileToken }) => {
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
        You are registering with the name <strong>{fullName}</strong>.
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
