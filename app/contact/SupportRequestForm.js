'use client'

import { Alert, AutoComplete, Button, Flex, Input } from 'antd'
import { useEffect, useReducer, useState } from 'react'
import useTurnstileToken from '../../hooks/useTurnstileToken'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'

const profileSubject = 'I have a question about my existing OpenReview profile'
const submissionSubject = 'A conference I submitted to'
const organizationSubject = 'A conference I organized'
const committeeSubject = 'I am a reviewer or committee member'
const createProfileSubject = 'I am trying to create my profile'
const profileRejectedSubject =
  'I am unable to provide the information requested to activate my profile'
const accessPublicationSubject = 'I am trying to access a publication'

const subjectOptions = [
  profileSubject,
  submissionSubject,
  organizationSubject,
  committeeSubject,
  createProfileSubject,
  profileRejectedSubject,
  accessPublicationSubject,
].map((subject) => ({ value: subject }))

export default function SupportRequestForm({ prefill }) {
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useReducer((state, action) => {
    setError(null)
    if (action.type === 'reset') return {}
    if (action.type === 'prefill') return { ...state, ...action.payload }
    return { ...state, [action.type]: action.payload }
  }, {})
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken('feedback')
  const { user, isRefreshing } = useUser(true)

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
      showIf: () =>
        formData.subject === profileSubject || formData.subject === profileRejectedSubject,
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
      name: 'message',
      type: 'textarea',
      placeholder: 'Message',
      required: () => true,
      showIf: () => true,
    },
  ]

  const sendFeedback = async () => {
    setSubmitting(true)

    try {
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
        case profileRejectedSubject:
          feedbackData.message = formData.profileId
            ? `Profile ID: ${formData.profileId}\n\n${formData.message}`
            : formData.message
          feedbackData.subject = formData.profileId
            ? `${cleanSubject} - ${formData.profileId}`
            : cleanSubject
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

      await api.put('/feedback', feedbackData)
      setError(null)
      setSubmitting(false)
      setFormData({ type: 'reset' })
      promptMessage('Your feedback has been submitted. Thank you.')
    } catch (apiError) {
      setError(apiError.message)
      setSubmitting(false)
    }
  }

  const renderField = (field) => {
    if (!field.showIf()) return null
    switch (field.type) {
      case 'input':
        return (
          <Input
            id={`feedback-${field.name}`}
            placeholder={field.placeholder}
            aria-label={field.placeholder}
            value={formData[field.name] ?? ''}
            onChange={(e) => setFormData({ type: field.name, payload: e.target.value })}
          />
        )
      case 'textarea':
        return (
          <Input.TextArea
            id={`feedback-${field.name}`}
            rows={5}
            placeholder={field.placeholder}
            aria-label={field.placeholder}
            value={formData[field.name] ?? ''}
            onChange={(e) => setFormData({ type: field.name, payload: e.target.value })}
          />
        )
      case 'select':
        return (
          <AutoComplete
            id={`feedback-${field.name}`}
            options={field.options}
            value={formData[field.name] ?? ''}
            onChange={(value) => setFormData({ type: field.name, payload: value })}
            allowClear
            style={{ width: '100%' }}
            filterOption={(input, option) =>
              option.value.toLowerCase().includes(input.toLowerCase())
            }
          >
            <Input placeholder={field.placeholder} aria-label={field.placeholder} />
          </AutoComplete>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    if (isRefreshing || !user) return
    setFormData({
      type: 'prefill',
      payload: {
        from: user.profile.preferredEmail,
      },
    })
  }, [isRefreshing])

  useEffect(() => {
    if (!prefill) return
    setFormData({ type: 'prefill', payload: prefill })
  }, [prefill])

  return (
    <Flex vertical gap={12} style={{ maxWidth: 640 }}>
      {error && <Alert type="error" showIcon message={error} />}
      {fields.map((field) => (
        <div key={field.name}>{renderField(field)}</div>
      ))}
      <div ref={turnstileContainerRef} />
      <Button
        type="primary"
        loading={submitting}
        disabled={!turnstileToken || submitting || error}
        style={{ alignSelf: 'flex-start' }}
        onClick={sendFeedback}
      >
        Send
      </Button>
    </Flex>
  )
}
