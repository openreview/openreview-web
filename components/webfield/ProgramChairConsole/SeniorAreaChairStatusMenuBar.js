/* globals $,promptMessage: false */
import { useContext, useEffect, useState } from 'react'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import BasicModal from '../../BasicModal'
import WebFieldContext from '../../WebFieldContext'
import BaseMenuBar from '../BaseMenuBar'

const MessageSeniorAreaChairsModal = ({
  tableRowsDisplayed: tableRows,
  messageOption,
  messageParentGroup,
  messageSignature,
}) => {
  const { accessToken } = useUser()
  const { shortPhrase, emailReplyTo, submissionVenueId, messageSeniorAreaChairsInvitationId } = useContext(WebFieldContext)
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
          invitation: messageSeniorAreaChairsInvitationId,
          signature: messageSeniorAreaChairsInvitationId && messageSignature,
          groups: recipientsInfo.map((p) => p.id),
          subject,
          message,
          parentGroup: messageParentGroup,
          replyTo: emailReplyTo,
        },
        { accessToken }
      )
      $('#message-seniorareachairs').modal('hide')
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
      case 'missingAssignments':
        return tableRows.filter((row) => !row.acs?.length)
      default:
        return []
    }
  }

  useEffect(() => {
    if (!messageOption) return
    const recipientRows = getRecipientRows()
    setRecipientsInfo(
      recipientRows.map((row) => {
        const sacProfile = row.sacProfile
        return sacProfile
          ? {
              id: row.sacProfileId,
              preferredName: sacProfile.preferredName,
              preferredEmail: sacProfile.preferredEmail,
            }
          : {
              id: row.sacProfileId,
              preferredName: row.sacProfileId,
              preferredEmail: row.sacProfileId,
            }
      })
    )
  }, [messageOption])

  return (
    <BasicModal
      id="message-seniorareachairs"
      title={messageOption?.label}
      primaryButtonText={primaryButtonText}
      onPrimaryButtonClick={handlePrimaryButtonClick}
      primaryButtonDisabled={!totalMessagesCount || !message}
      onClose={() => {
        setCurrentStep(1)
      }}
      options={{ extraClasses: 'message-reviewers-modal' }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {currentStep === 1 ? (
        <>
          <p>
            Enter a message to be sent to all selected senior area chairs below. You will have a
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
            emails will be sent to the following senior area chairs:
          </p>
          <div className="well reviewer-list">
            {recipientsInfo.map((recipientInfo, index) => (
              <li
                key={index}
              >{`${recipientInfo.preferredName} <${recipientInfo.preferredEmail}>`}</li>
            ))}
          </div>
        </>
      )}
    </BasicModal>
  )
}

const SeniorAreaChairStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  setSeniorAreaChairStatusTabData,
}) => {
  const sortOptions = [
    {
      label: 'Senior Area Chair',
      value: 'Senior Area Chair',
      getValue: (p) => p.number,
    },
    {
      label: 'Senior Area Chair Name',
      value: 'Senior Area Chair Name',
      getValue: (p) => p.sacProfile?.preferredName ?? p.sacProfileId,
    },
  ]
  const basicSearchFunction = (row, term) =>
    (row.sacProfile?.preferredName.toLowerCase() ?? row.sacProfileId.toLowerCase()).includes(
      term
    )

  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      setData={setSeniorAreaChairStatusTabData}
      enableQuerySearch={false}
      sortOptions={sortOptions}
      exportFileName="Senior Area Chair Status"
      basicSearchFunction={basicSearchFunction}
      searchPlaceHolder="Search all senior area chairs"
      extraClasses="sac-status-menu"
    />
  )
}

export default SeniorAreaChairStatusMenuBar
