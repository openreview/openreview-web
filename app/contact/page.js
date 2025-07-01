'use client'

/* globals promptMessage: false */
import Link from 'next/link'
import { useEffect, useReducer, useState } from 'react'
import useTurnstileToken from '../../hooks/useTurnstileToken'
import useUser from '../../hooks/useUser'
import { ClearButton } from '../../components/IconButton'
import { CreatableDropdown } from '../../components/Dropdown'
import SpinnerButton from '../../components/SpinnerButton'
import ErrorAlert from '../../components/ErrorAlert'
import api from '../../lib/api-client'

import styles from './Contact.module.scss'

export default function Page() {
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useReducer((state, action) => {
    setError(null)
    if (action.type === 'reset') return {}
    if (action.type === 'prefill') return action.payload
    return { ...state, [action.type]: action.payload }
  }, {})
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken('feedback')
  const { accessToken } = useUser()

  const profileSubject = 'My OpenReview profile'
  const submissionSubject = 'A conference I submitted to'
  const organizationSubject = 'A conference I organized'
  const committeeSubject = 'I am a reviewer or committee member'
  const createProfileSubject = 'I am trying to create my profile'
  const accessPublicationSubject = 'I am trying to access a publication'
  const institutionSubject = 'Please add my domain to your list of publishing institutions'
  const subjectOptions = [
    profileSubject,
    submissionSubject,
    organizationSubject,
    committeeSubject,
    createProfileSubject,
    accessPublicationSubject,
    institutionSubject,
  ].map((subject) => ({
    label: subject,
    value: subject,
  }))

  const fields = [
    {
      name: 'from',
      type: 'input',
      placeholder: 'Your email address',
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
      required: () =>
        formData.subject === submissionSubject ||
        formData.subject === organizationSubject ||
        formData.subject === committeeSubject,
      showIf: () =>
        formData.subject === submissionSubject ||
        formData.subject === organizationSubject ||
        formData.subject === committeeSubject,
    },
    {
      name: 'submissionId',
      type: 'input',
      placeholder: 'Submission ID',
      required: () => false,
      showIf: () =>
        formData.subject === submissionSubject ||
        formData.subject === accessPublicationSubject,
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
        case committeeSubject:
          feedbackData.message = `Venue ID: ${formData.venueId}\n\n${formData.message}`
          feedbackData.subject = `Venue - ${formData.venueId}`

          break
        case institutionSubject:
          feedbackData.message = `Institution Domain: ${formData.institutionDomain}\nInstitution Fullname: ${formData.institutionName}\nInstitution URL: ${formData.institutionUrl}\n\n${formData.message}`
          feedbackData.subject = `${cleanSubject} - ${formData.institutionDomain}`
          break
        case createProfileSubject:
          feedbackData.message = `${formData.message}`
          feedbackData.subject = cleanSubject
          break
        case accessPublicationSubject:
          feedbackData.message = `Submission ID: ${formData.submissionId}\n\n${formData.message}`
          feedbackData.subject = formData.submissionId
            ? `Access Publication - ${formData.submissionId}`
            : cleanSubject
          break
        default:
          feedbackData.message = formData.message
          feedbackData.subject = cleanSubject
      }

      await api.put('/feedback', feedbackData, { accessToken })
      setError(null)
      setSubmitting(false)
      setFormData({ type: 'reset' })
      promptMessage('Your feedback has been submitted. Thank you.')
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

  useEffect(() => {
    try {
      const userEmail = sessionStorage.getItem('feedbackInstitution')
      if (userEmail) {
        setFormData({
          type: 'prefill',
          payload: {
            from: userEmail,
            subject: 'Please add my domain to your list of publishing institutions',
          },
        })
        sessionStorage.removeItem('feedbackInstitution')
      }
    } catch (e) {
      /* empty */
    }
  }, [])

  return (
    <div className={styles.contactContainer}>
      <div>
        <h1>Contact Us</h1>
        <p className="mt-3">
          OpenReview currently supports numerous computer science conferences and workshops,
          and we are open to hosting journals and conferences in any field; please fill out the{' '}
          <Link href="/group?id=OpenReview.net/Support">venue request form</Link> to get
          started.
        </p>
        <p>
          If you would like to report a bug or suggest features to the developers please use
          the OpenReview documentation repository on GitHub:
          <br />
          <a
            href="https://github.com/openreview/openreview/issues/new/choose"
            target="_blank"
            rel="noreferrer"
          >
            Report an issue
          </a>
          .
        </p>
        <p>For other queries you can contact OpenReview support using the form below:</p>
      </div>
      <div className="d-flex">
        {error && <ErrorAlert error={error} />}
        <div>
          <form className={styles.feedbackForm}>
            {fields.map((field) => (
              <div className="form-group" key={field.name}>
                {renderField(field)}
              </div>
            ))}
          </form>
          <div ref={turnstileContainerRef} />
          <SpinnerButton
            type="primary"
            onClick={sendFeedback}
            loading={submitting}
            disabled={!turnstileToken || submitting || error}
            className="mt-2"
          >
            Send
          </SpinnerButton>
        </div>
      </div>
    </div>
  )
}
