// eslint-disable-next-line object-curly-newline
import { useReducer, useEffect, useState, useContext } from 'react'
import SimpleModal from './SimpleModal'
import api from '../lib/api-client'
import UserContext from './UserContext'
import ErrorAlert from './ErrorAlert'

// eslint-disable-next-line arrow-body-style
const FeedbackModal = ({ displayFlag, cancelClickHandler }) => {
  // eslint-disable-next-line no-use-before-define
  const [feedbackInfo, dispatch] = useReducer(feedbackInfoReducer, {
    from: '',
    subject: '',
    message: '',
    text: "Enter your feedback below and we'll get back to you as soon as possible",
  })
  const [disableSendButton, setDisableSendButton] = useState(true)
  const [apiError, setApiError] = useState(null)
  const { accessToken } = useContext(UserContext)

  useEffect(() => {
    if (feedbackInfo.from && feedbackInfo.subject && feedbackInfo.message) setDisableSendButton(false)
  }, [feedbackInfo])

  function feedbackInfoReducer(state, action) {
    switch (action.source) {
      case 'from':
        return { ...state, from: action.value }
      case 'subject':
        return { ...state, subject: action.value }
      case 'message':
        return { ...state, message: action.value }
      case 'reset':
        // eslint-disable-next-line object-curly-newline
        return { from: '', subject: '', message: '', text: "Enter your feedback below and we'll get back to you as soon as possible" }
      case 'error':
        return { ...state, text: '' }
      case 'successful':
        // eslint-disable-next-line object-curly-newline
        return { from: '', subject: '', message: '', text: 'Feedback successfully submitted' }
      default: return state
    }
  }

  const sendFeedback = async () => {
    try {
      const result = await api.put('/feedback', { ...feedbackInfo }, { accessToken })
      dispatch({ source: 'successful' })
      setTimeout(() => {
        dispatch({ source: 'reset' })
        // eslint-disable-next-line no-use-before-define
        closeModal()
      }, 2000)
    } catch (error) {
      setApiError(error)
      dispatch({ source: 'error' })
    }
  }

  const closeModal = () => {
    dispatch({ source: 'reset' })
    setApiError(null)
    setDisableSendButton(true)
    cancelClickHandler()
  }

  return (
    <>
      <SimpleModal
        text={feedbackInfo.text}
        title="Send Feedback"
        displayFlag={displayFlag}
        firstButtonText="Cancel"
        secondButtonText="Send"
        firstButtonClick={closeModal}
        secondButtonClick={sendFeedback}
        disableSecondButton={disableSendButton}
      >
        {apiError && <ErrorAlert error={apiError} />}
        <div className="form-group">
          <input type="email" name="from" className="form-control" placeholder="Email" value={feedbackInfo.from} onChange={e => dispatch({ source: 'from', value: e.target.value })} />
        </div>
        <div className="form-group">
          <input type="text" name="subject" className="form-control" placeholder="Subject" value={feedbackInfo.subject} onChange={e => dispatch({ source: 'subject', value: e.target.value })} />
        </div>
        <div className="form-group">
          <textarea name="message" className="form-control feedback-input" rows="5" placeholder="Message" required="" value={feedbackInfo.message} onChange={e => dispatch({ source: 'message', value: e.target.value })} />
        </div>
      </SimpleModal>
    </>
  )
}

export default FeedbackModal
