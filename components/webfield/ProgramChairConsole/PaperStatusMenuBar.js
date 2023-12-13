import { useContext } from 'react'
import { camelCase } from 'lodash'
import WebFieldContext from '../../WebFieldContext'
import BaseMenuBar from '../BaseMenuBar'
import MessageReviewersModal from '../MessageReviewersModal'
import QuerySearchInfoModal from '../QuerySearchInfoModal'
import { prettyField, prettyId } from '../../../lib/utils'

const PaperStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  selectedNoteIds,
  setPaperStatusTabData,
  reviewRatingName,
}) => {
  const {
    apiVersion,
    metaReviewRecommendationName,
    shortPhrase,
    enableQuerySearch,
    seniorAreaChairsId,
    paperStatusExportColumns: exportColumnsConfig,
    filterOperators: filterOperatorsConfig,
    propertiesAllowed: extraPropertiesAllowed,
    customStageInvitations = [],
  } = useContext(WebFieldContext)
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '==', '=']
  const propertiesAllowed = {
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
    decision: ['decision'],
    venue: ['venue'],
    ...(metaReviewRecommendationName && {
      [metaReviewRecommendationName]: ['metaReviewData.metaReviewsSearchValue'],
    }),
    ...(customStageInvitations?.length > 0 &&
      customStageInvitations.reduce(
        (prev, curr) => ({
          ...prev,
          [camelCase(curr.name)]: [`metaReviewData.metaReviewAgreementSearchValue`],
        }),
        {}
      )),
    ...(typeof extraPropertiesAllowed === 'object' && extraPropertiesAllowed),
  }

  Object.keys(propertiesAllowed).forEach((key) => {
    if (!Array.isArray(propertiesAllowed[key]) || propertiesAllowed[key].length === 0) {
      delete propertiesAllowed[key]
    }
  })

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
    {
      header: 'num area chairs assigned',
      getValue: (p) => p.metaReviewData?.numAreaChairsAssigned,
    },
    {
      header: 'area chairs contact info',
      getValue: (p) =>
        p.metaReviewData?.areaChairs
          ?.map((q) => `${q.preferredName}<${q.preferredEmail}>`)
          .join(','),
    },
    {
      header: 'num submitted area chairs',
      getValue: (p) => p.metaReviewData?.numMetaReviewsDone,
    },
    {
      header: 'meta reviews',
      getValue: (p) =>
        p.metaReviewData?.metaReviews?.map((q) => q[metaReviewRecommendationName])?.join('|'),
    },
    {
      header: 'decision',
      getValue: (p) => p.decision,
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
            p.metaReviewData?.metaReviews
              ?.map((q) => q.metaReviewAgreement?.searchValue)
              .join('|'),
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
      initialDirection: 'desc',
    },
    {
      label: 'Number of Reviewers Assigned',
      value: 'Number of Reviewers Assigned',
      getValue: (p) => p.reviewProgressData?.numReviewersAssigned,
      initialDirection: 'desc',
    },
    {
      label: 'Number of Reviews Submitted',
      value: 'Number of Reviews Submitted',
      getValue: (p) => p.reviewProgressData?.numReviewsDone,
      initialDirection: 'desc',
    },
    {
      label: 'Number of Reviews Missing',
      value: 'Number of Reviews Missing',
      getValue: (p) =>
        getValueWithDefault(p.reviewProgressData?.numReviewersAssigned) -
        getValueWithDefault(p.reviewProgressData?.numReviewsDone),
      initialDirection: 'desc',
    },
    ...(Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).flatMap(
      (ratingName) => [
        {
          label: `Average ${prettyField(ratingName)}`,
          value: `Average ${ratingName}`,
          getValue: (p) =>
            getValueWithDefault(p.reviewProgressData?.ratings?.[ratingName]?.ratingAvg),
        },
        {
          label: `Max ${prettyField(ratingName)}`,
          value: `Max ${ratingName}`,
          getValue: (p) =>
            getValueWithDefault(p.reviewProgressData?.ratings?.[ratingName]?.ratingMax),
        },
        {
          label: `Min ${prettyField(ratingName)}`,
          value: `Min ${ratingName}`,
          getValue: (p) =>
            getValueWithDefault(p.reviewProgressData?.ratings?.[ratingName]?.ratingMin),
        },
        {
          label: `${prettyField(ratingName)} Range`,
          value: `${ratingName} Range`,
          getValue: (p) =>
            getValueWithDefault(p.reviewProgressData?.ratings?.[ratingName]?.ratingMax) -
            getValueWithDefault(p.reviewProgressData?.ratings?.[ratingName]?.ratingMin),
        },
      ]
    ),
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
      initialDirection: 'desc',
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

  const basicSearchFunction = (row, term) =>
    row.note.number == term || // eslint-disable-line eqeqeq
    row.note.content?.title?.value?.toLowerCase()?.includes(term)
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
