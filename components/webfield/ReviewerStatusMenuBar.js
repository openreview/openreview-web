import BaseMenuBar from './BaseMenuBar'
import { ReviewStatusMessageReviewersModal } from './MessageModal'

const ReviewerStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  selectedNoteIds,
  setReviewerStatusTabData,
  shortPhrase,
  exportColumns: exportColumnsConfig,
  bidEnabled,
  messageParentGroup,
}) => {
  const messageAreaChairOptions = [
    ...(bidEnabled
      ? [
          {
            label: 'Reviewers with 0 bids',
            value: 'noBids',
          },
        ]
      : []),
    { label: 'Reviewers with unsubmitted reviews', value: 'missingReviews' },
  ]

  const exportColumns = exportColumnsConfig ?? [
    { header: 'id', getValue: (p) => p.reviewerProfileId },
    {
      header: 'name',
      getValue: (p) => p.reviewerProfile?.preferredName ?? p.reviewerProfileId,
    },
    {
      header: 'email',
      getValue: (p) => p.reviewerProfile?.preferredEmail ?? p.reviewerProfileId,
    },
    {
      header: 'institution name',
      getValue: (p) => p.reviewerProfile?.content?.history?.[0]?.institution?.name ?? '',
    },
    {
      header: 'institution domain',
      getValue: (p) => p.reviewerProfile?.content?.history?.[0]?.institution?.domain ?? '',
    },
    { header: 'num assigned papers', getValue: (p) => p.notesInfo.length },
    { header: 'num submitted reviews', getValue: (p) => p.numCompletedReviews },
  ]

  const sortOptions = [
    {
      label: 'Reviewer Name',
      value: 'Reviewer Name',
      getValue: (p) =>
        p.reviewerProfile?.preferredName.toLowerCase() ?? p.reviewerProfileId.toLowerCase(),
    },
    {
      label: 'Bids Completed',
      value: 'Bids Completed',
      getValue: (p) => p.completedBids,
    },
    {
      label: 'Papers Assigned',
      value: 'Papers Assigned',
      getValue: (p) => p.notesInfo.length,
    },
    {
      label: 'Papers with Reviews Missing',
      value: 'Papers with Reviews Missing',
      getValue: (p) => p.notesInfo.length - p.numCompletedReviews,
    },
    {
      label: 'Papers with Reviews Submitted',
      value: 'Papers with Reviews Submitted',
      getValue: (p) => p.numCompletedReviews,
    },
    {
      label: 'Papers with Completed Reviews Missing',
      value: 'Papers with Completed Reviews Missing',
      getValue: (p) => p.notesInfo.length - p.numOfPapersWhichCompletedReviews,
    },
    {
      label: 'Papers with Completed Reviews',
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
      selectedIds={selectedNoteIds}
      setData={setReviewerStatusTabData}
      shortPhrase={shortPhrase}
      messageDropdownLabel="Message Reviewers"
      messageOptions={messageAreaChairOptions}
      messageModalId="message-reviewers"
      messageParentGroup={messageParentGroup}
      exportColumns={exportColumns}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      messageModal={(props) => <ReviewStatusMessageReviewersModal {...props} />}
      searchPlaceHolder="Search all reviewers..."
      extraClasses="ac-status-menu"
    />
  )
}

export default ReviewerStatusMenuBar
