'use client'

import { InfoCircleFilled } from '@ant-design/icons'
import { Checkbox, Col, Flex, Input, Row, Select, Space, Tooltip } from 'antd'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import { useState, useEffect, useRef } from 'react'
import BasicModal from '../../components/BasicModal'
import Icon from '../../components/Icon'
import useTurnstileToken from '../../hooks/useTurnstileToken'
import api from '../../lib/api-client'
import { isInstitutionEmail, isValidEmail, isValidPassword } from '../../lib/utils'

import styles from './Signup.module.scss'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const monthOptions = [
  { label: 'January (1)', value: '01' },
  { label: 'February (2)', value: '02' },
  { label: 'March (3)', value: '03' },
  { label: 'April (4)', value: '04' },
  { label: 'May (5)', value: '05' },
  { label: 'June (6)', value: '06' },
  { label: 'July (7)', value: '07' },
  { label: 'August (8)', value: '08' },
  { label: 'September (9)', value: '09' },
  { label: 'October (10)', value: '10' },
  { label: 'November (11)', value: '11' },
  { label: 'December (12)', value: '12' },
]

const getDobError = (dobString) => {
  const dob = dayjs(dobString, 'YYYY-MM-DD', true)
  if (!dob.isValid()) return 'Please enter a valid date of birth.'
  if (dob.isAfter(dayjs().subtract(13, 'year').startOf('day')))
    return 'OpenReview profiles require an age of 13 or over.'
  if (dob.isBefore(dayjs().subtract(100, 'year').startOf('day')))
    return 'Please enter a valid date of birth.'
  return null
}

const SignupForm = ({ setSignupConfirmation }) => {
  const [fullName, setFullName] = useState('')
  const [confirmFullName, setConfirmFullName] = useState(false)
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [dobConfirmed, setDobConfirmed] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [dobMM, setDobMM] = useState(null)
  const [dobDD, setDobDD] = useState(null)
  const [dobYYYY, setDobYYYY] = useState(null)
  const lastDobError = useRef(null)

  const registerUser = async (email, password) => {
    const dob = dayjs
      .utc(`${dobYYYY}-${dobMM}-${dobDD.padStart(2, '0')}`, 'YYYY-MM-DD', true)
      .valueOf()
    let bodyData = {}
    bodyData = { email, password, fullname: fullName.trim(), token: turnstileToken, dob }

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

  useEffect(() => {
    if (!dobMM || !dobDD || dobYYYY?.length !== 4) {
      lastDobError.current = null
      setDobConfirmed(false)
      return
    }
    const error = getDobError(`${dobYYYY}-${dobMM}-${dobDD.padStart(2, '0')}`)
    setDobConfirmed(!error)
    if (error && error !== lastDobError.current) promptError(error)
    lastDobError.current = error
  }, [dobYYYY, dobMM, dobDD])

  const handleDobBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return
    if (!dobMM && !dobDD && !dobYYYY) return
    if (!dobMM || !dobDD || dobYYYY?.length !== 4) {
      promptError('Please enter a valid date of birth.')
    }
  }

  return (
    <div className="signup-form-container">
      <Flex vertical gap="small">
        <label htmlFor="first-input" className={styles.titleText}>
          Enter your full name as you would write it as the author of a paper
        </label>
        <Input
          id="first-input"
          className={styles.fieldWidth}
          value={fullName}
          onInput={(e) => setIsComposing(e.nativeEvent.isComposing)}
          onCompositionEnd={() => setIsComposing(false)}
          onChange={(e) => {
            setFullName(e.target.value)
          }}
          placeholder="Full name"
          autoComplete="name"
        />
        <Space align="start">
          <Checkbox
            id="name-confirmation"
            checked={confirmFullName}
            disabled={!fullName.length}
            onChange={(e) => setConfirmFullName(fullName ? e.target.checked : false)}
          />
          <label
            htmlFor="name-confirmation"
            className={`${styles.nameConfirmation} ${fullName.length ? '' : styles.disabled}`}
          >
            I confirm that this name is typed exactly as it would appear as an author in my
            publications. I understand that any future changes to my name will require
            moderation by the OpenReview.net Staff.
          </label>
        </Space>
      </Flex>

      {confirmFullName && (
        <>
          <hr className="spacer" />
          <Flex vertical gap="small">
            <label htmlFor="dob-input" className={styles.titleText}>
              Enter your date of birth{' '}
              <Tooltip
                title={
                  <Space vertical size={4}>
                    <span>OpenReview requires date of birth for age verification.</span>
                    <span>Your date of birth is never shown publicly.</span>
                  </Space>
                }
                styles={{
                  root: { maxWidth: '320px' },
                }}
              >
                <InfoCircleFilled
                  tabIndex={0}
                  aria-label="Why we ask for your date of birth"
                  style={{
                    cursor: 'help',
                    color: '#3e6775',
                    fontSize: '1rem',
                  }}
                />
              </Tooltip>
            </label>
            <Flex gap="middle" onBlur={handleDobBlur} className={styles.fieldWidth}>
              <Select
                options={monthOptions}
                value={dobMM}
                onChange={(value) => {
                  setDobMM(value)
                }}
                placeholder="Month"
                popupMatchSelectWidth={false}
                style={{ flex: '2 1 0', width: 'auto' }}
              />
              <Input
                value={dobDD}
                onChange={(e) => {
                  setDobDD(e.target.value.replace(/\D/g, '').slice(0, 2))
                }}
                placeholder="DD"
                inputMode="numeric"
                style={{ flex: '1 1 0' }}
              />
              <Input
                value={dobYYYY}
                onChange={(e) => {
                  setDobYYYY(e.target.value.replace(/\D/g, '').slice(0, 4))
                }}
                placeholder="YYYY"
                inputMode="numeric"
                style={{ flex: '1.5 1 0' }}
              />
            </Flex>
          </Flex>

          {dobConfirmed && (
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
      Please note: Your email address could not be automatically verified.
      <br />
      Accounts that cannot be automatically verified will need to be manually activated. To
      expedite the process, we recommend using an email address from a recognized company or
      institution (for example, your employer, university, or research lab), or completing your
      profile information as thoroughly as possible to help us verify your affiliation.
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
              <Tooltip
                title="Password must be between 10 and 64 characters long and contain at least one
              uppercase letter, one lowercase letter and one digit."
                styles={{
                  root: { maxWidth: '320px' },
                }}
              >
                <InfoCircleFilled
                  tabIndex={0}
                  aria-label="Why we ask for your date of birth"
                  style={{ cursor: 'help', color: '#3e6775', fontSize: '1rem' }}
                />
              </Tooltip>
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
      <div className="mt-3 mb-2 text-center" ref={turnstileContainerRef} />
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
    <Row>
      <Col xs={24} lg={{ span: 20, offset: 2 }} xl={{ span: 16, offset: 4 }}>
        <h1>Sign Up for OpenReview</h1>
        <SignupForm setSignupConfirmation={setSignupConfirmation} />
      </Col>
    </Row>
  )
}
