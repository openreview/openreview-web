/* globals promptError,promptMessage,$: false */

import { useEffect, useReducer, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import Icon from '../Icon'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { isValidEmail } from '../../lib/utils'
import ProfileMergeModal from '../ProfileMergeModal'

const EmailsButton = ({
  type,
  emailObj,
  handleRemove,
  handleConfirm,
  handleMakePreferred,
}) => {
  const { confirmed, preferred, email, isValid } = emailObj

  if (type === 'confirmed') {
    if (confirmed) {
      return <div className="emails__confirmed-text hint">(Confirmed)</div>
    }
    if (email && isValid) {
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
  return null
}

const EmailsSection = ({ profileEmails, profileId, updateEmails }) => {
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
    return state
  }
  // eslint-disable-next-line max-len
  const [emails, setEmails] = useReducer(
    emailsReducer,
    profileEmails?.map((p) => ({ ...p, key: nanoid(), isValid: true })) ?? []
  )
  const { accessToken } = useUser()
  const [alreadyConfirmedError, setAlreadyConfirmedError] = useState(null)

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
  }

  const handleMakeEmailPreferred = (key) => {
    setEmails({ setPreferred: true, data: { key } })
  }

  const handleConfirmEmail = async (key) => {
    const newEmail = emails?.find((p) => p.key === key)?.email?.toLowerCase()
    if (!newEmail) return promptError('Email is required')
    if (profileId) {
      const linkData = { alternate: newEmail, username: profileId }
      try {
        await api.post('/user/confirm', linkData, { accessToken })
        return promptMessage(`A confirmation email has been sent to ${newEmail}`)
      } catch (error) {
        if (error.message.includes('confirmed')) {
          setAlreadyConfirmedError(error.details)
          return promptError(
            `Error: ${error.details.alternate} is already associated with another OpenReview profile,
          <a href="/profile?id=${error.details.otherProfile}" title="View profile" target="_blank" class="action-link">${error.details.otherProfile}</a>.
          To merge this profile with your account, please click here to submit a profile merge request:
          <a href="#" title="View profile" target="_blank" class="action-link" data-toggle="modal" data-target="#profile-merge-modal">Merge Profiles</a>.
          `,
            { html: true }
          )
        }
        return promptError(error.message)
      }
    } else {
      return promptError('You need to save your profile before confirming a new email')
    }
  }

  useEffect(() => {
    updateEmails(emails)
  }, [emails])

  return (
    <div>
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
            <div className="col-md-1 emails__value">
              <EmailsButton
                type="confirmed"
                emailObj={emailObj}
                handleConfirm={() => handleConfirmEmail(emailObj.key)}
              />
            </div>
            <div className="col-md-1 emails__value">
              <EmailsButton
                type="preferred"
                emailObj={emailObj}
                handleMakePreferred={() => handleMakeEmailPreferred(emailObj.key)}
              />
              <EmailsButton
                type="remove"
                emailObj={emailObj}
                handleRemove={() => handleRemoveEmail(emailObj.key)}
              />
            </div>
          </div>
        ))}
      </div>

      <div role="button" aria-label="add another email" tabIndex={0} onClick={handleAddEmail}>
        <Icon name="plus-sign" tooltip="add another email" />
      </div>

      <ProfileMergeModal
        preFillProfileMergeInfo={{
          email: alreadyConfirmedError?.user,
          idsToMerge: `${alreadyConfirmedError?.thisProfile},${alreadyConfirmedError?.otherProfile}`,
          comment: '',
        }}
      />
    </div>
  )
}

export default EmailsSection
