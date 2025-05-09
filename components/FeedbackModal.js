/* globals $: false */

import { useState, useContext, useReducer } from 'react'
import BasicModal from './BasicModal'
import ErrorAlert from './ErrorAlert'
import api from '../lib/api-client'
import { CreatableDropdown } from './Dropdown'
import { ClearButton } from './IconButton'
import useTurnstileToken from '../hooks/useTurnstileToken'
import useUser from '../hooks/useUser'

export default function FeedbackModal({ modalId }) {
  const [text, setText] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const { accessToken } = useUser()
  const [formData, setFormData] = useReducer((state, action) => {
    if (action.type === 'reset') return {}
    if (action.type === 'prefill') return action.payload
    return { ...state, [action.type]: action.payload }
  }, {})
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken('feedback', isOpen)

  const profileSubject = 'My OpenReview profile'
  const submissionSubject = 'A conference I submitted to'
  const organizationSubject = 'A conference I organized'
  const institutionSubject = 'Please add my domain to your list of publishing institutions'
  const subjectOptions = [
    profileSubject,
    submissionSubject,
    organizationSubject,
    institutionSubject,
  ].map((subject) => ({
    label: subject,
    value: subject,
  }))

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
      type: 'select',
      placeholder: 'Select a topic or type what you need help with',
      required: () => true,
      showIf: () => true,
      options: subjectOptions,
    },
    {
      name: 'profileId',
      type: 'input',
      placeholder: 'Profile ID',
      required: () => formData.subject === profileSubject,
      showIf: () => formData.subject === profileSubject,
    },
    {
      name: 'venueId',
      type: 'input',
      placeholder: 'Venue ID or Conference Name',
      required: () => false,
      showIf: () =>
        formData.subject === submissionSubject || formData.subject === organizationSubject,
    },
    {
      name: 'submissionId',
      type: 'input',
      placeholder: 'Submission ID',
      required: () => false,
      showIf: () => formData.subject === submissionSubject,
    },
    {
      name: 'institutionDomain',
      type: 'input',
      placeholder: 'Email Domain of Your Institution',
      required: () => formData.subject === institutionSubject,
      showIf: () => formData.subject === institutionSubject,
    },
    {
      name: 'institutionName',
      type: 'input',
      placeholder: 'Full Name of Your Institution',
      required: () => formData.subject === institutionSubject,
      showIf: () => formData.subject === institutionSubject,
    },
    {
      name: 'institutionUrl',
      type: 'input',
      placeholder: 'Official Website URL of Your Institution',
      required: () => formData.subject === institutionSubject,
      showIf: () => formData.subject === institutionSubject,
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
    setIsOpen(false)
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
        token: turnstileToken,
      }

      const cleanSubject = formData.subject.trim()

      switch (formData.subject) {
        case profileSubject:
          feedbackData.message = `Profile ID: ${formData.profileId}\n\n${formData.message}`
          feedbackData.subject = `${cleanSubject} - ${formData.profileId}`
          break
        case submissionSubject:
          feedbackData.message = `Venue ID: ${formData.venueId}\nSubmission ID: ${formData.submissionId}\n\n${formData.message}`
          feedbackData.subject = formData.submissionId
            ? `Submission - ${formData.submissionId}`
            : cleanSubject

          break
        case organizationSubject:
          feedbackData.message = `Venue ID: ${formData.venueId}\n\n${formData.message}`
          feedbackData.subject = formData.venueId
            ? `Venue - ${formData.venueId}`
            : cleanSubject
          break
        case institutionSubject:
          feedbackData.message = `Institution Domain: ${formData.institutionDomain}\nInstitution Fullname: ${formData.institutionName}\nInstitution URL: ${formData.institutionUrl}\n\n${formData.message}`
          feedbackData.subject = `${cleanSubject} - ${formData.institutionDomain}`
          break
        default:
          feedbackData.message = formData.message
          feedbackData.subject = cleanSubject
      }

      await api.put('/feedback', feedbackData, { accessToken })
      setError(null)
      setText('Your feedback has been submitted. Thank you.')
      setTimeout(() => {
        setIsOpen(false)
        $(`#${modalId}`).modal('hide')
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
        return formData[field.name]?.length > 0 ? (
          <div className="clearable-input">
            <input
              type="text"
              className="form-control"
              value={formData[field.name] ?? ''}
              onChange={(e) => {
                setFormData({ type: field.name, payload: e.target.value })
              }}
            />
            <ClearButton
              onClick={(e) => {
                setFormData({ type: field.name, payload: '' })
              }}
            />
          </div>
        ) : (
          <CreatableDropdown
            instanceId={`feedback-${field.name}`}
            options={field.options}
            classNamePrefix="feedback-dropdown"
            placeholder={field.placeholder}
            value={field.options.find((p) => p.value === formData[field.name]) ?? null}
            onChange={(e) =>
              setFormData({ type: field.name, payload: e ? e.value : undefined })
            }
            onBlur={(e) => {
              if (e.target.value) {
                setFormData({ type: field.name, payload: e.target.value })
              }
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <BasicModal
      id={modalId}
      title="Send Feedback"
      primaryButtonText="Send"
      onPrimaryButtonClick={sendFeedback}
      primaryButtonDisabled={submitting || !turnstileToken}
      onClose={resetForm}
      onOpen={(e) => {
        setIsOpen(true)
        if (e) {
          const from = e.getAttribute('data-from')
          const subject = e.getAttribute('data-subject')
          setFormData({ type: 'prefill', payload: { from, subject } })
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
      <div ref={turnstileContainerRef} />
    </BasicModal>
  )
}
