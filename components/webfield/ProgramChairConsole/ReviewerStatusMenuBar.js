/* globals $,promptMessage: false */
import { useContext, useEffect, useState } from 'react'
import api from '../../../lib/api-client'
import BasicModal from '../../BasicModal'
import WebFieldContext from '../../WebFieldContext'
import BaseMenuBar from '../BaseMenuBar'
import { pluralizeString, prettyField } from '../../../lib/utils'

const MessageReviewersModal = ({
  tableRowsDisplayed: tableRows,
  messageOption,
  messageParentGroup,
  messageSignature,
}) => {
  const { shortPhrase, emailReplyTo, messageReviewersInvitationId, reviewerName } =
    useContext(WebFieldContext)
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
      await api.post('/messages', {
        invitation: messageReviewersInvitationId,
        signature: messageReviewersInvitationId && messageSignature,
        groups: recipientsInfo.map((p) => p.id),
        subject,
        message,
        parentGroup: messageParentGroup,
        replyTo: emailReplyTo,
      })
      $('#message-reviewers').modal('hide')
      promptMessage(`Successfully sent ${totalMessagesCount} emails`)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  const getRecipientRows = () => {
    if (Object.keys(messageOption).includes('filterFunc')) {
      const customFunc = Function('row', messageOption.filterFunc) // eslint-disable-line no-new-func
      return tableRows.filter((row) => customFunc(row))
    }

    switch (messageOption.value) {
      case 'noBids':
        return tableRows.filter((row) => row.completedBids === 0)
      case 'missingReviews':
        return tableRows.filter((row) => row.numCompletedReviews < row.notesInfo?.length ?? 0)
      case 'submittedReviews':
        return tableRows.filter((row) => row.numCompletedReviews > 0)
      case 'noAssignments':
        return tableRows.filter((row) => !row.notesInfo?.length)
      default:
        return []
    }
  }

  useEffect(() => {
    if (!messageOption) return
    const recipientRows = getRecipientRows()
    setRecipientsInfo(
      recipientRows.map((row) => {
        const { reviewerProfile } = row
        return reviewerProfile
          ? {
              id: row.reviewerProfileId,
              preferredName: reviewerProfile.preferredName,
            }
          : {
              id: row.reviewerProfileId,
              preferredName: row.reviewerProfileId,
            }
      })
    )
  }, [messageOption])

  return (
    <BasicModal
      id="message-reviewers"
      options={{ extraClasses: 'message-reviewers-modal' }}
      title={messageOption?.label}
      primaryButtonText={primaryButtonText}
      onPrimaryButtonClick={handlePrimaryButtonClick}
      primaryButtonDisabled={!totalMessagesCount || !message}
      onClose={() => {
        setCurrentStep(1)
        setMessage(null)
      }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {currentStep === 1 ? (
        <>
          <p>
            Enter a message to be sent to all selected{' '}
            {prettyField(reviewerName).toLowerCase()} below. You will have a chance to review a
            list of all recipients after clicking &quot;Next&quot; below.
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
            emails will be sent to the following {prettyField(reviewerName).toLowerCase()}:
          </p>
          <div className="well reviewer-list">
            {recipientsInfo.map((recipientInfo, index) => (
              <li key={index}>{`${recipientInfo.preferredName}`}</li>
            ))}
          </div>
        </>
      )}
    </BasicModal>
  )
}

const ReviewerStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  selectedNoteIds,
  setReviewerStatusTabData,
  shortPhrase,
  exportColumns: exportColumnsConfig,
  bidEnabled,
  messageParentGroup,
  messageSignature,
}) => {
  const { reviewerEmailFuncs, officialReviewName, reviewerName, submissionName } =
    useContext(WebFieldContext)
  const messageAreaChairOptions = [
    ...(bidEnabled
      ? [
          {
            label: `${prettyField(reviewerName)} with 0 bids`,
            value: 'noBids',
          },
        ]
      : []),
    {
      label: `${prettyField(reviewerName)} with unsubmitted ${pluralizeString(
        prettyField(officialReviewName)
      ).toLowerCase()}`,
      value: 'missingReviews',
    },
    {
      label: `${prettyField(reviewerName)} with submitted ${pluralizeString(
        prettyField(officialReviewName)
      ).toLowerCase()}`,
      value: 'submittedReviews',
    },
    { label: `${prettyField(reviewerName)} with 0 assignments`, value: 'noAssignments' },
    ...(reviewerEmailFuncs ?? []),
  ]

  const exportColumns = exportColumnsConfig ?? [
    { header: 'id', getValue: (p) => p.reviewerProfileId },
    {
      header: 'name',
      getValue: (p) => p.reviewerProfile?.preferredName ?? p.reviewerProfileId,
    },
    {
      header: 'institution name',
      getValue: (p) => p.reviewerProfile?.content?.history?.[0]?.institution?.name ?? '',
    },
    {
      header: 'institution domain',
      getValue: (p) => p.reviewerProfile?.content?.history?.[0]?.institution?.domain ?? '',
    },
    {
      header: `num assigned ${pluralizeString(submissionName)}`,
      getValue: (p) => p.notesInfo.length,
    },
    {
      header: `num submitted ${pluralizeString(
        prettyField(officialReviewName)
      ).toLowerCase()}`,
      getValue: (p) => p.numCompletedReviews,
    },
  ]

  const sortOptions = [
    {
      label: `${prettyField(reviewerName)}`,
      value: 'Reviewer',
      getValue: (p) => p.number,
    },
    {
      label: `${prettyField(reviewerName)} Name`,
      value: 'Reviewer Name',
      getValue: (p) => p.reviewerProfile?.preferredName ?? p.reviewerProfileId,
    },
    ...(bidEnabled
      ? [
          {
            label: 'Bids Completed',
            value: 'Bids Completed',
            getValue: (p) => p.completedBids,
          },
        ]
      : []),
    {
      label: `${pluralizeString(submissionName)} Assigned`,
      value: 'Papers Assigned',
      getValue: (p) => p.notesInfo.length,
    },
    {
      label: `${pluralizeString(submissionName)} with ${pluralizeString(
        prettyField(officialReviewName)
      )} Missing`,
      value: 'Papers with Reviews Missing',
      getValue: (p) => p.notesInfo.length - p.numCompletedReviews,
    },
    {
      label: `${pluralizeString(submissionName)} with ${pluralizeString(
        prettyField(officialReviewName)
      )} Submitted`,
      value: 'Papers with Reviews Submitted',
      getValue: (p) => p.numCompletedReviews,
    },
    {
      label: `${pluralizeString(submissionName)} with Completed ${pluralizeString(
        prettyField(officialReviewName)
      )} Missing`,
      value: 'Papers with Completed Reviews Missing',
      getValue: (p) => p.notesInfo.length - p.numOfPapersWhichCompletedReviews,
    },
    {
      label: `${pluralizeString(submissionName)} with Completed ${pluralizeString(
        prettyField(officialReviewName)
      )}`,
      value: 'Papers with Completed Reviews',
      getValue: (p) => p.numOfPapersWhichCompletedReviews,
    },
  ]

  const basicSearchFunction = (row, term) =>
    (
      row.reviewerProfile?.preferredName.toLowerCase() ?? row.reviewerProfileId.toLowerCase()
    ).includes(term)

  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      setData={setReviewerStatusTabData}
      shortPhrase={shortPhrase}
      messageDropdownLabel="Message"
      messageOptions={messageAreaChairOptions}
      messageModalId="message-reviewers"
      messageParentGroup={messageParentGroup}
      messageSignature={messageSignature}
      exportColumns={exportColumns}
      exportFileName={`${prettyField(reviewerName)} Status`}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      messageModal={(props) => <MessageReviewersModal {...props} />}
      searchPlaceHolder={`Search all ${prettyField(reviewerName)}`}
      extraClasses="ac-status-menu"
    />
  )
}

export default ReviewerStatusMenuBar
