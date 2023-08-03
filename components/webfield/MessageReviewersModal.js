/* globals $,promptMessage: false */
import uniqBy from 'lodash/uniqBy'
import { useContext, useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import BasicModal from '../BasicModal'
import WebFieldContext from '../WebFieldContext'

const MessageReviewersModal = ({
  tableRowsDisplayed,
  messageOption,
  messageModalId,
  selectedIds,
}) => {
  const { accessToken } = useUser()
  const { shortPhrase, venueId, officialReviewName, submissionName, emailReplyTo } =
    useContext(WebFieldContext)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [recipientsInfo, setRecipientsInfo] = useState([])
  const totalMessagesCount = uniqBy(recipientsInfo, (p) => p.reviewerProfileId).reduce(
    (prev, curr) => prev + curr.count,
    0
  )
  const primaryButtonText = currentStep === 1 ? 'Next' : 'Confirm & Send Messages'

  const handlePrimaryButtonClick = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }
    // send emails
    setIsSending(true)
    try {
      const sendEmailPs = selectedIds.map((noteId) => {
        const { note } = tableRowsDisplayed.find((row) => row.note.id === noteId)
        const reviewerIds = recipientsInfo
          .filter((p) => p.noteNumber === note.number)
          .map((q) => q.reviewerProfileId)
        if (!reviewerIds.length) return Promise.resolve()
        const forumUrl = `https://openreview.net/forum?id=${note.forum}&noteId=${noteId}&invitationId=${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
        return api.post(
          '/messages',
          {
            groups: reviewerIds,
            subject,
            message: message.replaceAll('{{submit_review_link}}', forumUrl),
            parentGroup: `${venueId}/${submissionName}${note.number}/Reviewers`,
            replyTo: emailReplyTo,
          },
          { accessToken }
        )
      })
      await Promise.all(sendEmailPs)
      $(`#${messageModalId}`).modal('hide')
      promptMessage(`Successfully sent ${totalMessagesCount} emails`)
    } catch (apiError) {
      setError(apiError.message)
    }
    setIsSending(false)
  }

  const getRecipients = (selecteNoteIds) => {
    if (!selecteNoteIds.length) return []
    const selectedRows = tableRowsDisplayed.filter((row) =>
      selecteNoteIds.includes(row.note.id)
    )

    switch (messageOption.value) {
      case 'allReviewers':
        return selectedRows.flatMap((row) => row.reviewers)
      case 'withReviews':
        return selectedRows
          .flatMap((row) => row.reviewers)
          .filter((reviewer) => reviewer.hasReview)
      case 'missingReviews':
        return selectedRows
          .flatMap((row) => row.reviewers)
          .filter((reviewer) => !reviewer.hasReview)
      default:
        return []
    }
  }

  useEffect(() => {
    if (!messageOption) return
    setMessage(`${
      messageOption.value === 'missingReviews'
        ? `This is a reminder to please submit your review for ${shortPhrase}.\n\n`
        : ''
    }Click on the link below to go to the review page:\n\n{{submit_review_link}}
    \n\nThank you,\n${shortPhrase} Area Chair`)

    const recipients = getRecipients(selectedIds)

    const recipientsWithCount = {}
    recipients.forEach((recipient) => {
      if (recipient.preferredEmail in recipientsWithCount) {
        recipientsWithCount[recipient.preferredEmail].count += 1
      } else {
        recipientsWithCount[recipient.preferredEmail] = { ...recipient, count: 1 }
      }
    })

    setRecipientsInfo(Object.values(recipientsWithCount))
  }, [messageOption])

  return (
    <BasicModal
      id={messageModalId}
      title={messageOption?.label}
      primaryButtonText={primaryButtonText}
      onPrimaryButtonClick={handlePrimaryButtonClick}
      primaryButtonDisabled={!totalMessagesCount || isSending}
      onClose={() => {
        setIsSending(false)
        setCurrentStep(1)
      }}
      options={{ extraClasses: 'message-reviewers-modal' }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {currentStep === 1 ? (
        <>
          <p>{`You may customize the message that will be sent to the reviewers. In the email
  body, the text {{ submit_review_link }} will be replaced with a hyperlink to the
  form where the reviewer can fill out his or her review.`}</p>
          <div className="form-group">
            <label htmlFor="subject">Email Subject</label>
            <input
              type="text"
              name="subject"
              className="form-control"
              value={subject}
              required
              onChange={(e) => setSubject(e.target.value)}
            />
            <label htmlFor="message">Email Body</label>
            <textarea
              name="message"
              className="form-control message-body"
              rows="6"
              value={message ?? ''}
              required
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <p>
            A total of <span className="num-reviewers">{totalMessagesCount}</span> reminder
            emails will be sent to the following reviewers:
          </p>
          <div className="well reviewer-list">
            {uniqBy(recipientsInfo, (p) => p.preferredEmail).map((recipientInfo) => (
              <li key={recipientInfo.preferredEmail}>{`${recipientInfo.preferredName} <${
                recipientInfo.preferredEmail
              }>${recipientInfo.count > 1 ? ` --- (×${recipientInfo.count})` : ''}`}</li>
            ))}
          </div>
        </>
      )}
    </BasicModal>
  )
}

export default MessageReviewersModal
