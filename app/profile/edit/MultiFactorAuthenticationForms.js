/* globals promptMessage,promptError: false */

import { useEffect, useReducer, useState } from 'react'
import copy from 'copy-to-clipboard'
import api from '../../../lib/api-client'
import Icon from '../../../components/Icon'
import SpinnerButton from '../../../components/SpinnerButton'
import { arrayBufferToBase64, base64ToArrayBuffer } from '../../../lib/utils'
import ExportFile from '../../../components/ExportFile'

import styles from '../../../styles/components/MultiFactorAuthentication.module.scss'

export const TOTPCard = ({ mfaStatus, setMethodToEdit, handleSetPreferred }) => {
  const enabled = mfaStatus?.methods?.includes('totp')
  const isPreferred = mfaStatus?.preferredMethod === 'totp'
  return (
    <div className={`${styles.method} ${enabled ? styles.enabled : styles.disabled}`}>
      <div className={styles.methodHeader}>
        <strong>Authenticator App</strong>
      </div>
      <span className={styles.methodDescription}>
        use an authenticator app to get codes when prompted
      </span>
      <Icon name="phone" />
      <div className={styles.cardActions}>
        <button className="btn btn-xs" onClick={() => setMethodToEdit('totp')}>
          {enabled ? 'Disable' : 'Set up'}
        </button>
        {enabled && (
          <button
            className="btn btn-xs btn-default"
            onClick={() => handleSetPreferred('totp')}
            disabled={isPreferred}
            title={isPreferred ? 'This is your preferred authentication method' : ''}
          >
            Set as Preferred
          </button>
        )}
      </div>
    </div>
  )
}

export const TOTPSetup = ({ loadMFAStatus, setRecoveryCodes }) => {
  const [totpForm, setTotpForm] = useReducer(totpFormReducer, {})

  function totpFormReducer(state, action) {
    switch (action.type) {
      case 'INIT':
        return {
          ...state,
          qrCodeDataUrl: action.payload.qrCodeDataUrl,
          qrCodeUrl: action.payload.qrCodeUrl,
          secret: action.payload.secret,
        }
      case 'SET_VERIFICATION_CODE':
        return {
          ...state,
          verificationCode: action.payload,
        }
      case 'SET_LOADING':
        return {
          ...state,
          isLoading: action.payload,
        }
      default:
        return state
    }
  }

  const handleVerifyClick = async () => {
    setTotpForm({ type: 'SET_LOADING', payload: true })
    try {
      const result = await api.post('/mfa/setup/totp/verify', {
        code: totpForm.verificationCode,
      })
      promptMessage('TOTP setup successful')
      loadMFAStatus()
      if (result.recoveryCodes) setRecoveryCodes(result.recoveryCodes)
    } catch (error) {
      setTotpForm({ type: 'SET_LOADING', payload: false })
      promptError(error.message)
    }
  }

  const initTOTPSetup = async () => {
    try {
      const result = await api.post('/mfa/setup/totp/init')
      setTotpForm({ type: 'INIT', payload: result })
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    initTOTPSetup()
  }, [])

  return (
    <div className={styles.totpEditContainer}>
      {totpForm.qrCodeDataUrl && (
        <>
          <span>Scan the QR Code below</span>
          <div>
            <img src={totpForm.qrCodeDataUrl} alt="TOTP QR Code" />
          </div>

          <input
            type="text"
            className="form-control"
            placeholder="Enter code from authenticator app"
            maxLength={6}
            value={totpForm.verificationCode || ''}
            onChange={(e) =>
              setTotpForm({ type: 'SET_VERIFICATION_CODE', payload: e.target.value })
            }
          />
          <SpinnerButton
            className="btn btn-primary"
            disabled={!totpForm.verificationCode || totpForm.isLoading}
            loading={totpForm.isLoading}
            onClick={handleVerifyClick}
          >
            Verify
          </SpinnerButton>
        </>
      )}
    </div>
  )
}

export const TOTPDelete = ({ loadMFAStatus }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleDeletTotp = async () => {
    setIsLoading(true)
    try {
      await api.delete('/mfa/totp')
    } catch (error) {
      promptError(error.message)
      setIsLoading(false)
    }
    loadMFAStatus()
  }

  return (
    <div className={styles.totpEditContainer}>
      <span>Are you sure you want to disable TOTP?</span>
      <SpinnerButton
        className="btn btn-primary"
        disabled={isLoading}
        loading={isLoading}
        onClick={handleDeletTotp}
      >
        Disable Authenticator App
      </SpinnerButton>
    </div>
  )
}

export const EmailOtpCard = ({ mfaStatus, setMethodToEdit, handleSetPreferred }) => {
  const enabled = mfaStatus?.methods?.includes('emailOtp')
  const isPreferred = mfaStatus?.preferredMethod === 'emailOtp'
  return (
    <div className={`${styles.method} ${enabled ? styles.enabled : styles.disabled}`}>
      <div className={styles.methodHeader}>
        <strong>Email</strong>
      </div>
      <span className={styles.methodDescription}>get one-time code sent to your email</span>
      <Icon name="envelope" />
      <div className={styles.cardActions}>
        <button className="btn btn-xs" onClick={() => setMethodToEdit('emailOtp')}>
          {enabled ? 'Disable' : 'Enable'}
        </button>
        {enabled && (
          <button
            className="btn btn-xs btn-default"
            onClick={() => handleSetPreferred('emailOtp')}
            disabled={isPreferred}
            title={isPreferred ? 'This is your preferred authentication method' : ''}
          >
            Set as Preferred
          </button>
        )}
      </div>
    </div>
  )
}

export const EmailSetupDelete = ({ mfaStatus, loadMFAStatus, setRecoveryCodes }) => {
  const enabled = mfaStatus?.methods?.includes('emailOtp')

  const initEmailSetup = async () => {
    try {
      const result = await api.post('/mfa/setup/email')
      loadMFAStatus()
      if (result.recoveryCodes) {
        setRecoveryCodes(result.recoveryCodes)
      }
      promptMessage('Email OTP setup successful')
    } catch (error) {
      promptError(error.message)
    }
  }

  const disableEmailOtp = async () => {
    try {
      await api.delete('/mfa/email')
      loadMFAStatus()
      promptMessage('Email OTP is disabled')
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!enabled) {
      initEmailSetup()
    } else {
      disableEmailOtp()
    }
  }, [])

  return null
}

export const Passkey2FACard = ({ mfaStatus, setMethodToEdit, handleSetPreferred }) => {
  const enabled = mfaStatus?.methods?.includes('passkey')
  const isPreferred = mfaStatus?.preferredMethod === 'passkey'
  return (
    <div className={`${styles.method} ${enabled ? styles.enabled : styles.disabled}`}>
      <div className={styles.methodHeader}>
        <strong>Passkey</strong>
      </div>
      <span className={styles.methodDescription}>use a passkey to authenticate</span>
      <Icon name="lock" />
      <div className={styles.cardActions}>
        <button className="btn btn-xs" onClick={() => setMethodToEdit('passkey')}>
          {enabled ? 'Edit' : 'Set up'}
        </button>
        {enabled && (
          <button
            className="btn btn-xs btn-default"
            onClick={() => handleSetPreferred('passkey')}
            disabled={isPreferred}
            title={isPreferred ? 'This is your preferred authentication method' : ''}
          >
            Set as Preferred
          </button>
        )}
      </div>
    </div>
  )
}

export const PasskeyForm = ({ loadMFAStatus, setRecoveryCodes }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [passkeyName, setPasskeyName] = useState('')

  const createPasskeyCredential = async (options) => {
    try {
      return await navigator.credentials.create({ publicKey: options })
    } catch (error) {
      if (error?.name === 'NotAllowedError') {
        throw new Error('Passkey creation failed. Please try again.')
      }
      throw error
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const result = await api.post('/mfa/setup/passkey/init')
      const {
        challenge,
        rp,
        user,
        pubKeyCredParams,
        timeout,
        attestation,
        excludeCredentials,
        authenticatorSelection,
        extensions,
        hints,
      } = result

      const publicKeyCredentialCreationOptions = {
        challenge: base64ToArrayBuffer(challenge),
        rp,
        user: {
          id: base64ToArrayBuffer(user.id),
          name: user.name,
          displayName: user.displayName,
        },
        pubKeyCredParams,
        timeout,
        authenticatorSelection,
        attestation,
      }

      const credential = await createPasskeyCredential(publicKeyCredentialCreationOptions)

      const verifyResult = await api.post('/mfa/setup/passkey/verify', {
        response: {
          id: credential.id,
          rawId: arrayBufferToBase64(credential.rawId),
          response: {
            clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
            attestationObject: arrayBufferToBase64(credential.response.attestationObject),
          },
          type: credential.type,
        },
        name: passkeyName,
      })

      promptMessage('Passkey added successfully')
      setPasskeyName('')
      loadMFAStatus()
      if (verifyResult.recoveryCodes) {
        setRecoveryCodes(verifyResult.recoveryCodes)
      }
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  return (
    <div className={styles.passkeyFormContainer}>
      <input
        type="text"
        className="form-control"
        placeholder="Name this passkey (e.g., Laptop Touch ID)"
        value={passkeyName}
        onChange={(e) => setPasskeyName(e.target.value)}
      />
      <SpinnerButton
        className="btn btn-primary"
        disabled={isLoading || !passkeyName.trim()}
        loading={isLoading}
        onClick={handleSubmit}
      >
        Add Passkey
      </SpinnerButton>
    </div>
  )
}

export const PasskeySetup = ({ loadMFAStatus, setRecoveryCodes }) => (
  <div className={styles.passkeyFormContainer}>
    <h4>Set up Passkey</h4>
    <PasskeyForm loadMFAStatus={loadMFAStatus} setRecoveryCodes={setRecoveryCodes} />
  </div>
)

export const PasskeyDelete = ({ loadMFAStatus }) => {
  const [passKeys, setPassKeys] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const loadPassKeys = async () => {
    try {
      const result = await api.get('/mfa/passkeys')
      setPassKeys(result.passkeys)
      return result.passkeys
    } catch (error) {
      promptError(error.message)
      return null
    }
  }

  const deletePasskey = async (passkey) => {
    setIsLoading(true)
    try {
      await api.delete(`/mfa/passkeys/${passkey}`)
      const updatedPassKeys = await loadPassKeys()
      if (!updatedPassKeys?.length) {
        promptMessage('All Passkeys are deleted')
        loadMFAStatus()
      } else {
        promptMessage('Passkey is deleted')
      }
    } catch (error) {
      promptError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPassKeys()
  }, [])

  return (
    <div className={styles.passkeyFormContainer}>
      <h4>Manage Passkeys</h4>
      {passKeys.length > 0 ? (
        <table className="table ">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {passKeys.map((passkey) => (
              <tr key={passkey.credentialId}>
                <td>{passkey.name}</td>
                <td>{new Date(passkey.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-xs btn-danger"
                    onClick={() => deletePasskey(passkey.credentialId)}
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No passkeys configured yet.</p>
      )}

      <div className={styles.addPasskeySection}>
        <h4>Add a new passkey</h4>
        <PasskeyForm loadMFAStatus={loadPassKeys} />
      </div>
    </div>
  )
}

export const RecoveryCodeCard = ({ mfaStatus, setRecoveryCodes }) => {
  const generateRecoveryCodes = async () => {
    try {
      const result = await api.post('/mfa/recovery-codes/regenerate')
      setRecoveryCodes(result.recoveryCodes)
    } catch (error) {
      promptError(error.message)
    }
  }
  return (
    <div className={styles.method}>
      <div className={styles.methodHeader}>
        <strong>Recovery Codes</strong>
      </div>
      <span className={styles.methodDescription}>
        {mfaStatus.recoveryCodesRemaining} codes unused
      </span>
      <div className={styles.cardActions}>
        <button className="btn btn-xs" onClick={() => generateRecoveryCodes()}>
          Generate New Code
        </button>
      </div>
    </div>
  )
}

export const RecoveryCodeForm = ({ recoveryCodes }) => (
  <div className={styles.recoveryCodesContainer}>
    <p>
      Recovery codes are your last way to access your account if you lose all other
      verification methods.
      <br />
      Save these codes in a secure place.
      <br />
      If you lose them, you will not be able to log in.
    </p>
    <p>These recovery codes will not be shown again.</p>
    <ul>
      {recoveryCodes.map((code) => (
        <li key={code}>
          <strong>{code}</strong>
        </li>
      ))}
    </ul>
    <div className={styles.downloadCodeButtons}>
      <ExportFile
        buttonText="Download"
        exportType="text"
        records={recoveryCodes}
        customTransformFn={(codes) => codes.map((code) => `${code}\n`)}
        fileName="openreview-recovery-codes.txt"
      />
      <button
        className="btn btn-primary"
        onClick={() => {
          copy(recoveryCodes.join('\n'))
          promptMessage('Recovery codes copied to clipboard')
        }}
      >
        Copy to Clipboard
      </button>
    </div>
  </div>
)
