/* globals promptError,promptMessage: false */

import { useEffect, useState } from 'react'
import SpinnerButton from '../../components/SpinnerButton'
import api from '../../lib/api-client'
import { arrayBufferToBase64, base64ToArrayBuffer } from '../../lib/utils'

import styles from './Login.module.scss'

export const TOTPVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
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

export const EmailVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
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
        Didn’t receive the email? {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
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

export const PasskeyVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(false)

  const getPasskeyCredential = async (publicKey) => {
    try {
      return await navigator.credentials.get({ publicKey })
    } catch (error) {
      if (error?.name === 'NotAllowedError') {
        throw new Error('Passkey verification failed. Please try again.')
      }
      throw error
    }
  }

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

      const credential = await getPasskeyCredential(publicKeyCredentialRequestOptions)
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

export const RecoveryCodeVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
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
