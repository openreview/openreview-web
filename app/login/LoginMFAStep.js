/* globals promptError: false */

import { useEffect, useState } from 'react'
import SpinnerButton from '../../components/SpinnerButton'
import api from '../../lib/api-client'
import { arrayBufferToBase64, base64ToArrayBuffer } from '../../lib/utils'

import styles from './Login.module.scss'

const TOTPVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await api.post('/mfa/verify', {
        mfaPendingToken,
        method: 'totp',
        code: verificationCode,
        rememberDevice,
      })
      completeLogin()
    } catch (error) {
      setIsLoading(false)
      setError(error.message)
    }
  }

  useEffect(() => {
    if (verificationCode.length === 6) {
      handleSubmit()
    }
  }, [verificationCode])

  return (
    <div className={styles.verificationFormContainer}>
      <input
        type="text"
        className={`form-control ${styles.verificationCodeInput}`}
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="XXXXXX"
        maxLength={6}
        autoFocus
      />
      <div className={styles.rememberDeviceContainer}>
        <input
          type="checkbox"
          id="totp-remember-device"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
        />
        <label htmlFor="totp-remember-device">
          Do not ask for a code on this device for the next 30 days
        </label>
      </div>
      <SpinnerButton
        className="btn btn-sm"
        disabled={!verificationCode || isLoading}
        loading={isLoading}
        onClick={handleSubmit}
      >
        Verify
      </SpinnerButton>
    </div>
  )
}

const EmailVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
  const [challengeRequested, setChallengeRequested] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await api.post('/mfa/verify', {
        mfaPendingToken,
        method: 'emailOtp',
        code: verificationCode,
        rememberDevice,
      })
      completeLogin()
    } catch (error) {
      setIsLoading(false)
      setError(error.message)
    }
  }

  const requestChallenge = async () => {
    try {
      await api.post('/mfa/challenge', {
        mfaPendingToken,
        method: 'emailOtp',
      })
      setChallengeRequested(true)
    } catch (error) {
      setError(error.message)
    }
  }

  useEffect(() => {
    if (verificationCode.length === 6) {
      handleSubmit()
    }
  }, [verificationCode])

  if (!challengeRequested)
    return (
      <div className={styles.verificationFormContainer}>
        <SpinnerButton
          className="btn btn-sm"
          disabled={isLoading}
          loading={isLoading}
          onClick={requestChallenge}
        >
          Send verification code to email
        </SpinnerButton>
      </div>
    )

  return (
    <div className={styles.verificationFormContainer}>
      <input
        type="text"
        className={`form-control ${styles.verificationCodeInput}`}
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="XXXXXX"
        maxLength={6}
        autoFocus
      />
      <div className={styles.rememberDeviceContainer}>
        <input
          type="checkbox"
          id="totp-remember-device"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
        />
        <label htmlFor="totp-remember-device">
          Do not ask for a code on this device for the next 30 days
        </label>
      </div>
      <SpinnerButton
        className="btn btn-sm"
        disabled={!verificationCode || isLoading}
        loading={isLoading}
        onClick={handleSubmit}
      >
        Verify
      </SpinnerButton>
      <span>
        Didn’t receive the email?{' '}
        <a
          role="button"
          onClick={async () => {
            await requestChallenge()
            promptMessage(
              'Another verification code has been sent to your email. Any codes you received previously are now invalid.'
            )
          }}
        >
          Resend Code
        </a>
      </span>
    </div>
  )
}

const PasskeyVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const result = await api.post('/mfa/challenge', {
        mfaPendingToken,
        method: 'passkey',
      })
      const { allowCredentials, challenge, rpId, timeout, userVerification } = result

      const publicKeyCredentialRequestOptions = {
        challenge: base64ToArrayBuffer(challenge),
        timeout,
        rpId,
        allowCredentials: allowCredentials.map((cred) => ({
          id: base64ToArrayBuffer(cred.id),
          type: cred.type,
          transports: cred.transports,
        })),
        userVerification,
      }

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })
      const { authenticatorAttachment, id, rawId, response, type } = credential
      const { authenticatorData, clientDataJSON, signature, userHandle } = response
      await api.post('/mfa/verify', {
        mfaPendingToken,
        method: 'passkey',
        code: {
          id: credential.id,
          rawId: arrayBufferToBase64(credential.rawId),
          response: {
            clientDataJSON: arrayBufferToBase64(clientDataJSON),
            authenticatorData: arrayBufferToBase64(authenticatorData),
            signature: arrayBufferToBase64(signature),
          },
          type: credential.type,
        },
        rememberDevice,
      })
      setVerified(true)
      completeLogin()
    } catch (error) {
      setError(error.message)
    }
    setIsLoading(false)
  }

  if (verified) {
    return <div>Passkey verification completed.</div>
  }

  return (
    <div className={styles.verificationFormContainer}>
      <div className={styles.rememberDeviceContainer}>
        <input
          type="checkbox"
          id="totp-remember-device"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
        />
        <label htmlFor="totp-remember-device">
          Do not ask for a code on this device for the next 30 days
        </label>
      </div>
      <SpinnerButton
        className="btn btn-sm"
        disabled={isLoading}
        loading={isLoading}
        onClick={handleSubmit}
      >
        Continue
      </SpinnerButton>
    </div>
  )
}

const RecoveryCodeVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
  const [recoveryCode, setRecoveryCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await api.post('/mfa/verify', {
        mfaPendingToken,
        method: 'recovery',
        code: recoveryCode,
        rememberDevice,
      })
      completeLogin()
    } catch (error) {
      setIsLoading(false)
      setError(error.message)
    }
  }

  return (
    <div className={styles.verificationFormContainer}>
      <input
        type="text"
        className={`form-control ${styles.verificationCodeInput}`}
        value={recoveryCode}
        onChange={(e) => setRecoveryCode(e.target.value)}
        placeholder="XXXX-XXXX"
        autoFocus
      />
      <div className={styles.rememberDeviceContainer}>
        <input
          type="checkbox"
          id="totp-remember-device"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
        />
        <label htmlFor="totp-remember-device">
          Do not ask for a code on this device for the next 30 days
        </label>
      </div>
      <SpinnerButton
        className="btn btn-sm"
        disabled={!recoveryCode || isLoading}
        loading={isLoading}
        onClick={handleSubmit}
      >
        Verify
      </SpinnerButton>
    </div>
  )
}

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
