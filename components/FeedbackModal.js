/* globals $: false */

import { useState, useContext, useRef } from 'react'
import BasicModal from './BasicModal'
import UserContext from './UserContext'
import ErrorAlert from './ErrorAlert'
import api from '../lib/api-client'

export default function FeedbackModal() {
  const defaultText = 'Enter your feedback below and we\'ll get back to you as soon as possible.'
  const [text, setText] = useState(defaultText)
  const [error, setError] = useState(null)
  const formRef = useRef(null)
  const { accessToken } = useContext(UserContext)

  const resetForm = () => {
    setError(null)
    setText(defaultText)
    formRef.current.reset()
  }

  const sendFeedback = async (bodyData) => {
    try {
      const result = await api.put('/feedback', bodyData, { accessToken })
      setError(null)
      setText('Your feedback has been submitted. Thank you.')
      setTimeout(() => {
        $('#feedback-modal').modal('hide')
      }, 2500)
    } catch (apiError) {
      setError(apiError)
    }
  }

  const submitForm = (e) => {
    if (e) e.preventDefault()
    const formData = new FormData(formRef.current)
    const bodyData = {}
    formData.forEach((value, name) => {
      bodyData[name] = value.trim()
    })
    sendFeedback(bodyData)
  }

  return (
    <BasicModal
      id="feedback-modal"
      title="Send Feedback"
      primaryButtonText="Send"
      onPrimaryButtonClick={submitForm}
      onClose={resetForm}
    >
      <p>{text}</p>
      <form onSubmit={submitForm} ref={formRef}>
        {error && (
          <ErrorAlert error={error} />
        )}

        <div className="form-group">
          <input type="email" name="from" className="form-control" placeholder="Email" required />
        </div>
        <div className="form-group">
          <input type="text" name="subject" className="form-control" placeholder="Subject" />
        </div>
        <div className="form-group">
          <textarea name="message" className="form-control feedback-input" rows="5" placeholder="Message" required />
        </div>
      </form>
    </BasicModal>
  )
}
