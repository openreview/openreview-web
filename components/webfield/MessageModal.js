/* globals $,promptMessage: false */
import { uniqBy } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import BasicModal from '../BasicModal'
import WebFieldContext from '../WebFieldContext'

const TwoStepMessageModal = ({
  modalTitle,
  messageModalId,
  subject,
  setSubject,
  message,
  setMessage,
  instruction = `You may customize the message that will be sent to the reviewers. In the email
  body, the text {{ submit_review_link }} will be replaced with a hyperlink to the
  form where the reviewer can fill out his or her review.`,
  error,
  recipientsInfo,
  currentStep,
  setCurrentStep,
  handlePrimaryButtonClick,
  totalMessagesCount,
}) => {
  const primaryButtonText = currentStep === 1 ? 'Next' : 'Confirm & Send Messages'

  return (
    <BasicModal
      id={messageModalId}
      title={modalTitle}
      primaryButtonText={primaryButtonText}
      onPrimaryButtonClick={handlePrimaryButtonClick}
      primaryButtonDisabled={!totalMessagesCount}
      onClose={() => {
        setCurrentStep(1)
      }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {currentStep === 1 ? (
        <>
          <p>{instruction}</p>
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
            {uniqBy(recipientsInfo, (p) => p.reviewerProfileId).map((recipientInfo) => (
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

export const MessageReviewersModal = ({
  tableRowsDisplayed,
  messageOption,
  messageModalId,
  selectedIds,
}) => {
  const { accessToken } = useUser()
  const { shortPhrase, venueId, officialReviewName, submissionName } =
    useContext(WebFieldContext)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] = useState(null)
  const [recipientsInfo, setRecipientsInfo] = useState([])
  const totalMessagesCount = uniqBy(recipientsInfo, (p) => p.reviewerProfileId).reduce(
    (prev, curr) => prev + curr.count,
    0
  )

  const handlePrimaryButtonClick = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }
    // send emails
    try {
      const sendEmailPs = selectedIds.map((noteId) => {
        const { note } = tableRowsDisplayed.find((row) => row.note.id === noteId)
        const reviewerIds = recipientsInfo
          .filter((p) => p.noteNumber == note.number) // eslint-disable-line eqeqeq
          .map((q) => q.reviewerProfileId)
        if (!reviewerIds.length) return Promise.resolve()
        const forumUrl = `https://openreview.net/forum?id=${note.forum}&noteId=${noteId}&invitationId=${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
        return api.post(
          '/messages',
          {
            groups: reviewerIds,
            subject,
            message: message.replaceAll('{{submit_review_link}}', forumUrl),
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
    const recipientsWithCount = recipients.map((recipient) => {
      const count = recipients.filter(
        (p) => p.reviewerProfileId === recipient.reviewerProfileId
      ).length
      return {
        ...recipient,
        count,
      }
    })
    setRecipientsInfo(recipientsWithCount)
  }, [messageOption, selectedIds])

  return (
    <TwoStepMessageModal
      modalTitle={messageOption?.label}
      messageModalId={messageModalId}
      subject={subject}
      setSubject={setSubject}
      message={message}
      setMessage={setMessage}
      error={error}
      recipientsInfo={recipientsInfo}
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      handlePrimaryButtonClick={handlePrimaryButtonClick}
      totalMessagesCount={totalMessagesCount}
    />
  )
}

export const MessageAreaChairsModal = ({
  tableRowsDisplayed: tableRows,
  messageOption,
  messageParentGroup,
}) => {
  const { accessToken } = useUser()
  const { shortPhrase } = useContext(WebFieldContext)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] = useState(null)
  const primaryButtonText = currentStep === 1 ? 'Next' : 'Confirm & Send Messages'
  const [recipientsInfo, setRecipientsInfo] = useState([])
  const totalMessagesCount = recipientsInfo.length

  const handlePrimaryButtonClick = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }
    // send emails
    try {
      await api.post(
        '/messages',
        {
          groups: recipientsInfo.map((p) => p.id),
          subject,
          message,
          parentGroup: messageParentGroup,
        },
        { accessToken }
      )
      $('#message-areachairs').modal('hide')
      promptMessage(`Successfully sent ${totalMessagesCount} emails`)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  const getRecipientRows = () => {
    switch (messageOption.value) {
      case 'noBids':
        return tableRows.map((row) => row.completedBids === 0)
      case 'noRecommendations':
        return tableRows.map((row) => row.completedRecommendations === 0)
      case 'missingReviews':
        return tableRows.filter((row) => row.numCompletedReviews < row.notes?.length ?? 0)
      case 'noMetaReviews':
        return tableRows.filter(
          (row) => row.numCompletedMetaReviews === 0 && (row.notes?.length ?? 0) !== 0
        )
      case 'missingMetaReviews':
        return tableRows.filter((row) => row.numCompletedMetaReviews < row.notes?.length ?? 0)
      default:
        return []
    }
  }

  useEffect(() => {
    if (!messageOption) return
    const recipientRows = getRecipientRows()
    setRecipientsInfo(
      recipientRows.map((row) => {
        const acProfile = row.areaChairProfile
        return acProfile
          ? {
              id: row.areaChairProfileId,
              preferredName: acProfile.preferredName,
              preferredEmail: acProfile.preferredEmail,
            }
          : {
              id: row.areaChairProfileId,
              preferredName: row.areaChairProfileId,
              preferredEmail: row.areaChairProfileId,
            }
      })
    )
  }, [messageOption])

  return (
    <BasicModal
      id="message-areachairs"
      title={messageOption?.label}
      primaryButtonText={primaryButtonText}
      onPrimaryButtonClick={handlePrimaryButtonClick}
      primaryButtonDisabled={!totalMessagesCount || !message}
      onClose={() => {
        setCurrentStep(1)
      }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {currentStep === 1 ? (
        <>
          <p>
            Enter a message to be sent to all selected area chairs below. You will have a
            chance to review a list of all recipients after clicking &quot;Next&quot; below.
          </p>
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
            emails will be sent to the following area chairs:
          </p>
          <div className="well reviewer-list">
            {recipientsInfo.map((recipientInfo) => (
              <li
                key={recipientInfo.preferredEmail}
              >{`${recipientInfo.preferredName} <${recipientInfo.preferredEmail}>`}</li>
            ))}
          </div>
        </>
      )}
    </BasicModal>
  )
}
