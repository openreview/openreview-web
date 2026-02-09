/* globals promptMessage,promptError: false */

import { useEffect, useReducer, useState } from 'react'
import copy from 'copy-to-clipboard'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import Alert from '../../../components/Alert'
import Icon from '../../../components/Icon'
import SpinnerButton from '../../../components/SpinnerButton'
import { arrayBufferToBase64, base64ToArrayBuffer } from '../../../lib/utils'
import ExportFile from '../../../components/ExportFile'

import styles from '../../../styles/components/MultiFactorAuthentication.module.scss'

const TOTPCard = ({ mfaStatus, setMethodToEdit, handleSetPreferred }) => {
  const enabled = mfaStatus?.methods?.includes('totp')
  const isPreferred = mfaStatus?.preferredMethod === 'totp'
  return (
    <div className={`${styles.method} ${enabled ? styles.enabled : styles.disabled}`}>
      <div className={styles.methodHeader}>
        <strong>Authentication App</strong>
      </div>
      <span className={styles.methodDescription}>
        use an authentication app to get codes when prompted
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

const TOTPSetup = ({ loadMFAStatus }) => {
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
      case 'SET_RECOVERY_CODES':
        return {
          ...state,
          isLoading: false,
          qrCodeDataUrl: null,
          recoveryCodes: action.payload,
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
      setTotpForm({ type: 'SET_RECOVERY_CODES', payload: result.recoveryCodes })
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
          <span>
            You can also enter the secret manually in authenticator app: {totpForm.secret}
          </span>

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
      {totpForm.recoveryCodes && (
        <RecoveryCodeForm totpRecoveryCodes={totpForm.recoveryCodes} />
      )}
    </div>
  )
}

const TOTPDelete = ({ loadMFAStatus }) => {
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
        Disable Authentication App
      </SpinnerButton>
    </div>
  )
}

const EmailOtpCard = ({ mfaStatus, setMethodToEdit, handleSetPreferred }) => {
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

const EmailSetupDelete = ({ mfaStatus, loadMFAStatus }) => {
  const enabled = mfaStatus?.methods?.includes('emailOtp')
  const [recoveryCodes, setRecoveryCodes] = useState(null)

  const initEmailSetup = async () => {
    try {
      const result = await api.post('/mfa/setup/email')
      setRecoveryCodes(result.recoveryCodes)
      loadMFAStatus()
      promptMessage('Email OTP setup successful')
    } catch (error) {
      promptError(error.message)
    }
  }

  const disableEmailOtp = async () => {
    try {
      await api.delete('/mfa/email')
      loadMFAStatus()
      setRecoveryCodes(null)
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

  if (recoveryCodes) {
    return (
      <div className={styles.recoveryCodesContainer}>
        <span>
          Please save the following recovery codes in a safe place. You can use them to log in
          if you lose access to your email. The recovery codes will not be shown again.
        </span>
        <ul>
          {recoveryCodes.map((code) => (
            <li key={code}>
              <strong>{code}</strong>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return null
}

const Passkey2FACard = ({ mfaStatus, setMethodToEdit, handleSetPreferred }) => {
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

const PasskeyForm = ({ loadMFAStatus }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [passkeyName, setPasskeyName] = useState('')

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

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })

      await api.post('/mfa/setup/passkey/verify', {
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
        placeholder="Enter a name for passkey"
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

const PasskeySetup = ({ loadMFAStatus }) => (
  <div className={styles.passkeyFormContainer}>
    <h4>Set up Passkey</h4>
    <PasskeyForm loadMFAStatus={loadMFAStatus} />
  </div>
)

const PasskeyDelete = ({ loadMFAStatus }) => {
  const [passKeys, setPassKeys] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const loadPassKeys = async () => {
    try {
      const result = await api.get('/mfa/passkeys')
      setPassKeys(result.passkeys)
    } catch (error) {
      promptError(error.message)
    }
  }

  const deletePasskey = async (passkey) => {
    setIsLoading(true)
    try {
      await api.delete(`/mfa/passkeys/${passkey}`)
      promptMessage('Passkey is deleted')
      loadMFAStatus()
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
        <PasskeyForm loadMFAStatus={loadMFAStatus} onSuccess={loadPassKeys} />
      </div>
    </div>
  )
}

const RecoveryCodeCard = ({ mfaStatus, setMethodToEdit }) => (
  <div className={styles.method}>
    <div className={styles.methodHeader}>
      <strong>Recovery Codes</strong>
    </div>
    <span className={styles.methodDescription}>
      {mfaStatus.recoveryCodesRemaining} codes unused
    </span>
    <div className={styles.cardActions}>
      <button className="btn btn-xs" onClick={() => setMethodToEdit('recoveryCode')}>
        Generate New Code
      </button>
    </div>
  </div>
)

const RecoveryCodeForm = ({ totpRecoveryCodes }) => {
  const [recoveryCodes, setRecoveryCodes] = useState(totpRecoveryCodes)
  const generateRecoveryCodes = async () => {
    try {
      const result = await api.post('/mfa/recovery-codes/regenerate')
      setRecoveryCodes(result.recoveryCodes)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!totpRecoveryCodes) generateRecoveryCodes()
  }, [])

  if (!recoveryCodes) return <LoadingSpinner inline />
  return (
    <div className={styles.recoveryCodesContainer}>
      <p>
        Recovery codes is the last resort of accessing your account when you lose access to all
        other verification methods.Please save the following recovery codes in a safe place.
      </p>
      <p>
        You will <strong>NOT</strong> be able to login if you lost them. The recovery codes
        will <strong>NOT</strong> be shown again.
      </p>
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
}

const MutltiFactorAuthentication = () => {
  const [mfaStatus, setMfaStatus] = useState(null)
  const [methodToEdit, setMethodToEdit] = useState(null)

  const loadMFAStatus = async () => {
    setMethodToEdit(null)
    try {
      const result = await api.get('/mfa/status')
      setMfaStatus(result)
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleSetPreferred = async (method) => {
    try {
      await api.put('/mfa/preferred', { method })
      loadMFAStatus()
    } catch (error) {
      promptError(error.message)
    }
  }

  const renderSetupEdit = () => {
    switch (methodToEdit) {
      case 'totp':
        return mfaStatus.methods.includes('totp') ? (
          <TOTPDelete loadMFAStatus={loadMFAStatus} />
        ) : (
          <TOTPSetup loadMFAStatus={loadMFAStatus} />
        )
      case 'emailOtp':
        return <EmailSetupDelete mfaStatus={mfaStatus} loadMFAStatus={loadMFAStatus} />
      case 'passkey':
        return mfaStatus.methods.includes('passkey') ? (
          <PasskeyDelete loadMFAStatus={loadMFAStatus} />
        ) : (
          <PasskeySetup loadMFAStatus={loadMFAStatus} />
        )
      case 'recoveryCode':
        return <RecoveryCodeForm />
      default:
        return null
    }
  }

  useEffect(() => {
    loadMFAStatus()
  }, [])

  if (!mfaStatus) return <LoadingSpinner />
  return (
    <div className={styles.multiFactorAuthenticationContainer}>
      <p>
        Multi-Factor Authentication is necessary to make sure your OpenReview profile is
        secure.
      </p>
      {mfaStatus.enabled === false && (
        <Alert color="danger">
          Multi-Factor Authentication is currently disabled. Please configure below.
        </Alert>
      )}
      <div className={styles.methodsContainer}>
        <TOTPCard
          mfaStatus={mfaStatus}
          setMethodToEdit={setMethodToEdit}
          handleSetPreferred={handleSetPreferred}
        />
        <Passkey2FACard
          mfaStatus={mfaStatus}
          setMethodToEdit={setMethodToEdit}
          handleSetPreferred={handleSetPreferred}
        />
        <EmailOtpCard
          mfaStatus={mfaStatus}
          setMethodToEdit={setMethodToEdit}
          handleSetPreferred={handleSetPreferred}
        />
        {mfaStatus.enabled && (
          <RecoveryCodeCard mfaStatus={mfaStatus} setMethodToEdit={setMethodToEdit} />
        )}
      </div>
      {renderSetupEdit()}
    </div>
  )
}

export default MutltiFactorAuthentication
