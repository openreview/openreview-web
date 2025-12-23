'use client'

/* globals promptError,$ */
import { useState, useEffect, useReducer } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '../../lib/api-client'
import BasicModal from '../../components/BasicModal'
import { isInstitutionEmail, isValidEmail, isValidPassword } from '../../lib/utils'
import Icon from '../../components/Icon'
import useTurnstileToken from '../../hooks/useTurnstileToken'

import styles from './Signup.module.scss'

const ConfirmNameModal = ({ fullName, email, registerUser }) => {
  const [donationAcknowledgement, setDonationAcknowledgement] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken('registration', isOpen)

  return (
    <BasicModal
      id="confirm-name-modal"
      title="Confirm Registration"
      primaryButtonText="Register"
      onPrimaryButtonClick={() => {
        setIsOpen(false)
        $('#confirm-name-modal').modal('hide')
        registerUser(turnstileToken, donationAcknowledgement)
      }}
      primaryButtonDisabled={!turnstileToken}
      onClose={() => {
        setDonationAcknowledgement(false)
        setIsOpen(false)
      }}
      onOpen={() => setIsOpen(true)}
    >
      <p className="mb-3">
        You are registering with the name <strong>{fullName}</strong>.
      </p>
      <div className={styles.donationContainer}>
        <p className="mb-2">
          <strong>Support OpenReview</strong>
        </p>
        <p className="mb-2">
          OpenReview is a non-profit organization that relies on community support. Your
          donation helps us process your registration faster.{' '}
        </p>
        <p>
          <a href="/donate" target="_blank" rel="noopener noreferrer">
            Consider making a donation
          </a>
        </p>
        <div className="mb-0">
          <label>
            <input
              type="checkbox"
              checked={donationAcknowledgement}
              onChange={() => setDonationAcknowledgement((value) => !value)}
            />{' '}
            I made a donation using the email {email}
          </label>
        </div>
      </div>
      <div className="mt-3 mb-2 text-center" ref={turnstileContainerRef}></div>
    </BasicModal>
  )
}

const ConfirmationMessage = ({ email, donationAcknowledgement }) => (
  <div className={styles.successMessage}>
    <h1>Thank You for Signing Up</h1>
    {donationAcknowledgement && (
      <p className={styles.donationThanks}>
        <strong>Thank you for your donation!</strong> Your support helps us keep OpenReview
        running.
      </p>
    )}
    <p>
      An email with the subject &quot;OpenReview signup confirmation&quot; has been sent to
      your email <span className={styles.successEmail}>{email}</span>. Please click the link in
      this email and follow the instructions to confirm your email address and complete
      registration.
    </p>
    <p>
      <strong>
        To ensure that you receive all emails from OpenReview, please add
        noreply@openreview.net to your contacts list.
      </strong>{' '}
      In some rare cases email providers may delay delivery for up to 8 hours. If you have not
      received the confirmation email by then, please contact us.
    </p>
  </div>
)

const InstitutionErrorMessage = ({ email }) => {
  const router = useRouter()
  const storeFeedbackInfo = (e) => {
    e.preventDefault()
    sessionStorage.setItem('feedbackInstitution', email)
    router.push('/contact')
  }
  return (
    <span>
      <strong>{email.split('@').pop()}</strong> does not appear in our list of publishing
      institutions. It can take up to <strong>2 weeks</strong> for profiles using public email
      services to be activated. To activate immediately, please sign up with an email address
      that uses an educational or employing institution domain. If your institution is not yet
      in our list, {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <Link href="#" onClick={storeFeedbackInfo}>
        contact us
      </Link>{' '}
      to request that it be added.
    </span>
  )
}

const initialRegistrationInfo = {
  fullName: '',
  confirmFullName: false,
  email: '',
  emailEntered: false,
  isNonInstitutionEmail: false,
  password: '',
  repeatPassword: '',
  donationAcknowledgement: false,
}

const registrationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FULL_NAME': {
      const shouldUppercaseFirstLetter = state.fullName.length === 0
      const cleanFullName = action.payload.fullName.trim()
      return {
        ...state,
        fullName: shouldUppercaseFirstLetter
          ? action.payload.fullName.charAt(0).toUpperCase() + action.payload.fullName.slice(1)
          : action.payload.fullName,
        confirmFullName: cleanFullName.length === 0 ? false : state.confirmFullName,
      }
    }
    case 'SET_CONFIRM_FULL_NAME':
      if (action.payload.confirmFullName === false) return initialRegistrationInfo
      return {
        ...state,
        confirmFullName: action.payload.confirmFullName,
      }
    case 'SET_EMAIL': {
      return {
        ...state,
        email: action.payload.email,
        isNonInstitutionEmail: false,
      }
    }
    case 'EMAIL_ENTERED':
      return {
        ...state,
        emailEntered: true,
        isNonInstitutionEmail: !isInstitutionEmail(
          state.email,
          action.payload.institutionDomains
        ),
      }
    case 'SET_IS_NON_INSTITUTION_EMAIL':
      return {
        ...state,
        isNonInstitutionEmail: action.payload.isNonInstitutionEmail,
      }
    case 'SET_PASSWORD':
      return {
        ...state,
        password: action.payload.password,
      }
    case 'SET_REPEAT_PASSWORD':
      return {
        ...state,
        repeatPassword: action.payload.repeatPassword,
      }
    default:
      return state
  }
}

export default function Signup() {
  const [signupConfirmation, setSignupConfirmation] = useState(null)
  const [institutionDomains, setInstitutionDomains] = useState([])
  const [registrationInfo, setRegistrationInfo] = useReducer(
    registrationReducer,
    initialRegistrationInfo
  )

  const registerUser = async (turnstileToken, donationAcknowledgement) => {
    let bodyData = {}
    bodyData = {
      email: registrationInfo.email,
      password: registrationInfo.password,
      fullname: registrationInfo.fullName,
      token: turnstileToken,
    }

    try {
      await api.post('/register', bodyData)
      setSignupConfirmation({
        registeredEmail: registrationInfo.email,
        donationAcknowledgement,
      })
    } catch (apiError) {
      promptError(apiError.message, 8)
    }
  }

  const getInstitutionDomains = async () => {
    try {
      const domains = await api.get('/settings/institutionDomains')
      setInstitutionDomains(domains)
      setRegistrationInfo({
        type: 'SET_IS_NON_INSTITUTION_EMAIL',
        payload: {
          isNonInstitutionEmail: !isInstitutionEmail(registrationInfo.email, domains),
        },
      })
    } catch (error) {
      setInstitutionDomains([])
    }
  }

  const handleSignup = () => {
    $('#confirm-name-modal').modal({ show: true, backdrop: 'static' })
  }

  useEffect(() => {
    if (registrationInfo.confirmFullName) $('[data-toggle="tooltip"]').tooltip({ html: true })
    if (!registrationInfo.emailEntered || institutionDomains.length) return
    getInstitutionDomains()
  }, [registrationInfo.emailEntered, registrationInfo.confirmFullName])

  if (signupConfirmation)
    return (
      <ConfirmationMessage
        email={signupConfirmation.registeredEmail}
        donationAcknowledgement={signupConfirmation.donationAcknowledgement}
      />
    )
  return (
    <div className={styles.signupContainer}>
      <h1>Sign Up for OpenReview</h1>

      <label htmlFor="first-input">
        Enter your full name as you would write it as the author of a paper
      </label>
      <input
        type="text"
        id="first-input"
        className={`form-control ${styles.fullNameInput}`}
        value={registrationInfo.fullName}
        onChange={(e) => {
          setRegistrationInfo({ type: 'SET_FULL_NAME', payload: { fullName: e.target.value } })
        }}
        placeholder="Full name"
        autoComplete="name"
      />

      <div className={styles.confirmNameCheckbox}>
        <label>
          <input
            type="checkbox"
            checked={registrationInfo.confirmFullName}
            disabled={!registrationInfo.fullName.trim().length}
            onChange={(e) => {
              setRegistrationInfo({
                type: 'SET_CONFIRM_FULL_NAME',
                payload: { confirmFullName: e.target.checked },
              })
            }}
          />
          I confirm that this name is typed exactly as it would appear as an author in my
          publications. I understand that any future changes to my name will require moderation
          by the OpenReview.net Staff,and may require two weeks processing time.
        </label>
      </div>
      {registrationInfo.confirmFullName && (
        <>
          <div className={styles.emailInputContainer}>
            <label htmlFor="email-input">
              Enter an email address to be associated with your profile
            </label>
            <input
              id="email-input"
              className={`form-control ${styles.emailInput}`}
              value={registrationInfo.email}
              maxLength={254}
              onChange={(e) => {
                const cleanEmail = e.target.value.trim()
                setRegistrationInfo({ type: 'SET_EMAIL', payload: { email: cleanEmail } })
              }}
              onBlur={() => {
                setRegistrationInfo({ type: 'EMAIL_ENTERED', payload: { institutionDomains } })
              }}
              autoComplete="email"
            />
          </div>
          {registrationInfo.isNonInstitutionEmail && (
            <div className={styles.nonInstitutionEmailMessageContainer}>
              <Icon name="warning-sign" extraClasses={styles.emailTooltip} />
              <InstitutionErrorMessage email={registrationInfo.email} />
            </div>
          )}
          <div className={styles.passwordContainer}>
            <label htmlFor="password-input">
              Enter a password{' '}
              <Icon
                name="info-sign"
                extraClasses={styles.passwordTooltip}
                tooltip="Password must be between 10 and 64 characters long and contain at least one
              uppercase letter, one lowercase letter and one digit."
              />
            </label>
            <input
              type="password"
              id="password-input"
              className={`form-control ${styles.passwordInput}`}
              disabled={!isValidEmail(registrationInfo.email)}
              value={registrationInfo.password}
              onChange={(e) =>
                setRegistrationInfo({
                  type: 'SET_PASSWORD',
                  payload: { password: e.target.value },
                })
              }
              autoComplete="new-password"
              minLength={10}
              maxLength={64}
              required
            />
          </div>
          <div className={styles.repeatPasswordContainer}>
            <label htmlFor="repeat-password-input">Enter the same password again</label>
            <input
              type="password"
              id="repeat-password-input"
              className={`form-control ${styles.repeatPasswordInput}`}
              disabled={
                !isValidEmail(registrationInfo.email) ||
                registrationInfo.password.length > 64 ||
                registrationInfo.password.length < 10
              }
              value={registrationInfo.repeatPassword}
              onChange={(e) =>
                setRegistrationInfo({
                  type: 'SET_REPEAT_PASSWORD',
                  payload: { repeatPassword: e.target.value },
                })
              }
              autoComplete="new-password"
              minLength={10}
              maxLength={64}
              required
            />
          </div>
          <button
            className={`btn ${styles.signUpButton}`}
            disabled={
              !isValidPassword(registrationInfo.password, registrationInfo.repeatPassword)
            }
            onClick={handleSignup}
          >
            Sign Up
          </button>
        </>
      )}

      <ConfirmNameModal
        fullName={registrationInfo.fullName}
        email={registrationInfo.email}
        registerUser={registerUser}
      />
    </div>
  )
}
