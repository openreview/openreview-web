/* globals $: false */

import { useContext, useReducer } from 'react'
import BasicModal from './BasicModal'
import UserContext from './UserContext'
import ErrorAlert from './ErrorAlert'
import api from '../lib/api-client'

export default function FeedbackModal() {
  const defaultState = {
    text: 'Enter your feedback below and we\'ll get back to you as soon as possible.',
    error: null,
    email: '',
    subject: '',
    message: '',
  }

  // eslint-disable-next-line no-shadow
  const feedbackModalStateReducer = (state, action) => {
    switch (action.type) {
      case 'text':
        return { ...state, text: action.payload }
      case 'error':
        return { ...state, error: action.payload }
      case 'email':
        return { ...state, email: action.payload }
      case 'subject':
        return { ...state, subject: action.payload }
      case 'message':
        return { ...state, message: action.payload }
      case 'reset':
        return { ...defaultState }
      default:
        return state
    }
  }

  const [state, dispatch] = useReducer(feedbackModalStateReducer, defaultState)
  const { accessToken } = useContext(UserContext)

  const resetForm = () => {
    dispatch({ type: 'reset' })
  }

  const sendFeedback = async (bodyData) => {
    try {
      const result = await api.put('/feedback', bodyData, { accessToken })
      dispatch({ type: 'error', payload: null })
      dispatch({ type: 'text', payload: 'Your feedback has been submitted. Thank you.' })
      setTimeout(() => {
        $('#feedback-modal').modal('hide')
      }, 2500)
    } catch (apiError) {
      dispatch({ type: 'error', payload: { message: apiError.message } })
    }
  }

  const submitForm = () => {
    sendFeedback({ from: state.email, subject: state.subject, message: state.message })
  }

  return (
    <BasicModal
      id="feedback-modal"
      title="Send Feedback"
      primaryButtonText="Send"
      onPrimaryButtonClick={submitForm}
      onClose={resetForm}
    >
      <p>{state.text}</p>
      {state.error && (
        <ErrorAlert error={state.error} />
      )}

      <form>
        <div className="form-group">
          <input type="email" name="from" className="form-control" placeholder="Email" required value={state.email} onChange={e => dispatch({ type: 'email', payload: e.target.value })} />
        </div>
        <div className="form-group">
          <input type="text" name="subject" className="form-control" placeholder="Subject" required value={state.subject} onChange={e => dispatch({ type: 'subject', payload: e.target.value })} />
        </div>
        <div className="form-group">
          <textarea name="message" className="form-control feedback-input" rows="5" placeholder="Message" required value={state.message} onChange={e => dispatch({ type: 'message', payload: e.target.value })} />
        </div>
      </form>
    </BasicModal>
  )
}
