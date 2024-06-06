/* globals $,promptMessage: false */
import uniqBy from 'lodash/uniqBy'
import { useContext, useEffect, useState } from 'react'
import List from 'rc-virtual-list'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import BasicModal from '../BasicModal'
import WebFieldContext from '../WebFieldContext'
import { prettyField } from '../../lib/utils'

const MessageReviewersModal = ({
  tableRowsDisplayed,
  messageOption,
  messageModalId,
  selectedIds,
}) => {
  const { accessToken } = useUser()
  const {
    shortPhrase,
    venueId,
    officialReviewName,
    submissionName,
    emailReplyTo,
    messageSubmissionReviewersInvitationId,
    reviewerName,
    areaChairName,
  } = useContext(WebFieldContext)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [allRecipients, setAllRecipients] = useState([])
  const [recipientsInfo, setRecipientsInfo] = useState([])
  const totalMessagesCount = uniqBy(recipientsInfo, (p) => p.reviewerProfileId).reduce(
    (prev, curr) => prev + curr.count,
    0
  )
  const primaryButtonText = currentStep === 1 ? 'Next' : 'Confirm & Send Messages'
  const uniqueRecipientsInfo = uniqBy(recipientsInfo, (p) => p.preferredEmail)

  const handlePrimaryButtonClick = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }
    // send emails
    setIsSending(true)
    try {
      const simplifiedTableRowsDisplayed = tableRowsDisplayed.map((p) => ({
        id: p.note.id,
        number: p.note.number,
        forum: p.note.forum,
        messageSignature: p.messageSignature,
      }))

      const sendEmailPs = selectedIds.map((noteId) => {
        const rowData = simplifiedTableRowsDisplayed.find((row) => row.id === noteId)
        const reviewerIds = allRecipients.get(rowData.number)
        if (!reviewerIds?.length) return Promise.resolve()
        const forumUrl = `https://openreview.net/forum?id=${rowData.forum}&noteId=${noteId}&invitationId=${venueId}/${submissionName}${rowData.number}/-/${officialReviewName}`
        return api.post(
          '/messages',
          {
            invitation:
              messageSubmissionReviewersInvitationId &&
              messageSubmissionReviewersInvitationId.replace('{number}', rowData.number),
            signature: messageSubmissionReviewersInvitationId && rowData.messageSignature,
            groups: reviewerIds,
            subject,
            message: message.replaceAll('{{submit_review_link}}', forumUrl),
            parentGroup: `${venueId}/${submissionName}${rowData.number}/${reviewerName}`,
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
        ? `This is a reminder to please submit your ${prettyField(
            officialReviewName
          ).toLowerCase()} for ${shortPhrase}.\n\n`
        : ''
    }Click on the link below to go to the ${prettyField(
      officialReviewName
    ).toLowerCase()} page:\n\n{{submit_review_link}}
    \n\nThank you,\n${shortPhrase} ${prettyField(areaChairName)}`)

    const recipients = getRecipients(selectedIds)

    const recipientsWithCount = {}
    const noteNumberReviewerIdsMap = new Map()

    recipients.forEach((recipient) => {
      const { noteNumber } = recipient
      if (noteNumberReviewerIdsMap.has(noteNumber)) {
        noteNumberReviewerIdsMap.get(noteNumber).push(recipient.anonymizedGroup)
      } else {
        noteNumberReviewerIdsMap.set(noteNumber, [recipient.anonymizedGroup])
      }
      if (recipient.preferredEmail in recipientsWithCount) {
        recipientsWithCount[recipient.preferredEmail].count += 1
      } else {
        recipientsWithCount[recipient.preferredEmail] = { ...recipient, count: 1 }
      }
    })
    setAllRecipients(noteNumberReviewerIdsMap)
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
        setError(null)
      }}
      options={{ extraClasses: 'message-reviewers-modal' }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {currentStep === 1 ? (
        <>
          <p>{`You may customize the message that will be sent to the ${prettyField(
            reviewerName
          ).toLowerCase()}. In the email
  body, the text {{ submit_review_link }} will be replaced with a hyperlink to the
  form where the ${prettyField(
    reviewerName
  ).toLowerCase()} can fill out his or her ${prettyField(
    officialReviewName
  ).toLowerCase()}.`}</p>
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
            emails will be sent to the following {prettyField(reviewerName).toLowerCase()}:
          </p>
          <div className="well reviewer-list">
            <List
              data={uniqueRecipientsInfo}
              itemHeight={18}
              height={Math.min(uniqueRecipientsInfo.length * 18, 580)}
              itemKey="preferredEmail"
            >
              {(recipientInfo) => (
                <li>
                  {' '}
                  {`${recipientInfo.preferredName} <${recipientInfo.preferredEmail}>${
                    recipientInfo.count > 1 ? ` --- (×${recipientInfo.count})` : ''
                  }`}
                </li>
              )}
            </List>
          </div>
        </>
      )}
    </BasicModal>
  )
}

export default MessageReviewersModal
