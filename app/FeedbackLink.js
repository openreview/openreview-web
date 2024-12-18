'use client'

import FeedbackModal from '../components/FeedbackModal'

export default function FeedbackLink() {
  const onFeedbackLinkClick = (e) => {
    e.preventDefault()
    $('#feedback-modal').modal('show')
  }

  return (
    <>
      <a href="#" onClick={onFeedbackLinkClick}>
        Feedback
      </a>
      <FeedbackModal />
    </>
  )
}
