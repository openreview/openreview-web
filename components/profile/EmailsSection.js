/* globals promptError,promptMessage,$: false */

import { useEffect, useReducer, useRef, useState } from 'react'
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
  const { confirmed, preferred, email, isValid, visible} = emailObj

  if (type === 'confirmed') {
    // if (isNewProfile) return null

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
  const [verificationToken, setVerificationToken] = useState('')
  const router = useRouter()

  const emailsReducer = (state, action) => {
    if (action.addNewEmail) return [...state, action.data]
    if (action.updateEmail) {
      return state.map((email) => {
        let emailCopy = { ...email }
        if (email.key === action.data.key) emailCopy = action.data
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
    if (action.setVisible) {
      return state.map((email) => {
        const emailCopy = { ...email }
        if (email.key === action.data.key) emailCopy.visible = action.data.visibleValue
        return emailCopy
      })
    }
    if (action.setVerified) {
      return state.map((email) => {
        const emailCopy = { ...email }
        if (email.key === action.data.key) emailCopy.verified = action.setVerified
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
  const hasInstitutionEmail = emails.some(
    (p) => p.confirmed && isInstitutionEmail(p.email, institutionDomains)
  )

  const handleAddEmail = () => {
    setEmails({ addNewEmail: true, data: { email: '', key: nanoid(), isValid: true } })
  }

  const handleUpdateEmail = (targetValue, key) => {
    const existingEmailObj = emails?.find((p) => p.key === key)
    if (targetValue === existingEmailObj?.email) return // nothing changed
    const isValid = isValidEmail(targetValue.toLowerCase())
    setEmails({
      updateEmail: true,
      data: { ...existingEmailObj, email: targetValue, isValid },
    })
  }

  const handleRemoveEmail = (key) => {
    setEmails({ removeEmail: true, data: { key } })
    setEmails({ setVisible: true, data: { key, visibleValue: false } })
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
        setEmails({ setVisible: true, data: { key, visibleValue: true} })
        return promptMessage(`A confirmation email has been sent to ${newEmail} with a verification token/link`)
      } catch (error) {
        setEmails({ setVisible: true, data: { key, visibleValue: false} })
        return promptError(error.message)
      }
    } else {
      return promptError('You need to save your profile before confirming a new email')
    }
  }

  const handleVerifyEmail = async (key) => {
    const newEmail = emails?.find((p) => p.key === key)?.email?.toLowerCase()
    const payload = { email: newEmail, token: verificationToken }
    try {
      if (isNewProfile) {
        await api.put(`/activatelink/${router.query.token}`, payload, {accessToken})
      } else {
        await api.put('/activatelink', payload, {accessToken})
      }
      setEmails({ setVisible: true, data: { key, visibleValue: false} })
      setEmails({ setVerified: true, data: { key }})
      return promptMessage(`${newEmail} has been verified`)
    } catch (error) {
      return promptError(error.message)
    }

  }

  const handleVerificationTokenUpdate = (event) => {
    setVerificationToken(event.target.value)
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
            for your profile to be activated.
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
            { emailObj.visible && !emailObj.confirmed && !emailObj.preferred && (
              <div className='col-md-2 emails__value'>
                  <input
                  type='text'
                  onChange={handleVerificationTokenUpdate}
                  placeholder='Enter Verification Token'
                  className={`form-control`}
                />
              </div>
            )}
            { emailObj.visible &&
              <div className='col-md-1 emails__value'>
                  <EmailsButton
                    type="verify"
                    emailObj={emailObj}
                    handleVerify={() => handleVerifyEmail(emailObj.key)}
                    handleVerifyTokenChange={handleVerificationTokenUpdate}
                  />
              </div>
            }
            { !(emailObj.verified && !emailObj.confirmed) && !emailObj.visible  &&
              <div className="col-md-1 emails__value">
                <EmailsButton
                  type="confirmed"
                  emailObj={emailObj}
                  handleConfirm={() => handleConfirmEmail(emailObj.key)}
                  isNewProfile={isNewProfile}
                />
             </div>
            }
            <div className="col-md-1 emails__value">
              <EmailsButton
                type="preferred"
                emailObj={emailObj}
                handleMakePreferred={() => handleMakeEmailPreferred(emailObj.key)}
              />
              { !(emailObj.verified && !emailObj.confirmed) &&
                <EmailsButton
                  type="remove"
                  emailObj={emailObj}
                  handleRemove={() => handleRemoveEmail(emailObj.key)}
                />
              }
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
