/* globals promptError,promptMessage,$: false */

import { useEffect, useReducer, useState } from 'react'
import { useRouter } from 'next/router'
import { nanoid } from 'nanoid'
import Icon from '../Icon'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { isInstitutionEmail, isValidEmail } from '../../lib/utils'

const EmailsButton = ({
  type,
  emailObj,
  handleRemove,
  handleConfirm,
  handleMakePreferred,
  handleVerify,
}) => {
  const { confirmed, preferred, email, isValid, visible } = emailObj
  if (type === 'confirmed') {
    if (confirmed) {
      return <div className="emails__confirmed-text hint">(Confirmed)</div>
    }
    if (!confirmed && email && isValid) {
      return (
        <button type="button" className="btn confirm-button" onClick={handleConfirm}>
          Confirm
        </button>
      )
    }
    return null
  }

  if (type === 'remove' && !confirmed && email && isValid) {
    return (
      <button type="button" className="btn" onClick={handleRemove}>
        Remove
      </button>
    )
  }

  if (type === 'preferred') {
    if (preferred) {
      return <div className="emails__preferred-text hint">(Preferred Email)</div>
    }
    if (confirmed) {
      return (
        <button type="button" className="btn preferred-button" onClick={handleMakePreferred}>
          Make Preferred
        </button>
      )
    }
  }

  if (type === 'verify' && !(confirmed || preferred) && visible) {
    return (
      <button type="button" className="btn verify-button" onClick={handleVerify}>
        Verify
      </button>
    )
  }
  return null
}

const EmailsSection = ({
  profileEmails,
  profileId,
  updateEmails,
  institutionDomains,
  isNewProfile,
}) => {
  const router = useRouter()

  const emailsReducer = (state, action) => {
    if (action.addNewEmail) return [...state, action.data]
    if (action.updateEmail) {
      return state.map((email) => {
        let emailCopy = { ...email }
        if (email.key === action.data.key) {
          emailCopy = action.data
          if (action.setVisible) emailCopy.visible = action.data.visibleValue
        }
        return emailCopy
      })
    }
    if (action.removeEmail) {
      return state.filter((p) => p.key !== action.data.key)
    }
    if (action.setPreferred) {
      return state.map((email) => {
        const emailCopy = { ...email, preferred: false }
        if (email.key === action.data.key) emailCopy.preferred = true
        return emailCopy
      })
    }
    if (action.setConfirmed) {
      return state.map((email) => {
        const emailCopy = { ...email }
        if (email.key === action.data.key) {
          emailCopy.confirmed = true
          if (action.setVisible) emailCopy.visible = action.data.visibleValue
        }
        return emailCopy
      })
    }
    if (action.setVisible) {
      return state.map((email) => {
        const emailCopy = { ...email }
        if (email.key === action.data.key) {
          emailCopy.visible = action.data.visibleValue
        }
        return emailCopy
      })
    }
    if (action.setVerificationToken) {
      return state.map((email) => {
        const emailCopy = { ...email }
        emailCopy.verificationToken =
          email.key === action.data.key ? action.data.verificationToken : ''
        return emailCopy
      })
    }

    return state
  }
  // eslint-disable-next-line max-len
  const [emails, setEmails] = useReducer(
    emailsReducer,
    profileEmails?.map((p) => ({ ...p, key: nanoid(), isValid: true })) ?? []
  )
  const { accessToken } = useUser()
  const [hasInstitutionEmail, setHasInstitutionEmail] = useState(
    emails.some((p) => p.confirmed && isInstitutionEmail(p.email, institutionDomains))
  )

  const handleAddEmail = () => {
    setEmails({
      addNewEmail: true,
      setVisible: true,
      data: { email: '', key: nanoid(), isValid: true, visibleValue: false },
    })
  }

  const handleUpdateEmail = (targetValue, key) => {
    const existingEmailObj = emails?.find((p) => p.key === key)
    if (targetValue === existingEmailObj?.email) return // nothing changed
    const isValid = isValidEmail(targetValue.toLowerCase())
    setEmails({
      updateEmail: true,
      setVisible: true,
      data: { ...existingEmailObj, key, email: targetValue, isValid, visibleValue: false },
    })
  }

  const handleRemoveEmail = (key) => {
    setEmails({ removeEmail: true, setVisible: true, data: { key, visibleValue: false } })
  }

  const handleMakeEmailPreferred = (key) => {
    setEmails({ setPreferred: true, data: { key } })
  }

  const handleConfirmEmail = async (key) => {
    const newEmail = emails?.find((p) => p.key === key)?.email?.toLowerCase()
    if (!newEmail) return promptError('Email is required')
    if (emails.filter((p) => p.email?.toLowerCase() === newEmail)?.length > 1)
      return promptError(`${newEmail} is already added to your profile`)
    if (profileId) {
      const linkData = { alternate: newEmail, username: profileId }
      try {
        if (isNewProfile) {
          await api.post(`/user/confirm/${router.query.token}`, linkData, { accessToken })
        } else {
          await api.post('/user/confirm', linkData, { accessToken })
        }
        setEmails({ setVisible: true, data: { key, visibleValue: true } })
        return promptMessage(
          `A confirmation email has been sent to ${newEmail} with confirmation instructions`
        )
      } catch (error) {
        setEmails({ setVisible: true, data: { key, visibleValue: false } })
        return promptError(error.message)
      }
    } else {
      return promptError('You need to save your profile before confirming a new email')
    }
  }

  const handleVerifyEmail = async (key) => {
    const newEmail = emails?.find((p) => p.key === key)?.email?.toLowerCase()
    const token = emails?.find((p) => p.key === key)?.verificationToken ?? ''
    const payload = { email: newEmail, token }
    try {
      if (isNewProfile) {
        await api.put(`/activatelink/${router.query.token}`, payload, { accessToken })
      } else {
        await api.put('/activatelink', payload, { accessToken })
      }
      setEmails({ setVisible: true, setConfirmed: true, data: { key, visibleValue: false } })
      if (isInstitutionEmail(newEmail, institutionDomains)) setHasInstitutionEmail(true)
      return promptMessage(`${newEmail} has been verified`)
    } catch (error) {
      return promptError(error.message)
    }
  }

  const handleVerificationTokenUpdate = (key, value) => {
    setEmails({ setVerificationToken: true, data: { key, verificationToken: value } })
  }

  useEffect(() => {
    updateEmails(emails)
  }, [emails])

  return (
    <div>
      {isNewProfile && !hasInstitutionEmail && (
        <div className="activation-message">
          <Icon name="warning-sign" />
          <p>
            Your profile does not contain any institution email and it can take up to 2 weeks
            for your profile to be activated. If you would like to activate your profile,
            please add an institutional email.
          </p>
        </div>
      )}
      <div className="container emails">
        {emails.map((emailObj) => (
          <div className="row d-flex" key={emailObj.key}>
            <div className="col-md-4 emails__value">
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input
                type="email"
                autoFocus
                value={emailObj.email}
                readOnly={emailObj.confirmed}
                className={`form-control email profile ${
                  emailObj.isValid ? undefined : 'invalid-value'
                }`}
                onChange={(e) => handleUpdateEmail(e.target.value.trim(), emailObj.key)}
              />
            </div>
            {emailObj.visible &&
              !emailObj.confirmed &&
              !emailObj.preferred &&
              emailObj.isValid && (
                <div className="col-md-2 emails__value">
                  <input
                    type="text"
                    onChange={(e) =>
                      handleVerificationTokenUpdate(emailObj.key, e.target.value)
                    }
                    placeholder="Enter Verification Token"
                    className={`form-control`}
                  />
                </div>
              )}
            {emailObj.visible &&
              !emailObj.confirmed &&
              !emailObj.preferred &&
              emailObj.isValid && (
                <div className="col-md-1 emails__value">
                  <EmailsButton
                    type="verify"
                    emailObj={emailObj}
                    handleVerify={() => handleVerifyEmail(emailObj.key)}
                  />
                </div>
              )}
            {!emailObj.visible && emailObj.isValid && (
              <div className="col-md-1 emails__value">
                <EmailsButton
                  type="confirmed"
                  emailObj={emailObj}
                  handleConfirm={() => handleConfirmEmail(emailObj.key)}
                  isNewProfile={isNewProfile}
                />
              </div>
            )}
            <div className="col-md-1 emails__value">
              {!emailObj.visible && emailObj.confirmed && emailObj.isValid && (
                <EmailsButton
                  type="preferred"
                  emailObj={emailObj}
                  handleMakePreferred={() => handleMakeEmailPreferred(emailObj.key)}
                />
              )}
              {!emailObj.confirmed && !emailObj.preferred && emailObj.isValid && (
                <EmailsButton
                  type="remove"
                  emailObj={emailObj}
                  handleRemove={() => handleRemoveEmail(emailObj.key)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div role="button" aria-label="add another email" tabIndex={0} onClick={handleAddEmail}>
        <Icon name="plus-sign" tooltip="add another email" />
      </div>
    </div>
  )
}

export default EmailsSection
