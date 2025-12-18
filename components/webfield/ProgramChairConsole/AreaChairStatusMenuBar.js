/* globals $,promptMessage: false */
import { useContext, useEffect, useState } from 'react'
import camelCase from 'lodash/camelCase'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import BasicModal from '../../BasicModal'
import WebFieldContext from '../../WebFieldContext'
import BaseMenuBar from '../BaseMenuBar'
import QuerySearchInfoModal from '../QuerySearchInfoModal'
import { pluralizeString, prettyField } from '../../../lib/utils'

export const MessageACSACModal = ({
  tableRowsDisplayed: tableRows,
  messageOption,
  messageParentGroup,
  messageSignature,
  isMessageSeniorAreaChairs = false,
  selectedIds,
}) => {
  const { accessToken } = useUser()
  const {
    shortPhrase,
    emailReplyTo,
    submissionVenueId,
    messageAreaChairsInvitationId,
    messageSeniorAreaChairsInvitationId,
    areaChairName = 'Area_Chairs',
    seniorAreaChairName = 'Senior_Area_Chairs',
  } = useContext(WebFieldContext)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] = useState(null)
  const primaryButtonText = currentStep === 1 ? 'Next' : 'Confirm & Send Messages'
  const [recipientsInfo, setRecipientsInfo] = useState([])
  const totalMessagesCount = recipientsInfo.length
  const messageInvitationId = isMessageSeniorAreaChairs
    ? messageSeniorAreaChairsInvitationId
    : messageAreaChairsInvitationId

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
          invitation: messageInvitationId,
          signature: messageInvitationId && messageSignature,
          groups: recipientsInfo.map((p) => p.id),
          subject,
          message,
          parentGroup: messageParentGroup,
          replyTo: emailReplyTo,
        },
        { accessToken }
      )
      $(
        `#${isMessageSeniorAreaChairs ? 'message-seniorareachairs' : 'message-areachairs'}`
      ).modal('hide')
      promptMessage(`Successfully sent ${totalMessagesCount} emails`)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  const getRecipientRows = () => {
    if (Object.keys(messageOption).includes('filterFunc')) {
      const customFunc = Function('row', messageOption.filterFunc)
      return tableRows.filter((row) => customFunc(row))
    }

    const selectedRows =
      !isMessageSeniorAreaChairs && selectedIds?.length
        ? tableRows.filter((row) => selectedIds.includes(row.areaChairProfileId))
        : tableRows

    switch (messageOption.value) {
      case 'noBids':
        return selectedRows.filter((row) => row.completedBids === 0)
      case 'noRecommendations':
        return selectedRows.filter((row) => row.completedRecommendations === 0)
      case 'missingReviews':
        return selectedRows.filter((row) => row.numCompletedReviews < row.notes?.length ?? 0)
      case 'noMetaReviews':
        return selectedRows.filter(
          (row) =>
            row.numCompletedMetaReviews === 0 &&
            (row.notes?.filter((p) => p.note.content?.venueid?.value === submissionVenueId)
              .length ?? 0) !== 0
        )
      case 'missingMetaReviews':
        return selectedRows.filter(
          (row) =>
            row.numCompletedMetaReviews <
              row.notes?.filter((p) => p.note.content?.venueid?.value === submissionVenueId)
                .length ?? 0
        )
      case 'missingAssignments':
        return selectedRows.filter((row) => !row.notes?.length)
      default:
        return []
    }
  }

  useEffect(() => {
    if (!messageOption) return

    setMessage(null)
    const recipientRows = getRecipientRows()
    setRecipientsInfo(
      recipientRows.map((row) => {
        const profile = isMessageSeniorAreaChairs ? row.sacProfile : row.areaChairProfile
        const id = isMessageSeniorAreaChairs ? row.sacProfileId : row.areaChairProfileId
        return profile
          ? {
              id,
              preferredName: profile.preferredName,
            }
          : {
              id,
              preferredName: id,
            }
      })
    )
  }, [messageOption])

  return (
    <BasicModal
      id={isMessageSeniorAreaChairs ? 'message-seniorareachairs' : 'message-areachairs'}
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
            Enter a message to be sent to all selected{' '}
            {prettyField(
              isMessageSeniorAreaChairs ? seniorAreaChairName : areaChairName
            ).toLowerCase()}{' '}
            below. You will have a chance to review a list of all recipients after clicking
            &quot;Next&quot; below.
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
            emails will be sent to the following {prettyField(areaChairName).toLowerCase()}:
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

const AreaChairStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  setAreaChairStatusTabData,
  bidEnabled,
  recommendationEnabled,
  messageParentGroup,
  messageSignature,
  selectedAreaChairIds,
  setSelectedAreaChairIds,
}) => {
  const {
    shortPhrase,
    seniorAreaChairsId,
    enableQuerySearch,
    acEmailFuncs,
    areaChairStatusExportColumns: exportColumnsConfig,
    filterOperators: filterOperatorsConfig,
    areaChairStatusPropertiesAllowed,
    seniorAreaChairName = 'Senior_Area_Chairs',
    areaChairName = 'Area_Chairs',
    officialReviewName,
    officialMetaReviewName = 'Meta_Review',
    submissionName,
    reviewerName,
  } = useContext(WebFieldContext)
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '==', '=']
  const propertiesAllowed = areaChairStatusPropertiesAllowed ?? {
    number: ['number'],
    name: ['areaChairProfile.preferredName'],
    [camelCase(seniorAreaChairName)]: ['seniorAreaChair.seniorAreaChairId'],
  }
  const messageAreaChairOptions = [
    ...(bidEnabled
      ? [
          {
            label: `${prettyField(areaChairName)} with 0 bids`,
            value: 'noBids',
          },
        ]
      : []),
    ...(recommendationEnabled
      ? [
          {
            label: `${prettyField(areaChairName)} with 0 recommendations`,
            value: 'noRecommendations',
          },
        ]
      : []),
    {
      label: `${prettyField(areaChairName)} with unsubmitted ${pluralizeString(
        prettyField(officialReviewName)
      ).toLowerCase()}`,
      value: 'missingReviews',
    },
    {
      label: `${prettyField(areaChairName)} with 0 submitted ${pluralizeString(
        prettyField(officialMetaReviewName)
      ).toLowerCase()}`,
      value: 'noMetaReviews',
    },
    {
      label: `${prettyField(areaChairName)} with unsubmitted ${pluralizeString(
        prettyField(officialMetaReviewName)
      ).toLowerCase()}`,
      value: 'missingMetaReviews',
    },
    {
      label: `${prettyField(areaChairName)} with 0 assignments`,
      value: 'missingAssignments',
    },
    ...(acEmailFuncs ?? []),
  ]
  const exportColumns = [
    { header: 'id', getValue: (p) => p.areaChairProfileId },
    {
      header: 'name',
      getValue: (p) => p.areaChairProfile?.preferredName ?? p.areaChairProfileId,
    },
    { header: `assigned ${submissionName}`, getValue: (p) => p.notes?.length },
    {
      header: `${prettyField(officialReviewName)} completed`,
      getValue: (p) => p.numCompletedReviews,
    },
    {
      header: `${prettyField(officialMetaReviewName)} completed`,
      getValue: (p) => p.numCompletedMetaReviews,
    },
    ...(seniorAreaChairsId
      ? [
          {
            header: `${prettyField(seniorAreaChairName)} id`,
            getValue: (p) => p.seniorAreaChair?.seniorAreaChairId ?? 'N/A',
          },
          {
            header: `${prettyField(seniorAreaChairName)} name`,
            getValue: (p) => p.seniorAreaChair?.sacProfile?.preferredName ?? 'N/A',
          },
        ]
      : []),
    ...(exportColumnsConfig ?? []),
  ]
  const sortOptions = [
    {
      label: prettyField(areaChairName),
      value: 'Area Chair',
      getValue: (p) => p.number,
    },
    {
      label: `${prettyField(areaChairName)} Name`,
      value: 'Area Chair Name',
      getValue: (p) => p.areaChairProfile?.preferredName ?? p.areaChairProfileId,
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
      label: `${prettyField(reviewerName)} Recommendations Completed`,
      value: 'Reviewer Recommendations Completed',
      getValue: (p) => p.completedRecommendations,
    },
    {
      label: `Number of ${pluralizeString(submissionName)} Assigned`,
      value: 'Number of Papers Assigned',
      getValue: (p) => p.notes?.length,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${pluralizeString(submissionName)} with Missing ${pluralizeString(
        prettyField(officialReviewName)
      )}`,
      value: 'Number of Papers with Missing Reviews',
      getValue: (p) => (p.notes?.length ?? 0) - p.numCompletedReviews ?? 0,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${pluralizeString(submissionName)} with Completed ${pluralizeString(
        prettyField(officialReviewName)
      )}`,
      value: 'Number of Papers with Completed Reviews',
      getValue: (p) => p.numCompletedReviews,
      initialDirection: 'desc',
    },
    {
      label: `Number of Missing ${pluralizeString(prettyField(officialMetaReviewName))}`,
      value: 'Number of Missing MetaReviews',
      getValue: (p) => (p.notes?.length ?? 0) - p.numCompletedMetaReviews,
      initialDirection: 'desc',
    },
    {
      label: `Number of Completed ${pluralizeString(prettyField(officialMetaReviewName))}`,
      value: 'Number of Completed MetaReviews',
      getValue: (p) => p.numCompletedMetaReviews,
      initialDirection: 'desc',
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
      selectedIds={selectedAreaChairIds}
      setSelectedIds={setSelectedAreaChairIds}
      setData={setAreaChairStatusTabData}
      shortPhrase={shortPhrase}
      enableQuerySearch={enableQuerySearch}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      messageDropdownLabel="Message"
      messageOptions={messageAreaChairOptions}
      messageModalId="message-areachairs"
      messageParentGroup={messageParentGroup}
      messageSignature={messageSignature}
      exportColumns={exportColumns}
      exportFileName={`${prettyField(areaChairName)} Status`}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      messageModal={(props) => <MessageACSACModal {...props} />}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
      extraClasses="ac-status-menu"
    />
  )
}

export default AreaChairStatusMenuBar
