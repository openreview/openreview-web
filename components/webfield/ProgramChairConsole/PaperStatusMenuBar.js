import { useContext } from 'react'
import { camelCase } from 'lodash'
import WebFieldContext from '../../WebFieldContext'
import BaseMenuBar from '../BaseMenuBar'
import MessageReviewersModal from '../MessageReviewersModal'
import QuerySearchInfoModal from '../QuerySearchInfoModal'
import { prettyId } from '../../../lib/utils'

const PaperStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  selectedNoteIds,
  setPaperStatusTabData,
}) => {
  const {
    apiVersion,
    recommendationName,
    shortPhrase,
    enableQuerySearch,
    seniorAreaChairsId,
    exportColumns: exportColumnsConfig,
    filterOperators: filterOperatorsConfig,
    propertiesAllowed: propertiesAllowedConfig,
    customStageInvitations = [],
  } = useContext(WebFieldContext)
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '==', '=']
  const propertiesAllowed = propertiesAllowedConfig ?? {
    number: ['note.number'],
    id: ['note.id'],
    title: ['note.content.title', 'note.content.title.value'],
    author: [
      'note.content.authors',
      'note.content.authorids',
      'note.content.authors.value',
      'note.content.authorids.value',
      'note.details.original.content.authors',
      'note.details.original.content.authorids',
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
    decision: ['decision'],
    ...(apiVersion === 2 && {
      venue: ['venue'],
    }),
    ...(recommendationName && {
      [recommendationName]: [`metaReviewData.metaReviews.${recommendationName}`],
    }),
    ...(customStageInvitations?.length > 0 &&
      customStageInvitations.reduce(
        (prev, curr) => ({
          ...prev,
          [camelCase(curr.name)]: [
            `metaReviewData.customStageReviews.${camelCase(curr.name)}.searchValue`,
          ],
        }),
        {}
      )),
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
      getValue: (p, isV2Note) =>
        isV2Note ? p.note?.content?.title?.value : p.note?.content?.title,
    },
    {
      header: 'abstract',
      getValue: (p, isV2Note) =>
        isV2Note ? p.note?.content?.abstract?.value : p.note?.content?.abstract,
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
    { header: 'min rating', getValue: (p) => p.reviewProgressData?.ratingMin },
    { header: 'max rating', getValue: (p) => p.reviewProgressData?.ratingMax },
    { header: 'average rating', getValue: (p) => p.reviewProgressData?.ratingAvg },
    { header: 'min confidence', getValue: (p) => p.reviewProgressData?.confidenceMin },
    { header: 'max confidence', getValue: (p) => p.reviewProgressData?.confidenceMax },
    { header: 'average confidence', getValue: (p) => p.reviewProgressData?.confidenceAvg },
    {
      header: 'num area chairs assigned',
      getValue: (p) => p.metaReviewData?.numAreaChairsAssigned,
    },
    {
      header: 'num submitted area chairs',
      getValue: (p) => p.metaReviewData?.numMetaReviewsDone,
    },
    {
      header: 'meta reviews',
      getValue: (p) =>
        p.metaReviewData?.metaReviews?.map((q) => q[recommendationName])?.join('|'),
    },
    ...(seniorAreaChairsId
      ? [
          {
            header: 'senior area chairs',
            getValue: (p) =>
              p.metaReviewData?.seniorAreaChairs?.map((q) => q.preferredName).join('|'),
          },
        ]
      : []),
    ...(customStageInvitations?.length > 0
      ? customStageInvitations.map((invitation) => ({
          header: prettyId(invitation.name),
          getValue: (p) =>
            p.metaReviewData?.customStageReviews?.[camelCase(invitation.name)]?.searchValue,
        }))
      : []),
    ...(exportColumnsConfig ?? []),
  ]

  const getValueWithDefault = (value) => {
    if (!value || value === 'N/A') return 0
    return value
  }

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
      label: 'Number of Reviewers Assigned',
      value: 'Number of Reviewers Assigned',
      getValue: (p) => p.reviewProgressData?.numReviewersAssigned,
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
        getValueWithDefault(p.reviewProgressData?.numReviewersAssigned) -
        getValueWithDefault(p.reviewProgressData?.numReviewsDone),
    },
    {
      label: 'Average Rating',
      value: 'Average Rating',
      getValue: (p) => getValueWithDefault(p.reviewProgressData?.ratingAvg),
    },
    {
      label: 'Max Rating',
      value: 'Max Rating',
      getValue: (p) => getValueWithDefault(p.reviewProgressData?.ratingMax),
    },
    {
      label: 'Min Rating',
      value: 'Min Rating',
      getValue: (p) => getValueWithDefault(p.reviewProgressData?.ratingMin),
    },
    {
      label: 'Rating Range',
      value: 'Rating Range',
      getValue: (p) =>
        getValueWithDefault(p.reviewProgressData.ratingMax) -
        getValueWithDefault(p.reviewProgressData?.ratingMin),
    },
    {
      label: 'Average Confidence',
      value: 'Average Confidence',
      getValue: (p) => getValueWithDefault(p.reviewProgressData?.confidenceAvg),
    },
    {
      label: 'Max Confidence',
      value: 'Max Confidenc',
      getValue: (p) => getValueWithDefault(p.reviewProgressData?.confidenceMax),
    },
    {
      label: 'Min Confidence',
      value: 'Min Confidence',
      getValue: (p) => getValueWithDefault(p.reviewProgressData?.confidenceMin),
    },
    {
      label: 'Confidence Range',
      value: 'Confidence Range',
      getValue: (p) =>
        getValueWithDefault(p.reviewProgressData?.confidenceMax) -
        getValueWithDefault(p.reviewProgressData?.confidenceMin),
    },
    {
      label: 'Meta Review Missing',
      value: 'Meta Review Missing',
      getValue: (p) =>
        getValueWithDefault(p.metaReviewData?.areaChairs?.length) -
        getValueWithDefault(p.metaReviewData?.metaReviews?.length),
    },
    {
      label: 'Decision',
      value: 'Decision',
      getValue: (p) => p.decision,
    },
    ...(apiVersion === 2
      ? [
          {
            label: 'Venue',
            value: 'Venue',
            getValue: (p) => p.venue,
          },
        ]
      : []),
  ]
  const basicSearchFunction = (row, term) => {
    const noteTitle =
      row.note.version === 2 ? row.note.content?.title?.value : row.note.content?.title
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
      setData={setPaperStatusTabData}
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
    />
  )
}

export default PaperStatusMenuBar
