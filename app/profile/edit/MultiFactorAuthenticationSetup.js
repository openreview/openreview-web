/* globals promptMessage,promptError: false */

import { useEffect, useState } from 'react'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import Alert from '../../../components/Alert'
import {
  TOTPCard,
  TOTPSetup,
  TOTPDelete,
  EmailOtpCard,
  EmailSetupDelete,
  Passkey2FACard,
  PasskeySetup,
  PasskeyDelete,
  RecoveryCodeCard,
  RecoveryCodeForm,
} from './MultiFactorAuthenticationForms'

import styles from '../../../styles/components/MultiFactorAuthentication.module.scss'

const MultiFactorAuthenticationSetup = () => {
  const [mfaStatus, setMfaStatus] = useState(null)
  const [methodToEdit, setMethodToEdit] = useState(null)
  const [recoveryCodes, setRecoveryCodes] = useState(null)

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
          <TOTPSetup loadMFAStatus={loadMFAStatus} setRecoveryCodes={setRecoveryCodes} />
        )
      case 'emailOtp':
        return (
          <EmailSetupDelete
            mfaStatus={mfaStatus}
            loadMFAStatus={loadMFAStatus}
            setRecoveryCodes={setRecoveryCodes}
          />
        )
      case 'passkey':
        return mfaStatus.methods.includes('passkey') ? (
          <PasskeyDelete />
        ) : (
          <PasskeySetup loadMFAStatus={loadMFAStatus} setRecoveryCodes={setRecoveryCodes} />
        )

      default:
        if (recoveryCodes) {
          return <RecoveryCodeForm recoveryCodes={recoveryCodes} />
        }
        return null
    }
  }

  useEffect(() => {
    loadMFAStatus()
  }, [])

  useEffect(() => {
    if (methodToEdit) {
      setRecoveryCodes(null)
    }
  }, [methodToEdit])

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
          <RecoveryCodeCard mfaStatus={mfaStatus} setRecoveryCodes={setRecoveryCodes} />
        )}
      </div>
      {renderSetupEdit()}
    </div>
  )
}

export default MultiFactorAuthenticationSetup
