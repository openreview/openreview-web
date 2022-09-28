import BaseMenuBar from './BaseMenuBar'
import { MessageAreaChairsModal } from './MessageModal'
import QuerySearchInfoModal from './QuerySearchInfoModal'

const AreaChairStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  selectedNoteIds,
  setAreaChairStatusTabData,
  shortPhrase,
  enableQuerySearch,
  filterOperators: filterOperatorsConfig,
  propertiesAllowed: propertiesAllowedConfig,
  bidEnabled,
  recommendationEnabled,
}) => {
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '=']
  const propertiesAllowed = propertiesAllowedConfig ?? {
    number: ['note.number'],
    id: ['note.id'],
    title: ['note.content.title', 'note.content.title.value'],
    author: [
      'note.content.authors',
      'note.content.authorids',
      'note.content.authors.value',
      'note.content.authorids.value',
    ],
    keywords: ['note.content.keywords', 'note.content.keywords.value'],
    reviewer: ['reviewers'],
    numReviewersAssigned: ['reviewProgressData.numReviewersAssigned'],
    numReviewsDone: ['reviewProgressData.numReviewsDone'],
    ratingAvg: ['reviewProgressData.ratingAvg'],
    ratingMax: ['reviewProgressData.ratingMax'],
    ratingMin: ['reviewProgressData.ratingMin'],
    confidenceAvg: ['reviewProgressData.confidenceAvg'],
    confidenceMax: ['reviewProgressData.confidenceMax'],
    confidenceMin: ['reviewProgressData.confidenceMin'],
    replyCount: ['reviewProgressData.replyCount'],
    decision: ['metaReviewData.recommendation'],
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
  ]
  const sortOptions = [
    // TODO: ac status tab sort options
    {
      label: 'Area Chair',
      value: 'Area Chair',
      getValue: (p) => p,
    },
    {
      label: 'Bids Completed',
      value: 'Bids Completed',
      getValue: (p) => p,
    },
    {
      label: 'Reviewer Recommendations Completed',
      value: 'Reviewer Recommendations Completed',
      getValue: (p) => p,
    },
    {
      label: 'Papers Assigned',
      value: 'Papers Assigned',
      getValue: (p) => p,
    },
    {
      label: 'Papers with Completed Review Missing',
      value: 'Papers with Completed Review Missing',
      getValue: (p) => p,
    },
    {
      label: 'Papers with Completed Review',
      value: 'Papers with Completed Review',
      getValue: (p) => p,
    },
    {
      label: 'Papers with Completed MetaReview Missing',
      value: 'Papers with Completed MetaReview Missing',
      getValue: (p) => p,
    },
    {
      label: 'Papers with Completed MetaReview',
      value: 'Papers with Completed MetaReview',
      getValue: (p) => p,
    },
  ]
  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      selectedIds={selectedNoteIds}
      setData={setAreaChairStatusTabData}
      shortPhrase={shortPhrase}
      enableQuerySearch={enableQuerySearch}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      messageOptions={messageAreaChairOptions}
      messageModalId="message-areachairs"
      sortOptions={sortOptions}
      messageModal={(props) => <MessageAreaChairsModal {...props} />}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
    />
  )
}

export default AreaChairStatusMenuBar
