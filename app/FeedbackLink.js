'use client'

/* globals $: false */
import { useEffect, useState } from 'react'
import FeedbackModal from '../components/FeedbackModal'

export default function FeedbackLink() {
  const [showFeedbackLink, setShowFeedbackLink] = useState(false)
  const onFeedbackLinkClick = (e) => {
    e.preventDefault()
    $('#feedback-modal').modal('show')
  }

  useEffect(() => {
    setShowFeedbackLink(true)
  }, [])

  if (!showFeedbackLink) return null

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a href="#" onClick={onFeedbackLinkClick}>
        Feedback
      </a>
      <FeedbackModal />
    </>
  )
}
