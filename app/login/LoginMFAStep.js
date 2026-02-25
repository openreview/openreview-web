/* globals promptError: false */

import { useEffect, useState } from 'react'
import {
  EmailVerificationForm,
  PasskeyVerificationForm,
  RecoveryCodeVerificationForm,
  TOTPVerificationForm,
} from './VerificationForm'

import styles from './Login.module.scss'

const LoginMFAStep = ({ mfaStatus, completeLogin }) => {
  const { mfaMethods, mfaPending, mfaPendingToken, preferredMethod } = mfaStatus ?? {}
  const [selectedMFAMethod, setSelectedMFAMethod] = useState(preferredMethod)
  const [verificationPassed, setVerificationPassed] = useState(false)

  const [error, setError] = useState(null)

  const formatMfaMethodName = (method) => {
    switch (method) {
      case 'totp':
        return 'Authenticator App'
      case 'emailOtp':
        return 'Email OTP'
      case 'passkey':
        return 'Passkey'
      case 'recoveryCode':
        return 'Recovery Code'
      default:
        return method
    }
  }

  const renderMethodDescription = () => {
    switch (selectedMFAMethod) {
      case 'totp':
        return <p>Enter the 6-digit code from your authenticator app.</p>
      case 'emailOtp':
        return (
          <p>
            Enter the 6-digit code sent to your email address.
            <br /> The code is valid for 10 minutes.
          </p>
        )
      case 'passkey':
        return <p>Verify using your passkey (Touch ID or Face ID).</p>
      case 'recoveryCode':
        return (
          <p>
            If you are unable to use your authenticator app or email OTP, enter one of your
            recovery codes. Each code can be used only once.
          </p>
        )
      default:
        return null
    }
  }

  const renderMethodForm = () => {
    switch (selectedMFAMethod) {
      case 'totp':
        return (
          <TOTPVerificationForm
            mfaPendingToken={mfaPendingToken}
            completeLogin={() => {
              setVerificationPassed(true)
              completeLogin()
            }}
            setError={setError}
          />
        )
      case 'emailOtp':
        return (
          <EmailVerificationForm
            mfaPendingToken={mfaPendingToken}
            completeLogin={() => {
              setVerificationPassed(true)
              completeLogin()
            }}
            setError={setError}
          />
        )
      case 'passkey':
        return (
          <PasskeyVerificationForm
            mfaPendingToken={mfaPendingToken}
            completeLogin={() => {
              setVerificationPassed(true)
              completeLogin()
            }}
            setError={setError}
          />
        )
      case 'recoveryCode':
        return (
          <RecoveryCodeVerificationForm
            mfaPendingToken={mfaPendingToken}
            completeLogin={() => {
              setVerificationPassed(true)
              completeLogin()
            }}
            setError={setError}
          />
        )
      default:
        return null
    }
  }

  useEffect(() => {
    if (preferredMethod) {
      setSelectedMFAMethod(preferredMethod)
    }
  }, [preferredMethod])

  return (
    <div className={styles.mfaStepContainer}>
      <h3>Two-Factor authentication</h3>
      <div className={styles.mfaMethodDescription}>{renderMethodDescription()}</div>

      {error && <div className="alert alert-danger">{error}</div>}

      {renderMethodForm()}

      {verificationPassed ? null : (
        <div className={styles.alternativeMethodsContainer}>
          Alternatively, you can choose to verify using another method:
          {mfaMethods
            ?.filter((p) => p !== selectedMFAMethod)
            ?.map((alternativeMethod) => (
              <button
                key={alternativeMethod}
                className="btn btn-link"
                type="button"
                onClick={() => {
                  setError(null)
                  setSelectedMFAMethod(alternativeMethod)
                }}
              >
                Log in using {formatMfaMethodName(alternativeMethod)}
              </button>
            ))}
          {selectedMFAMethod !== 'recoveryCode' && (
            <button
              className="btn btn-link"
              type="button"
              onClick={() => {
                setError(null)
                setSelectedMFAMethod('recoveryCode')
              }}
            >
              Log in using {formatMfaMethodName('recoveryCode')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default LoginMFAStep
