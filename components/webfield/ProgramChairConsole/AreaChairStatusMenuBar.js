/* globals $,promptMessage: false */
import { useContext, useEffect, useState } from 'react'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import BasicModal from '../../BasicModal'
import WebFieldContext from '../../WebFieldContext'
import BaseMenuBar from '../BaseMenuBar'
import QuerySearchInfoModal from '../QuerySearchInfoModal'

const MessageAreaChairsModal = ({
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
        return tableRows.filter((row) => row.completedBids === 0)
      case 'noRecommendations':
        return tableRows.filter((row) => row.completedRecommendations === 0)
      case 'missingReviews':
        return tableRows.filter((row) => row.numCompletedReviews < row.notes?.length ?? 0)
      case 'noMetaReviews':
        return tableRows.filter(
          (row) => row.numCompletedMetaReviews === 0 && (row.notes?.length ?? 0) !== 0
        )
      case 'missingMetaReviews':
        return tableRows.filter((row) => row.numCompletedMetaReviews < row.notes?.length ?? 0)
      case 'missingAssignments':
        return tableRows.filter((row) => !row.notes?.length)
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
      options={{ extraClasses: 'message-reviewers-modal' }}
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

const AreaChairStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  setAreaChairStatusTabData,
  bidEnabled,
  recommendationEnabled,
}) => {
  const {
    shortPhrase,
    seniorAreaChairsId,
    enableQuerySearch,
    areaChairStatusExportColumns: exportColumnsConfig,
    filterOperators: filterOperatorsConfig,
    propertiesAllowed: propertiesAllowedConfig,
    areaChairsId: messageParentGroup,
  } = useContext(WebFieldContext)
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '==', '=']
  const propertiesAllowed = propertiesAllowedConfig ?? {
    number: ['number'],
    name: ['areaChairProfile.preferredName'],
    email: ['areaChairProfile.preferredEmail'],
    sac: ['areaChairProfile.seniorAreaChair.seniorAreaChairId'],
  }
  const messageAreaChairOptions = [
    ...(bidEnabled
      ? [
          {
            label: 'Area Chairs with 0 bids',
            value: 'noBids',
          },
        ]
      : []),
    ...(recommendationEnabled
      ? [
          {
            label: 'Area Chairs with 0 recommendations',
            value: 'noRecommendations',
          },
        ]
      : []),
    { label: 'Area Chairs with unsubmitted reviews', value: 'missingReviews' },
    { label: 'Area Chairs with 0 submitted meta reviews', value: 'noMetaReviews' },
    {
      label: 'Area Chairs with unsubmitted meta reviews',
      value: 'missingMetaReviews',
    },
    {
      label: 'Area Chairs with 0 assignments',
      value: 'missingAssignments',
    },
  ]
  const exportColumns = [
    { header: 'id', getValue: (p) => p.areaChairProfileId },
    {
      header: 'name',
      getValue: (p) => p.areaChairProfile?.preferredName ?? p.areaChairProfileId,
    },
    {
      header: 'email',
      getValue: (p) => p.areaChairProfile?.preferredEmail ?? p.areaChairProfileId,
    },
    { header: 'assigned papers', getValue: (p) => p.notes?.length },
    { header: 'reviews completed', getValue: (p) => p.numCompletedReviews },
    { header: 'meta reviews completed', getValue: (p) => p.numCompletedMetaReviews },
    ...(seniorAreaChairsId
      ? [
          { header: 'sac id', getValue: (p) => p.seniorAreaChair?.seniorAreaChairId ?? 'N/A' },
          {
            header: 'sac name',
            getValue: (p) => p.seniorAreaChair?.sacProfile?.preferredName ?? 'N/A',
          },
          {
            header: 'sac email',
            getValue: (p) => p.seniorAreaChair?.sacProfile?.preferredEmail ?? 'N/A',
          },
        ]
      : []),
    ...(exportColumnsConfig ?? []),
  ]
  const sortOptions = [
    {
      label: 'Area Chair',
      value: 'Area Chair',
      getValue: (p) => p.number,
    },
    {
      label: 'Area Chair Name',
      value: 'Area Chair Name',
      getValue: (p) => p.areaChairProfile?.preferredName ?? p.areaChairProfileId,
    },
    {
      label: 'Bids Completed',
      value: 'Bids Completed',
      getValue: (p) => p.completedBids,
    },
    {
      label: 'Reviewer Recommendations Completed',
      value: 'Reviewer Recommendations Completed',
      getValue: (p) => p.completedRecommendations,
    },
    {
      label: 'Papers Assigned',
      value: 'Papers Assigned',
      getValue: (p) => p.notes?.length,
    },
    {
      label: 'Papers with Completed Review Missing',
      value: 'Papers with Completed Review Missing',
      getValue: (p) => p.notes?.length ?? 0 - p.numCompletedReviews ?? 0,
    },
    {
      label: 'Papers with Completed Review',
      value: 'Papers with Completed Review',
      getValue: (p) => p.numCompletedReviews,
    },
    {
      label: 'Papers with Completed MetaReview Missing',
      value: 'Papers with Completed MetaReview Missing',
      getValue: (p) => p.notes?.length ?? 0 - p.numCompletedMetaReviews,
    },
    {
      label: 'Papers with Completed MetaReview',
      value: 'Papers with Completed MetaReview',
      getValue: (p) => p.numCompletedMetaReviews,
    },
  ]
  const basicSearchFunction = (row, term) =>
    (
      row.areaChairProfile?.preferredName.toLowerCase() ?? row.areaChairProfileId.toLowerCase()
    ).includes(term)

  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      setData={setAreaChairStatusTabData}
      shortPhrase={shortPhrase}
      enableQuerySearch={enableQuerySearch}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      messageDropdownLabel="Message Area Chairs"
      messageOptions={messageAreaChairOptions}
      messageModalId="message-areachairs"
      messageParentGroup={messageParentGroup}
      exportColumns={exportColumns}
      exportFileName="Area Chair Status"
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      messageModal={(props) => <MessageAreaChairsModal {...props} />}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
      extraClasses="ac-status-menu"
    />
  )
}

export default AreaChairStatusMenuBar
