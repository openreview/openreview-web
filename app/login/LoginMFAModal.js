/* globals promptError: false */

import { useEffect, useState } from 'react'
import BasicModal from '../../components/BasicModal'
import SpinnerButton from '../../components/SpinnerButton'
import api from '../../lib/api-client'

import styles from './Login.module.scss'
import { arrayBufferToBase64, base64ToArrayBuffer } from '../../lib/utils'

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
  return (
    <div className={styles.totpContainer}>
      <input
        type="text"
        className="form-control"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="Enter the 6-digit code from your authenticator app"
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
        className="btn btn-xs"
        disabled={!verificationCode || isLoading}
        loading={isLoading}
        onClick={handleSubmit}
      >
        Submit
      </SpinnerButton>
    </div>
  )
}

const EmailVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
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
    } catch (error) {
      setError(error.message)
    }
  }

  useEffect(() => {
    requestChallenge()
  }, [])

  return (
    <div className={styles.totpContainer}>
      <input
        type="text"
        className="form-control"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="Enter the 6-digit code from your authenticator app"
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
        className="btn btn-xs"
        disabled={!verificationCode || isLoading}
        loading={isLoading}
        onClick={handleSubmit}
      >
        Submit
      </SpinnerButton>
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
    <div className={styles.totpContainer}>
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
        className="btn btn-xs"
        disabled={isLoading}
        loading={isLoading}
        onClick={handleSubmit}
      >
        Submit
      </SpinnerButton>
    </div>
  )
}

const RecovertyCodeVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
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
    <div className={styles.totpContainer}>
      <input
        type="text"
        className="form-control"
        value={recoveryCode}
        onChange={(e) => setRecoveryCode(e.target.value)}
        placeholder="Enter your recovery code"
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
        className="btn btn-xs"
        disabled={!recoveryCode || isLoading}
        loading={isLoading}
        onClick={handleSubmit}
      >
        Submit
      </SpinnerButton>
    </div>
  )
}

const LoginMFAModal = ({ mfaStatus, completeLogin, setFormState }) => {
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
          <RecovertyCodeVerificationForm
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
    <BasicModal
      id="login-mfa-modal"
      options={{ hideFooter: true, extraClasses: 'modal-lg' }}
      onClose={() => {
        setError(null)
        setFormState({ type: 'HAS_ERROR' })
        promptError('Please complete multi-factor authentication.')
      }}
    >
      <div className="modal-header">
        <h3>{formatMfaMethodName(selectedMFAMethod)} Verification</h3>
      </div>
      <div className="modal-body">
        {error && <div className="alert alert-danger">{error}</div>}

        {renderMethodForm()}

        {verificationPassed ? null : (
          <div className={styles.alternativeMethodsContainer}>
            {mfaMethods
              ?.filter((p) => p !== selectedMFAMethod)
              ?.map((alternativeMethod) => (
                <button
                  key={alternativeMethod}
                  className="btn btn-link"
                  type="button"
                  onClick={() => setSelectedMFAMethod(alternativeMethod)}
                >
                  Log in using {formatMfaMethodName(alternativeMethod)}
                </button>
              ))}
            <button
              className="btn btn-link"
              type="button"
              onClick={() => setSelectedMFAMethod('recoveryCode')}
            >
              Log in using {formatMfaMethodName('recoveryCode')}
            </button>
          </div>
        )}
      </div>
    </BasicModal>
  )
}

export default LoginMFAModal
