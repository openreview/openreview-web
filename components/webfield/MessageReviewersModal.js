/* globals $,promptMessage,promptError: false */
import uniqBy from 'lodash/uniqBy'
import { useContext, useEffect, useState } from 'react'
import List from 'rc-virtual-list'
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
  const {
    shortPhrase,
    venueId,
    officialReviewName,
    officialMetaReviewName,
    submissionName,
    emailReplyTo,
    messageSubmissionReviewersInvitationId,
    messageSubmissionAreaChairsInvitationId,
    messageSubmissionSecondaryAreaChairsInvitationId,
    reviewerName = 'Reviewers',
    areaChairName = 'Area Chairs',
    secondaryAreaChairName,
    seniorAreaChairName = 'Senior_Area_Chairs',
  } = useContext(WebFieldContext)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [allRecipients, setAllRecipients] = useState([])
  const [recipientsInfo, setRecipientsInfo] = useState([])
  const totalMessagesCount = uniqBy(recipientsInfo, (p) => p.preferredId).reduce(
    (prev, curr) => prev + curr.count,
    0
  )
  const primaryButtonText = currentStep === 1 ? 'Next' : 'Confirm & Send Messages'
  const uniqueRecipientsInfo = uniqBy(recipientsInfo, (p) => p.preferredId)

  const getMessage = (rowData) => {
    if (messageOption.value === 'allAuthors' || messageOption.value === 'allSACs') {
      return message.replaceAll(`{{${submissionName.toLowerCase()}_number}}`, rowData.number)
    }
    if (
      messageOption.value === 'allAreaChairs' ||
      messageOption.value === 'allSecondaryAreaChairs'
    ) {
      const metaReviewForumUrl = `https://openreview.net/forum?id=${rowData.forum}&noteId=${rowData.id}&invitationId=${venueId}/${submissionName}${rowData.number}/-/${officialMetaReviewName}`
      return message.replaceAll('{{submit_review_link}}', metaReviewForumUrl)
    }

    const reviewForumUrl = `https://openreview.net/forum?id=${rowData.forum}&noteId=${rowData.id}&invitationId=${venueId}/${submissionName}${rowData.number}/-/${officialReviewName}`
    return message.replaceAll('{{submit_review_link}}', reviewForumUrl)
  }

  const handlePrimaryButtonClick = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }
    // send emails
    setIsSending(true)
    let roleName
    let messageInvitation

    switch (messageOption.value) {
      case 'allAreaChairs':
        roleName = areaChairName
        messageInvitation = messageSubmissionAreaChairsInvitationId
        break
      case 'allSecondaryAreaChairs':
        roleName = areaChairName
        messageInvitation = messageSubmissionSecondaryAreaChairsInvitationId
        break
      case 'allAuthors':
        roleName = 'Authors'
        break
      case 'allSACs':
        roleName = seniorAreaChairName
        break
      default:
        roleName = reviewerName
        messageInvitation = messageSubmissionReviewersInvitationId
        break
    }
    try {
      const simplifiedTableRowsDisplayed = tableRowsDisplayed.map((p) => ({
        id: p.note.id,
        number: p.note.number,
        forum: p.note.forum,
        messageSignature: p.messageSignature,
      }))

      const sendEmailBatchSize = 1000
      const sendEmailBatchCount = Math.ceil(selectedIds.length / sendEmailBatchSize)
      const sendEmailIdBatches = Array.from({ length: sendEmailBatchCount }, (_, i) =>
        selectedIds.slice(i * sendEmailBatchSize, (i + 1) * sendEmailBatchSize)
      )

      const sendEmailBatchPromises = sendEmailIdBatches.reduce(
        (pastBatches, currentIDsBatch) =>
          pastBatches.then(() => {
            const currentBatchSendEmailPs = currentIDsBatch.map((noteId) => {
              const rowData = simplifiedTableRowsDisplayed.find((row) => row.id === noteId)
              const groupIds = allRecipients.get(rowData?.number)
              if (!groupIds?.length) return Promise.resolve()
              return api.post('/messages', {
                ...(messageInvitation && {
                  invitation: messageInvitation.replace('{number}', rowData.number),
                }),
                signature: messageInvitation && rowData.messageSignature,
                groups: groupIds,
                subject,
                message: getMessage(rowData),
                parentGroup: `${venueId}/${submissionName}${rowData.number}/${roleName}`,
                replyTo: emailReplyTo,
              })
            })
            return Promise.all(currentBatchSendEmailPs)
          }),
        Promise.resolve()
      )
      await sendEmailBatchPromises

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
      case 'allAreaChairs':
        return selectedRows.flatMap((row) => row.metaReviewData.areaChairs)
      case 'allSecondaryAreaChairs':
        return selectedRows.flatMap((row) => row.metaReviewData.secondaryAreaChairs)
      case 'withReviews':
        return selectedRows
          .flatMap((row) => row.reviewers)
          .filter((reviewer) => reviewer.hasReview)
      case 'missingReviews':
        return selectedRows
          .flatMap((row) => row.reviewers)
          .filter((reviewer) => !reviewer.hasReview)
      case 'allAuthors':
        return selectedRows.flatMap((row) => row.authors ?? [])
      case 'allSACs':
        return selectedRows.flatMap((row) => row.metaReviewData.seniorAreaChairs ?? [])
      default:
        return []
    }
  }

  const getInstruction = () => {
    switch (messageOption?.value) {
      case 'allAuthors':
        return `You may customize the message that will be sent to authors. You can also use {{fullname}} to replace the recipient full name and {{${submissionName.toLowerCase()}_number}} to replace the ${submissionName.toLowerCase()} number. If your message is not specific to a ${submissionName.toLowerCase()}, please email from the author group.`
      case 'allSACs':
        return `You may customize the message that will be sent to ${prettyField(seniorAreaChairName)}. You can also use {{fullname}} to replace the recipient full name and {{${submissionName.toLowerCase()}_number}} to replace the ${submissionName.toLowerCase()} number. If your message is not specific to a ${submissionName.toLowerCase()}, please email from the ${prettyField(seniorAreaChairName)} group.`
      case 'allAreaChairs':
        return `You may customize the message that will be sent to the ${prettyField(areaChairName).toLowerCase()}. In the email body, the text {{submit_review_link}} will be replaced with a hyperlink to the form where the ${prettyField(areaChairName).toLowerCase()} can fill out his or her ${prettyField(officialMetaReviewName).toLowerCase()}. You can also use {{fullname}} to personalize the recipient full name.`
      case 'allSecondaryAreaChairs':
        return `You may customize the message that will be sent to the ${prettyField(secondaryAreaChairName)?.toLowerCase()}. In the email body, the text {{submit_review_link}} will be replaced with a hyperlink to the form where the ${prettyField(secondaryAreaChairName)?.toLowerCase()} can fill out his or her ${prettyField(officialMetaReviewName).toLowerCase()}. You can also use {{fullname}} to personalize the recipient full name.`
      // allReviewers
      default:
        return `You may customize the message that will be sent to the ${prettyField(reviewerName).toLowerCase()}. In the email body, the text {{submit_review_link}} will be replaced with a hyperlink to the form where the ${prettyField(reviewerName).toLowerCase()} can fill out his or her ${prettyField(officialReviewName).toLowerCase()}. You can also use {{fullname}} to personalize the recipient full name.`
    }
  }

  useEffect(() => {
    if (!messageOption) return
    setMessage('Your message...')

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
      if (recipient.preferredId in recipientsWithCount) {
        recipientsWithCount[recipient.preferredId].count += 1
      } else {
        recipientsWithCount[recipient.preferredId] = { ...recipient, count: 1 }
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
      options={{ extraClasses: 'message-reviewers-modal', useSpinnerButton: true }}
      isLoading={isSending}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {currentStep === 1 ? (
        <>
          <p>{getInstruction()}</p>
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
            emails will be sent to the following users:
          </p>
          <div className="well reviewer-list">
            <List
              data={uniqueRecipientsInfo}
              itemHeight={18}
              height={Math.min(uniqueRecipientsInfo.length * 18, 580)}
              itemKey="preferredId"
            >
              {(recipientInfo) => (
                <li>
                  {' '}
                  {`${recipientInfo.preferredName} ${
                    recipientInfo.count > 1 ? ` × ${recipientInfo.count}` : ''
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
