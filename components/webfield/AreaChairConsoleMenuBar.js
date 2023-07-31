import BaseMenuBar from './BaseMenuBar'
import MessageReviewersModal from './MessageReviewersModal'
import QuerySearchInfoModal from './QuerySearchInfoModal'

const AreaChairConsoleMenuBar = ({
  tableRowsAll,
  tableRows,
  selectedNoteIds,
  setAcConsoleData,
  shortPhrase,
  enableQuerySearch,
  filterOperators: filterOperatorsConfig,
  propertiesAllowed: propertiesAllowedConfig,
  reviewRatingName,
}) => {
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '==', '='] // sequence matters
  const propertiesAllowed = propertiesAllowedConfig ?? {
    number: ['note.number'],
    id: ['note.id'],
    title: ['note.content.title.value'],
    author: ['note.content.authors.value', 'note.content.authorids.value'],
    keywords: ['note.content.keywords.value'],
    reviewer: ['reviewers'],
    numReviewersAssigned: ['reviewProgressData.numReviewersAssigned'],
    numReviewsDone: ['reviewProgressData.numReviewsDone'],
    ...Object.fromEntries(
      (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).flatMap(
        (ratingName) => [
          [`${ratingName}Avg`, [`reviewProgressData.ratings.${ratingName}.ratingAvg`]],
          [`${ratingName}Max`, [`reviewProgressData.ratings.${ratingName}.ratingMax`]],
          [`${ratingName}Min`, [`reviewProgressData.ratings.${ratingName}.ratingMin`]],
        ]
      )
    ),
    confidenceAvg: ['reviewProgressData.confidenceAvg'],
    confidenceMax: ['reviewProgressData.confidenceMax'],
    confidenceMin: ['reviewProgressData.confidenceMin'],
    replyCount: ['reviewProgressData.replyCount'],
    recommendation: ['metaReviewData.recommendation'],
  }
  const messageReviewerOptions = [
    { label: 'All Reviewers of selected papers', value: 'allReviewers' },
    { label: 'Reviewers of selected papers with submitted reviews', value: 'withReviews' },
    {
      label: 'Reviewers of selected papers with unsubmitted reviews',
      value: 'missingReviews',
    },
  ]
  const exportColumns = [
    { header: 'number', getValue: (p) => p.note?.number },
    { header: 'forum', getValue: (p) => `https://openreview.net/forum?id=${p.note?.forum}` },
    {
      header: 'title',
      getValue: (p) => p.note?.content?.title?.value,
    },
    {
      header: 'abstract',
      getValue: (p) => p.note?.content?.abstract?.value,
    },
    { header: 'num reviewers', getValue: (p) => p.reviewProgressData?.numReviewersAssigned },
    {
      header: 'num submitted reviewers',
      getValue: (p) => p.reviewProgressData?.numReviewsDone,
    },
    {
      header: 'missing reviewers',
      getValue: (p) =>
        p.reviewers
          ?.filter((q) => !q.hasReview)
          ?.map((r) => r.reviewerProfileId)
          ?.join('|'),
    },
    {
      header: 'reviewer contact info',
      getValue: (p) =>
        p.reviewers.map((q) => `${q.preferredName}<${q.preferredEmail}>`).join(','),
    },
    ...(Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).flatMap(
      (ratingName) => [
        {
          header: `min ${ratingName}`,
          getValue: (p) => p.reviewProgressData?.ratings?.[ratingName]?.ratingMin,
        },
        {
          header: `max ${ratingName}`,
          getValue: (p) => p.reviewProgressData?.ratings?.[ratingName]?.ratingMax,
        },
        {
          header: `average ${ratingName}`,
          getValue: (p) => p.reviewProgressData?.ratings?.[ratingName]?.ratingAvg,
        },
      ]
    ),
    { header: 'min confidence', getValue: (p) => p.reviewProgressData?.confidenceMin },
    { header: 'max confidence', getValue: (p) => p.reviewProgressData?.confidenceMax },
    { header: 'average confidence', getValue: (p) => p.reviewProgressData?.confidenceAvg },
    { header: 'ac recommendation', getValue: (p) => p.metaReviewData?.recommendation },
  ]
  const sortOptions = [
    { label: 'Paper Number', value: 'Paper Number', getValue: (p) => p.note?.number },
    {
      label: 'Paper Title',
      value: 'Paper Title',
      getValue: (p) => p.note?.content?.title?.value,
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
    ...(Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).flatMap(
      (ratingName) => [
        {
          label: `Average ${ratingName}`,
          value: `Average ${ratingName}`,
          getValue: (p) =>
            p.reviewProgressData?.ratings?.[ratingName]?.ratingAvg === 'N/A'
              ? 0
              : p.reviewProgressData?.ratings?.[ratingName]?.ratingAvg,
        },
        {
          label: `Max ${ratingName}`,
          value: `Max ${ratingName}`,
          getValue: (p) =>
            p.reviewProgressData?.ratings?.[ratingName]?.ratingMax === 'N/A'
              ? 0
              : p.reviewProgressData?.ratings?.[ratingName]?.ratingMax,
        },
        {
          label: `Min ${ratingName}`,
          value: `Min ${ratingName}`,
          getValue: (p) =>
            p.reviewProgressData?.ratings?.[ratingName]?.ratingMin === 'N/A'
              ? 0
              : p.reviewProgressData?.ratings?.[ratingName]?.ratingMin,
        },
      ]
    ),
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
      getValue: (p) =>
        p.metaReviewData?.recommendation === 'N/A' ? null : p.metaReviewData?.recommendation,
    },
  ]
  const basicSearchFunction = (row, term) => {
    const noteTitle = row.note.content?.title?.value
    return (
      row.note.number == term || // eslint-disable-line eqeqeq
      noteTitle.toLowerCase().includes(term)
    )
  }
  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      selectedIds={selectedNoteIds}
      setData={setAcConsoleData}
      shortPhrase={shortPhrase}
      enableQuerySearch={enableQuerySearch}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      messageOptions={messageReviewerOptions}
      messageModalId="message-reviewers"
      exportColumns={exportColumns}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      messageModal={(props) => <MessageReviewersModal {...props} />}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
      enablePDFDownload={true}
    />
  )
}

export default AreaChairConsoleMenuBar
