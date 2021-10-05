/* globals promptError,promptMessage,$: false */
import { useEffect, useReducer, useRef } from 'react'
import { nanoid } from 'nanoid'
import { isValidEmail } from '../../lib/utils'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import ProfileSectionHeader from './ProfileSectionHeader'
import Icon from '../Icon'

const EmailsButton = ({
  type, emailObj, handleRemove, handleConfirm, handleMakePreferred,
}) => {
  const {
    confirmed, preferred, email, isValid,
  } = emailObj

  if (type === 'confirmed') {
    if (confirmed) {
      return <div className="emails__confirmed-text hint">(Confirmed)</div>
    }
    if (email && isValid) {
      return <button type="button" className="btn confirm-button" onClick={handleConfirm}>Confirm</button>
    }
    return null
  }

  if (type === 'remove' && !confirmed && email && isValid) {
    return <button type="button" className="btn" onClick={handleRemove}>Remove</button>
  }

  if (type === 'preferred') {
    if (preferred) {
      return <div className="emails__preferred-text hint">(Preferred Email)</div>
    }
    if (confirmed) {
      return <button type="button" className="btn preferred-button" onClick={handleMakePreferred}>Make Preferred</button>
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
      return state.filter(p => p.key !== action.data.key)
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
  const [emails, setEmails] = useReducer(emailsReducer, profileEmails?.map(p => ({ ...p, key: nanoid(), isValid: true })) ?? [])
  const { accessToken } = useUser()
  const alreadyConfirmedError = useRef(null)

  const handleAddEmail = () => {
    setEmails({ addNewEmail: true, data: { email: '', key: nanoid(), isValid: true } })
  }

  const handleUpdateEmail = (targetValue, key) => {
    const existingEmailObj = emails?.find(p => p.key === key)
    if (targetValue === existingEmailObj?.email) return // nothing changed
    const isValid = isValidEmail(targetValue.toLowerCase())
    setEmails({ updateEmail: true, data: { ...existingEmailObj, email: targetValue, isValid } })
  }

  const handleRemoveEmail = (key) => {
    setEmails({ removeEmail: true, data: { key } })
  }

  const handleMakeEmailPreferred = (key) => {
    setEmails({ setPreferred: true, data: { key } })
  }

  const handleConfirmEmail = async (key) => {
    const newEmail = emails?.find(p => p.key === key)?.email?.toLowerCase()
    if (!newEmail) return promptError('Email is required')
    if (profileId) {
      const linkData = { alternate: newEmail, username: profileId }
      try {
        await api.post('/user/confirm', linkData, { accessToken })
        return promptMessage(`A confirmation email has been sent to ${newEmail}`)
      } catch (error) {
        if (error.message === 'AlreadyConfirmed') {
          alreadyConfirmedError.current = error.details
          return promptError(`Error: ${error.details.path} is already associated with another OpenReview profile,
          <a href="/profile?id=${error.details.value}" title="View profile" target="_blank" class="action-link">${error.details.value}</a>.
          To merge this profile with your account, please click here to submit a support request:
          <a href="#" title="View profile" target="_blank" class="action-link" data-toggle="modal" data-target="#feedback-modal">Merge Profiles</a>.
          `, { html: true })
        }
        return promptError(error.message)
      }
    } else {
      return promptError('You need to save your profile before confirming a new email')
    }
  }

  useEffect(() => {
    $('#feedback-modal').on('shown.bs.modal', (e) => {
      $('#feedback-modal').find('#feedback-from').val(alreadyConfirmedError.current?.user)
      $('#feedback-modal').find('#feedback-subject').val('Merge Profiles')
      $('#feedback-modal').find('#feedback-message').val(`Hi OpenReview Support,\n\nPlease merge the profiles with the following usernames:\n${alreadyConfirmedError.current?.value2}\n${alreadyConfirmedError.current?.value}\n\nThank you.`)
    })
    return () => {
      $('#feedback-modal').off('shown.bs.modal')
    }
  }, [])

  useEffect(() => {
    updateEmails(emails)
  }, [emails])

  return (
    <section>
      <ProfileSectionHeader type="emails" />
      <div className="container emails">
        {
          emails.map(emailObj => (
            <div className="row" key={emailObj.key}>
              <div className="col-md-4 emails__value">
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <input type="email" autoFocus value={emailObj.email} readOnly={emailObj.confirmed} className={`form-control email profile ${emailObj.isValid ? undefined : 'invalid-value'}`} onChange={e => handleUpdateEmail(e.target.value.trim(), emailObj.key)} />
              </div>
              <div className="col-md-1 emails__value">
                <EmailsButton type="confirmed" emailObj={emailObj} handleConfirm={() => handleConfirmEmail(emailObj.key)} />
              </div>
              <div className="col-md-1 emails__value">
                <EmailsButton type="preferred" emailObj={emailObj} handleMakePreferred={() => handleMakeEmailPreferred(emailObj.key)} />
                <EmailsButton type="remove" emailObj={emailObj} handleRemove={() => handleRemoveEmail(emailObj.key)} />
              </div>
            </div>
          ))
        }
      </div>
      <div role="button" aria-label="add another name" tabIndex={0} onClick={handleAddEmail}>
        <Icon name="plus-sign" tooltip="add another name" />
      </div>
    </section>
  )
}

export default EmailsSection
