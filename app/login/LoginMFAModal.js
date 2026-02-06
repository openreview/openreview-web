import { useEffect, useState } from 'react'
import BasicModal from '../../components/BasicModal'
import SpinnerButton from '../../components/SpinnerButton'
import api from '../../lib/api-client'
import styles from './Login.module.scss'

const TOTPVerificationForm = ({ mfaPendingToken, completeLogin, setError }) => {
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await api.post('/mfa/verify', {
        mfaPendingToken: mfaPendingToken,
        method: 'totp',
        code: verificationCode,
        rememberDevice: rememberDevice,
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

const LoginMFAModal = ({ mfaStatus, completeLogin, setFormState }) => {
  const { mfaMethods, mfaPending, mfaPendingToken, preferredMethod } = mfaStatus ?? {}
  const [selectedMFAMethod, setSelectedMFAMethod] = useState(preferredMethod)

  const [error, setError] = useState(null)

  const renderMethodForm = () => {
    switch (selectedMFAMethod) {
      case 'totp':
        return (
          <TOTPVerificationForm
            mfaPendingToken={mfaPendingToken}
            completeLogin={completeLogin}
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
        <h3>Two-Factor Authentication</h3>
      </div>
      <div className="modal-body">
        {error && <div className="alert alert-danger">{error}</div>}

        {renderMethodForm()}

        {mfaMethods && mfaMethods.length > 1 && (
          <div className="mt-4 pt-4 border-top">
            <p className="text-muted">Or use a different method:</p>
            <div className="btn-group" role="group">
              {mfaMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`btn ${selectedMethod === method ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => {
                    setSelectedMethod(method)
                    setVerificationCode('')
                    setError(null)
                  }}
                >
                  {method === 'totp' && 'Authenticator App'}
                  {method === 'sms' && 'SMS'}
                  {method === 'email' && 'Email'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </BasicModal>
  )
}

export default LoginMFAModal
