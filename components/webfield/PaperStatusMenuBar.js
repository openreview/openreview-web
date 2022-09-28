import BaseMenuBar from './BaseMenuBar'
import { MessageReviewersModal } from './MessageModal'
import QuerySearchInfoModal from './QuerySearchInfoModal'

const PaperStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  selectedNoteIds,
  setPaperStatusTabData,
  shortPhrase,
  enableQuerySearch,
  filterOperators: filterOperatorsConfig,
  propertiesAllowed: propertiesAllowedConfig,
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
  const messageReviewerOptions = [
    { label: 'All Reviewers of selected papers', value: 'allReviewers' },
    { label: 'Reviewers of selected papers with submitted reviews', value: 'withReviews' },
    {
      label: 'Reviewers of selected papers with unsubmitted reviews',
      value: 'missingReviews',
    },
  ]
  const sortOptions = [
    { label: 'Paper Number', value: 'Paper Number', getValue: (p) => p.note?.number },
    {
      label: 'Paper Title',
      value: 'Paper Title',
      getValue: (p) =>
        p.note?.version === 2 ? p.note?.content?.title?.value : p.note?.content?.title,
    },
    {
      label: 'Number of Forum Replies',
      value: 'Number of Forum Replies',
      getValue: (p) => p.reviewProgressData?.replyCount,
    },
    {
      label: 'Number of Reviews Submitted',
      value: 'Number of Reviews Submitted',
      getValue: (p) => p.reviewProgressData?.numReviewsDone,
    },
    {
      label: 'Number of Reviews Missing',
      value: 'Number of Reviews Missing',
      getValue: (p) =>
        (p.reviewProgressData?.numReviewersAssigned ?? 0) -
        (p.reviewProgressData?.numReviewsDone ?? 0),
    },
    {
      label: 'Average Rating',
      value: 'Average Rating',
      getValue: (p) =>
        p.reviewProgressData?.ratingAvg === 'N/A' ? 0 : p.reviewProgressData?.ratingAvg,
    },
    {
      label: 'Max Rating',
      value: 'Max Rating',
      getValue: (p) =>
        p.reviewProgressData?.ratingMax === 'N/A' ? 0 : p.reviewProgressData?.ratingMax,
    },
    {
      label: 'Min Rating',
      value: 'Min Rating',
      getValue: (p) =>
        p.reviewProgressData?.ratingMin === 'N/A' ? 0 : p.reviewProgressData?.ratingMin,
    },
    {
      label: 'Average Confidence',
      value: 'Average Confidence',
      getValue: (p) =>
        p.reviewProgressData?.confidenceAvg === 'N/A'
          ? 0
          : p.reviewProgressData?.confidenceAvg,
    },
    {
      label: 'Max Confidence',
      value: 'Max Confidenc',
      getValue: (p) =>
        p.reviewProgressData?.confidenceMax === 'N/A'
          ? 0
          : p.reviewProgressData?.confidenceMax,
    },
    {
      label: 'Min Confidence',
      value: 'Min Confidence',
      getValue: (p) =>
        p.reviewProgressData?.confidenceMin === 'N/A'
          ? 0
          : p.reviewProgressData?.confidenceMin,
    },
    {
      label: 'Meta Review Recommendation',
      value: 'Meta Review Recommendation',
      getValue: (p) => p.metaReviewData?.recommendation,
    },
  ]
  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      selectedIds={selectedNoteIds}
      setData={setPaperStatusTabData}
      shortPhrase={shortPhrase}
      enableQuerySearch={enableQuerySearch}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      messageOptions={messageReviewerOptions}
      messageModalId="message-reviewers"
      sortOptions={sortOptions}
      messageModal={(props) => {
        console.log(props)
        return <MessageReviewersModal {...props} />
      }}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
    />
  )
}

export default PaperStatusMenuBar
