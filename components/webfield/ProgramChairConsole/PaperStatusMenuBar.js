import { useContext } from 'react'
import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import WebFieldContext from '../../WebFieldContext'
import BaseMenuBar from '../BaseMenuBar'
import MessageReviewersModal from '../MessageReviewersModal'
import QuerySearchInfoModal from '../QuerySearchInfoModal'
import { pluralizeString, prettyField, prettyId } from '../../../lib/utils'

const PaperStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  selectedNoteIds,
  setSelectedNoteIds,
  setPaperStatusTabData,
  reviewRatingName,
  noteContentField,
  defaultSeniorAreaChairName,
}) => {
  const {
    metaReviewRecommendationName,
    shortPhrase,
    enableQuerySearch,
    areaChairsId,
    seniorAreaChairsId,
    paperStatusExportColumns: exportColumnsConfig,
    filterOperators: filterOperatorsConfig,
    propertiesAllowed: extraPropertiesAllowed,
    customStageInvitations = [],
    additionalMetaReviewFields = [],
    reviewerName,
    seniorAreaChairName = defaultSeniorAreaChairName,
    officialReviewName,
    officialMetaReviewName = 'Meta_Review',
    areaChairName = 'Area_Chairs',
    secondaryAreaChairName,
    submissionName,
    ithenticateInvitationId,
    messageSubmissionSecondaryAreaChairsInvitationId,
  } = useContext(WebFieldContext)
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '==', '=']
  const formattedReviewerName = camelCase(reviewerName)
  const formattedSACName = camelCase(seniorAreaChairName)
  const formattedOfficialReviewName = upperFirst(camelCase(officialReviewName))
  const formattedOfficialMetaReviewName = upperFirst(camelCase(officialMetaReviewName))

  const propertiesAllowed = {
    number: ['note.number'],
    id: ['note.id'],
    title: ['note.content.title.value'],
    author: ['note.content.authors.value', 'note.content.authorids.value'],
    keywords: ['note.content.keywords.value'],
    [formattedReviewerName]: ['reviewers'],
    ...(formattedSACName && { [formattedSACName]: ['metaReviewData.seniorAreaChairs'] }),
    [`num${upperFirst(formattedReviewerName)}Assigned`]: [
      'reviewProgressData.numReviewersAssigned',
    ],
    [`num${formattedOfficialReviewName}Done`]: ['reviewProgressData.numReviewsDone'],
    ...Object.fromEntries(
      (Array.isArray(reviewRatingName)
        ? reviewRatingName.map((p) => (typeof p === 'object' ? Object.keys(p)[0] : p))
        : [reviewRatingName]
      ).flatMap((ratingName) => [
        [`${ratingName}Avg`, [`reviewProgressData.ratings.${ratingName}.ratingAvg`]],
        [`${ratingName}Max`, [`reviewProgressData.ratings.${ratingName}.ratingMax`]],
        [`${ratingName}Min`, [`reviewProgressData.ratings.${ratingName}.ratingMin`]],
      ])
    ),
    confidenceAvg: ['reviewProgressData.confidenceAvg'],
    confidenceMax: ['reviewProgressData.confidenceMax'],
    confidenceMin: ['reviewProgressData.confidenceMin'],
    replyCount: ['reviewProgressData.replyCount'],
    decision: ['decision'],
    venue: ['venue'],
    ...(ithenticateInvitationId && {
      duplication: ['note.ithenticateWeight'],
    }),
    ...(metaReviewRecommendationName && {
      [metaReviewRecommendationName]: ['metaReviewData.metaReviewsSearchValue'],
    }),
    ...(additionalMetaReviewFields?.length > 0 &&
      additionalMetaReviewFields.reduce(
        (prev, curr) => ({
          ...prev,
          [`${formattedOfficialMetaReviewName}${upperFirst(camelCase(curr))}`]: [
            `metaReviewData.${curr}SearchValue`,
          ],
        }),
        {}
      )),
    ...(customStageInvitations?.length > 0 &&
      customStageInvitations.reduce(
        (prev, curr) => ({
          ...prev,
          [camelCase(curr.name)]: [`metaReviewData.metaReviewAgreementSearchValue`],
        }),
        {}
      )),
    ...(typeof extraPropertiesAllowed === 'object' &&
      Object.fromEntries(
        Object.entries(extraPropertiesAllowed).map(([key, value]) => {
          if (typeof value === 'string') {
            return [key, [key]]
          }
          return [key, value]
        })
      )),
  }

  const functionExtraProperties = (() => {
    if (typeof extraPropertiesAllowed !== 'object') return {}
    const result = {}
    Object.entries(extraPropertiesAllowed).forEach(([key, value]) => {
      if (Array.isArray(value)) return
      try {
        result[key] = Function('row', value) // eslint-disable-line no-new-func
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error parsing function for extra property ${key}: ${error}`)
      }
    })
    return result
  })()

  const tableRowsAllWithFilterProperties =
    Object.keys(functionExtraProperties).length > 0
      ? tableRowsAll.map((row) => {
          const extraProperties = {}
          // eslint-disable-next-line no-restricted-syntax
          for (const [key, value] of Object.entries(functionExtraProperties)) {
            extraProperties[key] = value(row)
          }
          return { ...row, ...extraProperties }
        })
      : tableRowsAll

  Object.keys(propertiesAllowed).forEach((key) => {
    if (!Array.isArray(propertiesAllowed[key]) || propertiesAllowed[key].length === 0) {
      delete propertiesAllowed[key]
    }
  })

  const messageReviewerOptions = [
    {
      label: `All ${prettyField(reviewerName)} of selected ${pluralizeString(submissionName)}`,
      value: 'allReviewers',
    },
    {
      label: `${prettyField(reviewerName)} of selected ${pluralizeString(
        submissionName
      )} with submitted ${pluralizeString(prettyField(officialReviewName).toLowerCase())}`,
      value: 'withReviews',
    },
    {
      label: `${prettyField(reviewerName)} of selected ${pluralizeString(
        submissionName
      )} with unsubmitted ${pluralizeString(prettyField(officialReviewName).toLowerCase())}`,
      value: 'missingReviews',
    },
    ...(areaChairsId
      ? [
          {
            label: `All ${pluralizeString(
              prettyField(areaChairName)
            )} of selected ${pluralizeString(submissionName)}`,
            value: 'allAreaChairs',
          },
        ]
      : []),
    ...(secondaryAreaChairName && messageSubmissionSecondaryAreaChairsInvitationId
      ? [
          {
            label: `All ${pluralizeString(
              prettyField(secondaryAreaChairName)
            )} of selected ${pluralizeString(submissionName)}`,
            value: 'allSecondaryAreaChairs',
          },
        ]
      : []),
    ...(tableRowsAll?.length !== selectedNoteIds?.length
      ? [
          {
            label: `All Authors of selected ${pluralizeString(submissionName)}`,
            value: 'allAuthors',
          },
          ...(seniorAreaChairsId
            ? [
                {
                  label: `All ${prettyField(seniorAreaChairName ?? 'Senior_Area_Chairs')} of selected ${pluralizeString(submissionName)}`,
                  value: 'allSACs',
                },
              ]
            : []),
        ]
      : []),
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
    ...(ithenticateInvitationId
      ? [
          {
            header: 'Duplication %',
            getValue: (p) => p.note?.ithenticateWeight,
          },
        ]
      : []),
    {
      header: `num ${prettyField(reviewerName)}`,
      getValue: (p) => p.reviewProgressData?.numReviewersAssigned,
    },
    {
      header: `num submitted ${prettyField(reviewerName)}`,
      getValue: (p) => p.reviewProgressData?.numReviewsDone,
    },
    {
      header: `missing ${prettyField(reviewerName)}`,
      getValue: (p) =>
        p.reviewers
          ?.filter((q) => !q.hasReview)
          ?.map((r) => r.reviewerProfileId)
          ?.join('|'),
    },
    ...(Array.isArray(reviewRatingName)
      ? reviewRatingName.map((p) => (typeof p === 'object' ? Object.keys(p)[0] : p))
      : [reviewRatingName]
    ).flatMap((ratingName) => [
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
    ]),
    { header: 'min confidence', getValue: (p) => p.reviewProgressData?.confidenceMin },
    { header: 'max confidence', getValue: (p) => p.reviewProgressData?.confidenceMax },
    { header: 'average confidence', getValue: (p) => p.reviewProgressData?.confidenceAvg },
    {
      header: `num ${prettyField(areaChairName)} assigned`,
      getValue: (p) => p.metaReviewData?.numAreaChairsAssigned,
    },
    {
      header: `num submitted ${prettyField(areaChairName)}`,
      getValue: (p) => p.metaReviewData?.numMetaReviewsDone,
    },
    {
      header: prettyField(officialMetaReviewName),
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
            header: prettyField(seniorAreaChairName),
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
    ...(noteContentField !== undefined &&
    typeof noteContentField === 'object' &&
    'field' in noteContentField
      ? [
          {
            header: noteContentField.field,
            getValue: (p) => p.note?.content[noteContentField.field].value.toString() ?? 'N/A',
          },
        ]
      : []),
  ]

  const getValueWithDefault = (value) => {
    if (!value || value === 'N/A') return 0
    return value
  }

  const sortOptions = [
    {
      label: `${submissionName} Number`,
      value: 'Paper Number',
      getValue: (p) => p.note?.number,
    },
    {
      label: `${submissionName} Title`,
      value: 'Paper Title',
      getValue: (p) =>
        p.note?.version === 2 ? p.note?.content?.title?.value : p.note?.content?.title,
    },
    ...(noteContentField !== undefined &&
    typeof noteContentField === 'object' &&
    'field' in noteContentField
      ? [
          {
            label: prettyField(noteContentField.field),
            value: prettyField(noteContentField.field),
            getValue: (p) => p.note?.content[noteContentField.field].value.toString() ?? 'N/A',
          },
        ]
      : []),
    {
      label: 'Number of Forum Replies',
      value: 'Number of Forum Replies',
      getValue: (p) => p.reviewProgressData?.replyCount,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${prettyField(reviewerName)} Assigned`,
      value: 'Number of Reviewers Assigned',
      getValue: (p) => p.reviewProgressData?.numReviewersAssigned,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${prettyField(officialReviewName)} Submitted`,
      value: 'Number of Reviews Submitted',
      getValue: (p) => p.reviewProgressData?.numReviewsDone,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${prettyField(officialReviewName)} Missing`,
      value: 'Number of Reviews Missing',
      getValue: (p) =>
        getValueWithDefault(p.reviewProgressData?.numReviewersAssigned) -
        getValueWithDefault(p.reviewProgressData?.numReviewsDone),
      initialDirection: 'desc',
    },
    ...(Array.isArray(reviewRatingName)
      ? reviewRatingName.map((p) => (typeof p === 'object' ? Object.keys(p)[0] : p))
      : [reviewRatingName]
    ).flatMap((ratingName) => [
      {
        label: `Average ${prettyField(ratingName)}`,
        value: `Average ${ratingName}`,
        getValue: (p) => {
          const stringAvgRatingValue = getValueWithDefault(
            p.reviewProgressData?.ratings?.[ratingName]?.ratingAvg
          )
          const numberAvgRatingValue = Number(stringAvgRatingValue)
          return Number.isNaN(numberAvgRatingValue)
            ? stringAvgRatingValue
            : numberAvgRatingValue
        },
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
    ]),
    {
      label: 'Average Confidence',
      value: 'Average Confidence',
      getValue: (p) => {
        const stringAvgConfidenceValue = getValueWithDefault(
          p.reviewProgressData?.confidenceAvg
        )
        const numberAvgConfidenceValue = Number(stringAvgConfidenceValue)
        return Number.isNaN(numberAvgConfidenceValue)
          ? stringAvgConfidenceValue
          : numberAvgConfidenceValue
      },
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
      label: `${prettyField(officialMetaReviewName)} Missing`,
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
    {
      label: 'Venue',
      value: 'Venue',
      getValue: (p) => p.venue,
    },
    ...(ithenticateInvitationId
      ? [
          {
            label: 'Duplication %',
            value: 'ithenticateWeight',
            getValue: (p) => p.note?.ithenticateWeight,
          },
        ]
      : []),
  ]

  const basicSearchFunction = (row, term) =>
    row.note.number == term || // eslint-disable-line eqeqeq
    row.note.content?.title?.value?.toLowerCase()?.includes(term)
  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAllWithFilterProperties}
      tableRows={tableRows}
      selectedIds={selectedNoteIds}
      setSelectedIds={setSelectedNoteIds}
      setData={setPaperStatusTabData}
      shortPhrase={shortPhrase}
      enableQuerySearch={enableQuerySearch}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      messageOptions={messageReviewerOptions}
      messageModalId="message-reviewers"
      exportColumns={exportColumns}
      exportFileName={`${submissionName} Status`}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      messageModal={(props) => <MessageReviewersModal {...props} />}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
    />
  )
}

export default PaperStatusMenuBar
