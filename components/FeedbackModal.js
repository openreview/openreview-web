/* globals $: false */

import { useState, useContext, useRef, useReducer } from 'react'
import BasicModal from './BasicModal'
import UserContext from './UserContext'
import ErrorAlert from './ErrorAlert'
import api from '../lib/api-client'
import Dropdown from './Dropdown'

export default function FeedbackModal() {
  const [text, setText] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [error, setError] = useState(null)
  const { accessToken } = useContext(UserContext)
  const [formData, setFormData] = useReducer((state, action) => {
    if (action.type === 'reset') return {}
    return { ...state, [action.type]: action.payload }
  }, {})

  const missingToken = process.env.TURNSTILE_SITEKEY && !turnstileToken
  const fields = [
    {
      name: 'from',
      type: 'input',
      placeholder: 'Email',
      required: () => true,
      showIf: () => true,
    },
    {
      name: 'subject',
      type: 'input',
      placeholder: 'Subject',
      required: () => true,
      showIf: () => true,
    },
    {
      name: 'category',
      type: 'select',
      placeholder: 'My feedback is about...',
      required: () => true,
      showIf: () => true,
      options: [
        { label: 'My OpenReview profile', value: 'profile' },
        { label: 'A conference I submitted to', value: 'submission' },
        { label: 'A conference I organized', value: 'organization' },
        { label: 'My institution email is not recognized', value: 'institution' },
      ],
    },
    {
      name: 'profileId',
      type: 'input',
      placeholder: 'Profile ID',
      required: () => formData.category === 'profile',
      showIf: () => formData.category === 'profile',
    },
    {
      name: 'venueId',
      type: 'input',
      placeholder: 'Venue ID or Conference Name',
      required: () => false,
      showIf: () => formData.category === 'submission' || formData.category === 'organization',
    },
    {
      name: 'submissionId',
      type: 'input',
      placeholder: 'Submission ID',
      required: () => false,
      showIf: () => formData.category === 'submission',
    },
    {
      name: 'institutionDomain',
      type: 'input',
      placeholder: 'Email Domain of Your Institution',
      required: () => formData.category === 'institution',
      showIf: () => formData.category === 'institution',
    },
    {
      name: 'institutionUrl',
      type: 'input',
      placeholder: 'URL of Your Institution',
      required: () => formData.category === 'institution',
      showIf: () => formData.category === 'institution',
    },
    {
      name: 'message',
      type: 'textarea',
      placeholder: 'Message',
      required: () => true,
      showIf: () => true,
    },
  ]

  const resetForm = () => {
    setError(null)
    setText(null)
    setTurnstileToken(null)
    setFormData({ type: 'reset' })
  }

  const sendFeedback = async (e) => {
    if (e) e.preventDefault()
    setSubmitting(true)

    try {
      // requires from,subject and message
      if (fields.some((field) => field.required() && !formData[field.name])) {
        throw new Error('Please fill in all fields.')
      }
      const feedbackData = {
        from: formData.from.trim(),
        subject: formData.subject.trim(),
        token: turnstileToken,
      }

      switch (formData.category) {
        case 'profile':
          feedbackData.message = `Profile ID: ${formData.profileId}\n\n${formData.message}`
          break
        case 'submission':
          feedbackData.message = `Venue ID: ${formData.venueId}\nSubmission ID: ${formData.submissionId}\n\n${formData.message}`
          break
        case 'organization':
          feedbackData.message = `Venue ID: ${formData.venueId}\n\n${formData.message}`
          break
        case 'institution':
          feedbackData.message = `Institution Domain: ${formData.institutionDomain}\nInstitution URL: ${formData.institutionUrl}\n\n${formData.message}`
          break
        default:
          feedbackData.message = formData.message
      }

      await api.put('/feedback', feedbackData, { accessToken })
      setError(null)
      setText('Your feedback has been submitted. Thank you.')
      setTimeout(() => {
        $('#feedback-modal').modal('hide')
        setSubmitting(false)
      }, 2500)
    } catch (apiError) {
      setError({ message: apiError.message })
      setSubmitting(false)
    }
  }

  const renderField = (field) => {
    if (!field.showIf(formData)) return null
    switch (field.type) {
      case 'input':
        return (
          <input
            id={`feedback-${field.name}`}
            type="text"
            name={field.name}
            className="form-control"
            placeholder={field.placeholder}
            value={formData[field.name] ?? ''}
            onChange={(e) => setFormData({ type: field.name, payload: e.target.value })}
          />
        )
      case 'textarea':
        return (
          <textarea
            id={`feedback-${field.name}`}
            name={field.name}
            className="form-control feedback-input"
            rows="5"
            placeholder={field.placeholder}
            value={formData[field.name] ?? ''}
            onChange={(e) => setFormData({ type: field.name, payload: e.target.value })}
          />
        )
      case 'select':
        return (
          <Dropdown
            options={field.options}
            className="feedback-dropdown"
            placeholder={field.placeholder}
            value={field.options.find((p) => p.value === formData[field.name]) ?? null}
            onChange={(e) =>
              setFormData({ type: field.name, payload: e ? e.value : undefined })
            }
          />
        )
      default:
        return null
    }
  }

  return (
    <BasicModal
      id="feedback-modal"
      title="Send Feedback"
      primaryButtonText="Send"
      onPrimaryButtonClick={sendFeedback}
      primaryButtonDisabled={submitting || missingToken}
      onClose={resetForm}
      onOpen={() => {
        if (!process.env.TURNSTILE_SITEKEY) return

        if (window.turnstile) {
          window.turnstile.render('#turnstile-feedback', {
            sitekey: process.env.TURNSTILE_SITEKEY,
            action: 'feedback',
            callback: (token) => {
              setTurnstileToken(token)
            },
          })
        } else {
          setError({
            message:
              'Could not verify browser. Please make sure third-party scripts are not being blocked and try again.',
          })
        }
      }}
    >
      {text ? (
        <p>{text}</p>
      ) : (
        <p>
          <span>
            Enter your feedback below and we&apos;ll get back to you as soon as possible. To
            submit a bug report or feature request, you can use the official OpenReview GitHub
            repository:
          </span>
          <br />
          <a
            href="https://github.com/openreview/openreview/issues/new/choose"
            target="_blank"
            rel="noreferrer"
          >
            Report an issue
          </a>
        </p>
      )}

      {error && <ErrorAlert error={error} />}

      <form onSubmit={sendFeedback}>
        {fields.map((field) => (
          <div className="form-group" key={field.name}>
            {renderField(field)}
          </div>
        ))}
      </form>
      {process.env.TURNSTILE_SITEKEY && <div id="turnstile-feedback"></div>}
    </BasicModal>
  )
}
