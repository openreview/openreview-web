/* globals promptError,promptMessage: false */
import { useEffect, useReducer } from 'react'
import { nanoid } from 'nanoid'
import { isValidEmail } from '../../lib/utils'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'

const EmailsButton = ({
  type, emailObj, handleRemove, handleConfirm, handleMakePreferred,
}) => {
  const {
    confirmed, preferred, email, isValid,
  } = emailObj

  if (type === 'confirmed') {
    if (confirmed) {
      return <div className="confirmed hint">(Confirmed)</div>
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
      return <div className="preferred hint">(Preferred Email)</div>
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
  const [emails, setEmails] = useReducer(emailsReducer, profileEmails?.map(p => ({ ...p, key: nanoid(), isValid: true })))
  const { accessToken } = useUser()

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
    <section>
      <h4>Emails</h4>
      <p className="instructions">
        Enter all email addresses associated with your current and historical institutional affiliations,
        your previous publications, and any other related systems, such as TPMS, CMT, and ArXiv.
        {' '}
        <strong>
          Email addresses associated with your old affiliations
          (including previous employers) should not be deleted.
        </strong>
        {' '}
        This information is crucial for deduplicating users and ensuring that you see your reviewing assignments.
        OpenReview will only send messages to the address marked as “Preferred”.
      </p>
      <table className="emails-table">
        <tbody>
          {emails.map(emailObj => (
            <tr key={emailObj.key}>
              <td>
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <input type="email" autoFocus value={emailObj.email} readOnly={emailObj.confirmed} className={`form-control email profile ${emailObj.isValid ? undefined : 'invalid-value'}`} onChange={e => handleUpdateEmail(e.target.value.trim(), emailObj.key)} />
              </td>
              <EmailsButton type="confirmed" emailObj={emailObj} handleConfirm={() => handleConfirmEmail(emailObj.key)} />
              <EmailsButton type="preferred" emailObj={emailObj} handleMakePreferred={() => handleMakeEmailPreferred(emailObj.key)} />
              <td><EmailsButton type="remove" emailObj={emailObj} handleRemove={() => handleRemoveEmail(emailObj.key)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="container emails">
        {
          emails.map(emailObj => (
            <div className="row">
              <div className="col-md-4 emails__value">
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <input type="email" autoFocus value={emailObj.email} readOnly={emailObj.confirmed} className={`form-control email profile ${emailObj.isValid ? undefined : 'invalid-value'}`} onChange={e => handleUpdateEmail(e.target.value.trim(), emailObj.key)} />
              </div>
              <div className="col-md-2 emails__value">
                <EmailsButton type="confirmed" emailObj={emailObj} handleConfirm={() => handleConfirmEmail(emailObj.key)} />
                <EmailsButton type="preferred" emailObj={emailObj} handleMakePreferred={() => handleMakeEmailPreferred(emailObj.key)} />
              </div>
              <div className="col-md-2 emails__value">
                <EmailsButton type="remove" emailObj={emailObj} handleRemove={() => handleRemoveEmail(emailObj.key)} />
              </div>
            </div>
          ))
        }
      </div>
      <div className="glyphicon glyphicon-plus-sign" role="button" aria-label="add another name" tabIndex={0} onClick={handleAddEmail} />
    </section>
  )
}

export default EmailsSection
