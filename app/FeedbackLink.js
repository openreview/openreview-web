'use client'

/* globals $: false */
import { useEffect, useState } from 'react'
import FeedbackModal from '../components/FeedbackModal'

export default function FeedbackLink() {
  const [isClientRendering, setIsClientRendering] = useState(false)
  const onFeedbackLinkClick = (e) => {
    e.preventDefault()
    $('#feedback-modal').modal('show')
  }

  useEffect(() => {
    setIsClientRendering(true)
  }, [])

  if (!isClientRendering) return <a>Feedback</a>

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
