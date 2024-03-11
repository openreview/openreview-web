/* globals $,promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { camelCase, upperFirst } from 'lodash'
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import {
  getIndentifierFromGroup,
  getNumberFromGroup,
  getProfileName,
  prettyId,
  parseNumberField,
  isValidEmail,
  prettyField,
} from '../../lib/utils'
import {
  BiddingStatsRow,
  RecruitmentStatsRow,
  SubmissionsStatsRow,
  MetaReviewStatsRow,
  CustomStageStatsRow,
  DecisionStatsRow,
  DescriptionTimelineOtherConfigRow,
  StatContainer,
  renderStat,
} from './ProgramChairConsole/Overview'
import AreaChairStatus from './ProgramChairConsole/AreaChairStatus'
import SeniorAreaChairStatus from './ProgramChairConsole/SeniorAreaChairStatus'
import ReviewerStatusTab from './ProgramChairConsole/ReviewerStatus'
import ErrorDisplay from '../ErrorDisplay'
import RejectedWithdrawnPapers from './ProgramChairConsole/RejectedWithdrawnPapers'
import MessageReviewersModal from './MessageReviewersModal'
import LoadingSpinner from '../LoadingSpinner'
import Table from '../Table'
import NoteSummary from './NoteSummary'
import { AcPcConsoleReviewerStatusRow } from './NoteReviewStatus'
import { ProgramChairConsolePaperAreaChairProgress } from './NoteMetaReviewStatus'
import PaginationLinks from '../PaginationLinks'
import Collapse from '../Collapse'
import BaseMenuBar from './BaseMenuBar'
import QuerySearchInfoModal from './QuerySearchInfoModal'

const SelectAllCheckBox = ({ selectedNoteIds, setSelectedNoteIds, allNoteIds }) => {
  const allNotesSelected = selectedNoteIds.length === allNoteIds?.length

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedNoteIds(allNoteIds)
      return
    }
    setSelectedNoteIds([])
  }
  return (
    <input
      type="checkbox"
      id="select-all-papers"
      checked={allNotesSelected}
      onChange={handleSelectAll}
    />
  )
}

const AcPcConsoleNoteReviewStatus = ({
  rowData,
  venueId,
  officialReviewName,
  referrerUrl,
  shortPhrase,
  submissionName,
  reviewerAssignmentUrl,
  reviewProgressData,
  reviewers,
  officialReviews,
}) => {
  const { note } = rowData
  const { reviewRatingName } = useContext(WebFieldContext)
  const {
    numReviewsDone,
    numReviewersAssigned,
    replyCount,
    ratings,
    confidenceMax,
    confidenceMin,
    confidenceAvg,
  } = reviewProgressData ?? {}
  const paperManualReviewerAssignmentUrl = reviewerAssignmentUrl?.replace(
    'edges/browse?',
    `edges/browse?start=staticList,type:head,ids:${note.id}&`
  )

  return (
    <div className="console-reviewer-progress">
      <h4>
        {numReviewsDone} of {numReviewersAssigned} Reviews Submitted
      </h4>
      <Collapse
        showLabel="Show reviewers"
        hideLabel="Hide reviewers"
        className="assigned-reviewers"
      >
        <div>
          {reviewers?.map((reviewer) => (
            <AcPcConsoleReviewerStatusRow
              key={reviewer.anonymousId}
              officialReviews={officialReviews}
              reviewer={reviewer}
              note={note}
              venueId={venueId}
              officialReviewName={officialReviewName}
              referrerUrl={referrerUrl}
              shortPhrase={shortPhrase}
              submissionName={submissionName}
              reviewRatingName={reviewRatingName}
            />
          ))}
        </div>
      </Collapse>
      {(Array.isArray(reviewRatingName)
        ? reviewRatingName.map((p) => (typeof p === 'object' ? Object.keys(p)[0] : p))
        : [reviewRatingName]
      ).map((ratingName, index) => {
        const { ratingAvg, ratingMin, ratingMax } = ratings?.[ratingName] ?? {}
        return (
          <span key={index}>
            <strong>Average {prettyField(ratingName)}:</strong> {ratingAvg} (Min: {ratingMin},
            Max: {ratingMax})
          </span>
        )
      })}
      <span>
        <strong>Average Confidence:</strong> {confidenceAvg} (Min: {confidenceMin}, Max:{' '}
        {confidenceMax})
      </span>
      <span>
        <strong>Number of Forum replies:</strong> {replyCount}
      </span>
      {paperManualReviewerAssignmentUrl && (
        <div className="mt-3">
          <a
            href={`${paperManualReviewerAssignmentUrl}&referrer=${referrerUrl}`}
            target="_blank"
            rel="noreferrer"
          >
            Edit Reviewer Assignments
          </a>
        </div>
      )}
    </div>
  )
}

const PaperRow = ({
  rowData,
  selectedNoteIds,
  setSelectedNoteIds,
  decision,
  venue,
  getManualAssignmentUrl,
}) => {
  const {
    areaChairsId,
    venueId,
    officialReviewName,
    seniorOfficialReviewName,
    shortPhrase,
    submissionName,
    metaReviewRecommendationName = 'recommendation',
    additionalMetaReviewFields = [],
  } = useContext(WebFieldContext)
  const { note, metaReviewData } = rowData
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#paper-status)`
  )

  return (
    <tr>
      <td>
        <input
          type="checkbox"
          checked={selectedNoteIds.includes(note.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedNoteIds((noteIds) => [...noteIds, note.id])
              return
            }
            setSelectedNoteIds((noteIds) => noteIds.filter((p) => p !== note.id))
          }}
        />
      </td>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary
          note={note}
          referrerUrl={referrerUrl}
          showReaders={true}
          isV2Note={true}
        />
      </td>
      <td>
        <AcPcConsoleNoteReviewStatus
          rowData={rowData}
          venueId={venueId}
          officialReviewName={officialReviewName}
          referrerUrl={referrerUrl}
          shortPhrase={shortPhrase}
          submissionName={submissionName}
          reviewerAssignmentUrl={getManualAssignmentUrl('Reviewers')}
          reviewProgressData={rowData.reviewProgressData}
          reviewers={rowData.reviewers}
          officialReviews={rowData.officialReviews}
        />
      </td>
      <td>
        <AcPcConsoleNoteReviewStatus
          rowData={rowData}
          venueId={venueId}
          officialReviewName={seniorOfficialReviewName}
          referrerUrl={referrerUrl}
          shortPhrase={shortPhrase}
          submissionName={submissionName}
          reviewerAssignmentUrl={getManualAssignmentUrl('Reviewers')}
          reviewProgressData={rowData.seniorReviewProgressData}
          reviewers={rowData.seniorReviewers}
          officialReviews={rowData.seniorOfficialReviews}
        />
      </td>
      {areaChairsId && (
        <td>
          <ProgramChairConsolePaperAreaChairProgress
            rowData={rowData}
            referrerUrl={referrerUrl}
            areaChairAssignmentUrl={getManualAssignmentUrl('Area_Chairs')}
            metaReviewRecommendationName={metaReviewRecommendationName}
            additionalMetaReviewFields={additionalMetaReviewFields}
          />
        </td>
      )}
      <td className="console-decision">
        <h4 className="title">{decision}</h4>
        {venue && <span>{venue}</span>}
      </td>
    </tr>
  )
}

const ReviewStatsRow = ({ pcConsoleData, isSeniorReviewer = false }) => {
  const {
    paperReviewsCompleteThreshold,
    paperSeniorReviewsCompleteThreshold,
    officialReviewName,
    seniorOfficialReviewName,
    reviewerName,
    seniorReviewerName,
  } = useContext(WebFieldContext)
  const completeThreshold = isSeniorReviewer
    ? paperSeniorReviewsCompleteThreshold
    : paperReviewsCompleteThreshold

  const [reviewStats, setReviewStats] = useState({})

  useEffect(() => {
    if (!pcConsoleData.notes || Object.keys(reviewStats).length) return
    const reviewerGroups = isSeniorReviewer
      ? pcConsoleData.paperGroups?.seniorReviewerGroups
      : pcConsoleData.paperGroups?.reviewerGroups
    const reviewsByPaperNumberMap = isSeniorReviewer
      ? pcConsoleData.seniorOfficialReviewsByPaperNumberMap
      : pcConsoleData.officialReviewsByPaperNumberMap

    const allOfficialReviews = [...(reviewsByPaperNumberMap?.values() ?? [])]?.flat()

    const assignedReviewsCount = reviewerGroups?.reduce(
      (prev, curr) => prev + curr.members.length,
      0
    )

    // map tilde id in reviewerGroup to anon reviewer group id in anonReviewerGroups
    const reviewerAnonGroupIds = {}
    const activeNoteNumbers = pcConsoleData.notes.map((note) => note.number)
    reviewerGroups.forEach((reviewerGroup) => {
      if (!activeNoteNumbers.includes(reviewerGroup.noteNumber)) return
      reviewerGroup.members.forEach((reviewer) => {
        if (!reviewer.anonymizedGroup) return
        const reviewerProfileId = reviewer.reviewerProfileId // eslint-disable-line prefer-destructuring
        if (reviewerAnonGroupIds[reviewerProfileId]) {
          reviewerAnonGroupIds[reviewerProfileId].push({
            noteNumber: reviewerGroup.noteNumber,
            anonGroupId: reviewer.anonymizedGroup,
          })
        } else {
          reviewerAnonGroupIds[reviewerProfileId] = [
            {
              noteNumber: reviewerGroup.noteNumber,
              anonGroupId: reviewer.anonymizedGroup,
            },
          ]
        }
      })
    })

    // all anon reviewer id group have signed official review
    const reviewersCompletedAllReviews = Object.values(reviewerAnonGroupIds ?? {}).filter(
      (anonReviewerGroups) =>
        anonReviewerGroups?.every((anonReviewerGroup) => {
          const paperOfficialReviews = reviewsByPaperNumberMap.get(
            anonReviewerGroup.noteNumber
          )
          return paperOfficialReviews?.find(
            (p) => p.signatures[0] === anonReviewerGroup.anonGroupId
          )
        })
    )

    const reviewersComplete = reviewersCompletedAllReviews?.length

    const reviewersWithAssignmentsCount = Object.values(reviewerAnonGroupIds ?? {}).length

    const paperWithMoreThanThresholdReviews = pcConsoleData.notes?.filter((note) => {
      const paperOfficialReviews = reviewsByPaperNumberMap.get(note.number)

      const paperReviewers = reviewerGroups?.find((p) => p.noteNumber === note.number)?.members

      const completedReviewsCount = paperOfficialReviews?.length
      const assignedReviewersCount = paperReviewers?.length
      return (
        assignedReviewersCount > 0 &&
        completedReviewsCount >= (completeThreshold ?? assignedReviewersCount)
      )
    })

    setReviewStats({
      allOfficialReviews,
      assignedReviewsCount,
      reviewersComplete,
      reviewersWithAssignmentsCount,
      paperWithMoreThanThresholdReviews,
    })
  }, [pcConsoleData])

  return (
    <>
      <div className="row">
        <StatContainer
          title={`${prettyId(
            isSeniorReviewer ? seniorOfficialReviewName : officialReviewName
          )} Progress`}
          hint={`% of all assigned ${prettyId(
            isSeniorReviewer ? seniorOfficialReviewName : officialReviewName
          ).toLowerCase()} that have been submitted`}
          value={
            pcConsoleData.notes ? (
              renderStat(
                reviewStats.allOfficialReviews?.length,
                reviewStats.assignedReviewsCount
              )
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
        <StatContainer
          title={`${prettyId(isSeniorReviewer ? seniorReviewerName : reviewerName)} Progress`}
          hint={`% of ${prettyId(
            isSeniorReviewer ? seniorReviewerName : reviewerName
          ).toLowerCase()} who have reviewed all of their assigned papers`}
          value={
            pcConsoleData.notes ? (
              renderStat(
                reviewStats.reviewersComplete,
                reviewStats.reviewersWithAssignmentsCount
              )
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
        <StatContainer
          title="Paper Progress"
          hint={`% of papers that have received ${
            completeThreshold
              ? `at least ${completeThreshold} ${prettyId(
                  isSeniorReviewer ? seniorOfficialReviewName : officialReviewName
                ).toLowerCase()}`
              : 'reviews from all assigned reviewers'
          }`}
          value={
            pcConsoleData.notes ? (
              renderStat(
                reviewStats.paperWithMoreThanThresholdReviews?.length,
                pcConsoleData.notes.length
              )
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
      </div>
      <hr className="spacer" />
    </>
  )
}

const Overview = ({ pcConsoleData }) => {
  const {
    areaChairsId,
    seniorAreaChairsId,
    reviewersId,
    seniorReviewersId,
    bidName,
    recommendationName,
  } = useContext(WebFieldContext)

  const isBidEnabled = (groupId) =>
    bidName
      ? pcConsoleData.invitations?.find((p) => p.id === `${groupId}/-/${bidName}`)
      : false

  const reviewersBidEnabled = isBidEnabled(reviewersId)
  const areaChairsBidEnabled = isBidEnabled(areaChairsId)
  const seniorAreaChairsBidEnabled = isBidEnabled(seniorAreaChairsId)
  const recommendationEnabled = pcConsoleData.invitations?.find(
    (p) => p.id === `${reviewersId}/-/${recommendationName}`
  )
  return (
    <>
      <RecruitmentStatsRow pcConsoleData={pcConsoleData} />
      <SubmissionsStatsRow pcConsoleData={pcConsoleData} />
      <BiddingStatsRow
        reviewersBidEnabled={reviewersBidEnabled}
        areaChairsBidEnabled={areaChairsBidEnabled}
        seniorAreaChairsBidEnabled={seniorAreaChairsBidEnabled}
        recommendationEnabled={recommendationEnabled}
        pcConsoleData={pcConsoleData}
      />
      <ReviewStatsRow pcConsoleData={pcConsoleData} isSeniorReviewer={false} />
      <ReviewStatsRow pcConsoleData={pcConsoleData} isSeniorReviewer={true} />
      <MetaReviewStatsRow pcConsoleData={pcConsoleData} />
      <CustomStageStatsRow pcConsoleData={pcConsoleData} />
      <DecisionStatsRow pcConsoleData={pcConsoleData} />
      <DescriptionTimelineOtherConfigRow
        reviewersBidEnabled={reviewersBidEnabled}
        areaChairsBidEnabled={areaChairsBidEnabled}
        seniorAreaChairsBidEnabled={seniorAreaChairsBidEnabled}
        pcConsoleData={pcConsoleData}
        recommendationEnabled={recommendationEnabled}
      />
    </>
  )
}

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
    additionalMetaReviewFields = [],
    reviewerName,
    seniorReviewerName,
    officialReviewName,
    seniorOfficialReviewName,
  } = useContext(WebFieldContext)
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '==', '=']
  const propertiesAllowed = {
    number: ['note.number'],
    id: ['note.id'],
    title: ['note.content.title.value'],
    author: ['note.content.authors.value', 'note.content.authorids.value'],
    keywords: ['note.content.keywords.value'],
    [camelCase(reviewerName)]: ['reviewers'],
    [camelCase(seniorReviewerName)]: ['seniorReviewers'],
    sac: ['metaReviewData.seniorAreaChairs'],
    [`num${upperFirst(camelCase(reviewerName))}Assigned`]: [
      'reviewProgressData.numReviewersAssigned',
    ],
    [`num${upperFirst(camelCase(seniorReviewerName))}Assigned`]: [
      'seniorReviewProgressData.numReviewersAssigned',
    ],
    [`num${upperFirst(camelCase(officialReviewName))}sDone`]: [
      'reviewProgressData.numReviewsDone',
    ],
    [`num${upperFirst(camelCase(seniorOfficialReviewName))}sDone`]: [
      'seniorReviewProgressData.numReviewsDone',
    ],
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
    [`${camelCase(officialReviewName)}ConfidenceAvg`]: ['reviewProgressData.confidenceAvg'],
    [`${camelCase(officialReviewName)}ConfidenceMax`]: ['reviewProgressData.confidenceMax'],
    [`${camelCase(officialReviewName)}ConfidenceMin`]: ['reviewProgressData.confidenceMin'],
    [`${camelCase(seniorOfficialReviewName)}ConfidenceAvg`]: [
      'seniorReviewProgressData.confidenceAvg',
    ],
    [`${camelCase(seniorOfficialReviewName)}ConfidenceMax`]: [
      'seniorReviewProgressData.confidenceMax',
    ],
    [`${camelCase(seniorOfficialReviewName)}ConfidenceMin`]: [
      'seniorReviewProgressData.confidenceMin',
    ],
    replyCount: ['reviewProgressData.replyCount'],
    decision: ['decision'],
    venue: ['venue'],
    ...(metaReviewRecommendationName && {
      [metaReviewRecommendationName]: ['metaReviewData.metaReviewsSearchValue'],
    }),
    ...(additionalMetaReviewFields?.length > 0 &&
      additionalMetaReviewFields.reduce(
        (prev, curr) => ({
          ...prev,
          [`MetaReview${upperFirst(camelCase(curr))}`]: [`metaReviewData.${curr}SearchValue`],
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
    {
      header: `num ${reviewerName}`,
      getValue: (p) => p.reviewProgressData?.numReviewersAssigned,
    },
    {
      header: `num submitted ${reviewerName}`,
      getValue: (p) => p.reviewProgressData?.numReviewsDone,
    },
    {
      header: `missing ${reviewerName}`,
      getValue: (p) =>
        p.reviewers
          ?.filter((q) => !q.hasReview)
          ?.map((r) => r.reviewerProfileId)
          ?.join('|'),
    },
    {
      header: `${reviewerName} contact info`,
      getValue: (p) =>
        p.reviewers.map((q) => `${q.preferredName}<${q.preferredEmail}>`).join(','),
    },
    {
      header: `num ${seniorReviewerName}`,
      getValue: (p) => p.seniorReviewProgressData?.numReviewersAssigned,
    },
    {
      header: `num submitted ${seniorReviewerName}`,
      getValue: (p) => p.seniorReviewProgressData?.numReviewsDone,
    },
    {
      header: `missing ${seniorReviewerName}`,
      getValue: (p) =>
        p.seniorReviewers
          ?.filter((q) => !q.hasReview)
          ?.map((r) => r.reviewerProfileId)
          ?.join('|'),
    },
    {
      header: `${seniorReviewerName} contact info`,
      getValue: (p) =>
        p.seniorReviewers.map((q) => `${q.preferredName}<${q.preferredEmail}>`).join(','),
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
    {
      header: `min ${reviewerName} confidence`,
      getValue: (p) => p.reviewProgressData?.confidenceMin,
    },
    {
      header: `max ${reviewerName} confidence`,
      getValue: (p) => p.reviewProgressData?.confidenceMax,
    },
    {
      header: `average ${reviewerName} confidence`,
      getValue: (p) => p.reviewProgressData?.confidenceAvg,
    },
    {
      header: `min ${seniorReviewerName} confidence`,
      getValue: (p) => p.seniorReviewProgressData?.confidenceMin,
    },
    {
      header: `max ${seniorReviewerName} confidence`,
      getValue: (p) => p.seniorReviewProgressData?.confidenceMax,
    },
    {
      header: `average ${seniorReviewerName} confidence`,
      getValue: (p) => p.seniorReviewProgressData?.confidenceAvg,
    },
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
      label: `Number of ${prettyId(reviewerName)} Assigned`,
      value: 'Number of Reviewers Assigned',
      getValue: (p) => p.reviewProgressData?.numReviewersAssigned,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${prettyId(seniorReviewerName)} Assigned`,
      value: 'Number of Senior Reviewers Assigned',
      getValue: (p) => p.seniorReviewProgressData?.numReviewersAssigned,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${prettyId(reviewerName)} Submitted`,
      value: 'Number of Reviews Submitted',
      getValue: (p) => p.reviewProgressData?.numReviewsDone,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${prettyId(seniorReviewerName)} Submitted`,
      value: 'Number of Senior Reviews Submitted',
      getValue: (p) => p.seniorReviewProgressData?.numReviewsDone,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${prettyId(reviewerName)} Missing`,
      value: 'Number of Reviews Missing',
      getValue: (p) =>
        getValueWithDefault(p.reviewProgressData?.numReviewersAssigned) -
        getValueWithDefault(p.reviewProgressData?.numReviewsDone),
      initialDirection: 'desc',
    },
    {
      label: `Number of ${prettyId(seniorReviewerName)} Missing`,
      value: 'Number of Senior Reviews Missing',
      getValue: (p) =>
        getValueWithDefault(p.seniorReviewProgressData?.numReviewersAssigned) -
        getValueWithDefault(p.seniorReviewProgressData?.numReviewsDone),
      initialDirection: 'desc',
    },
    ...(Array.isArray(reviewRatingName)
      ? reviewRatingName.map((p) => (typeof p === 'object' ? Object.keys(p)[0] : p))
      : [reviewRatingName]
    ).flatMap((ratingName) => [
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
    ]),
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

const PaperStatus = ({ pcConsoleData, loadReviewMetaReviewData }) => {
  const [paperStatusTabData, setPaperStatusTabData] = useState({})
  const [selectedNoteIds, setSelectedNoteIds] = useState([])
  const { venueId, areaChairsId, assignmentUrls, reviewRatingName, seniorReviewerName } =
    useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.notes?.length ?? 0)
  const pageSize = 25

  const getManualAssignmentUrl = (role) => {
    if (!assignmentUrls) return null
    const assignmentUrl = assignmentUrls[role]?.manualAssignmentUrl // same for auto and manual
    // auto
    const isAssignmentConfigDeployed = pcConsoleData.invitations?.some(
      (p) => p.id === `${venueId}/${role}/-/Assignment`
    )
    // manual
    const isMatchingSetup = isAssignmentConfigDeployed

    if (
      (assignmentUrls[role]?.automaticAssignment === false && isMatchingSetup) ||
      (assignmentUrls[role]?.automaticAssignment === true && isAssignmentConfigDeployed)
    )
      return assignmentUrl
    return null
  }

  useEffect(() => {
    if (!pcConsoleData.notes) return
    if (!pcConsoleData.noteNumberReviewMetaReviewMap) {
      setTimeout(() => {
        loadReviewMetaReviewData()
      }, 500)
    } else {
      const { notes, noteNumberReviewMetaReviewMap } = pcConsoleData
      if (!notes) return
      const tableRows = [...(noteNumberReviewMetaReviewMap.values() ?? [])]
      setPaperStatusTabData({
        tableRowsAll: tableRows,
        tableRows: [...tableRows], // could be filtered
      })

      setTotalCount(pcConsoleData.notes?.length ?? 0)
    }
  }, [pcConsoleData.notes, pcConsoleData.noteNumberReviewMetaReviewMap])

  useEffect(() => {
    setPaperStatusTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        // could be filtered and paginated
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    $('[data-toggle="tooltip"]').tooltip('enable')
  }, [pageNumber, pcConsoleData.notes, paperStatusTabData.tableRows])

  useEffect(() => {
    if (!paperStatusTabData.tableRows?.length) return
    setTotalCount(paperStatusTabData.tableRows.length)
    setPageNumber(1)
  }, [paperStatusTabData.tableRows])

  if (!paperStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (paperStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        No papers have been submitted.Check back later or contact info@openreview.net if you
        believe this to be an error.
      </p>
    )
  if (paperStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <PaperStatusMenuBar
          tableRowsAll={paperStatusTabData.tableRowsAll}
          tableRows={paperStatusTabData.tableRows}
          selectedNoteIds={selectedNoteIds}
          setPaperStatusTabData={setPaperStatusTabData}
          reviewRatingName={reviewRatingName}
        />
        <p className="empty-message">No papers matching search criteria.</p>
      </div>
    )
  return (
    <div className="table-container">
      <PaperStatusMenuBar
        tableRowsAll={paperStatusTabData.tableRowsAll}
        tableRows={paperStatusTabData.tableRows}
        selectedNoteIds={selectedNoteIds}
        setPaperStatusTabData={setPaperStatusTabData}
        reviewRatingName={reviewRatingName}
      />
      <Table
        className="console-table table-striped pc-console-paper-status"
        headings={[
          {
            id: 'select-all',
            content: (
              <SelectAllCheckBox
                selectedNoteIds={selectedNoteIds}
                setSelectedNoteIds={setSelectedNoteIds}
                allNoteIds={paperStatusTabData.tableRows?.map((row) => row.note.id)}
              />
            ),
            width: '35px',
          },
          { id: 'number', content: '#', width: '55px' },
          { id: 'summary', content: 'Paper Summary', width: '30%' },
          { id: 'reviewProgress', content: 'Review Progress', width: '25%' },
          {
            id: 'seniorReviewProgress',
            content: `${prettyId(seniorReviewerName)} Progress`,
            width: '25%',
          },
          ...(areaChairsId ? [{ id: 'status', content: 'Status' }] : []),
          { id: 'decision', content: 'Decision' },
        ]}
      >
        {paperStatusTabData.tableRowsDisplayed?.map((row) => (
          <PaperRow
            key={row.note.id}
            rowData={row}
            selectedNoteIds={selectedNoteIds}
            setSelectedNoteIds={setSelectedNoteIds}
            decision={row.decision}
            venue={row.venue}
            getManualAssignmentUrl={getManualAssignmentUrl}
          />
        ))}
      </Table>
      <PaginationLinks
        currentPage={pageNumber}
        itemsPerPage={pageSize}
        totalCount={totalCount}
        setCurrentPage={setPageNumber}
        options={{ noScroll: true, showCount: true }}
      />
    </div>
  )
}

const ProgramChairWithSeniorReviewerConsole = ({ appContext }) => {
  const webfieldData = useContext(WebFieldContext)
  const {
    header,
    entity: group,
    venueId,
    areaChairsId,
    seniorAreaChairsId,
    reviewersId,
    seniorReviewersId,
    programChairsId,
    authorsId,
    paperReviewsCompleteThreshold,
    bidName,
    recommendationName, // to get ac recommendation edges
    metaReviewRecommendationName = 'recommendation', // recommendation field in meta review
    additionalMetaReviewFields = [],
    requestFormId,
    submissionId,
    submissionVenueId,
    withdrawnVenueId,
    deskRejectedVenueId,
    officialReviewName,
    seniorOfficialReviewName,
    commentName,
    officialMetaReviewName,
    decisionName = 'Decision',
    anonReviewerName,
    anonSeniorReviewerName,
    anonAreaChairName,
    reviewerName = 'Reviewers',
    seniorReviewerName,
    areaChairName = 'Area_Chairs',
    seniorAreaChairName = 'Senior_Area_Chairs',
    secondaryAreaChairName,
    secondaryAnonAreaChairName,
    scoresName,
    shortPhrase,
    enableQuerySearch,
    reviewRatingName,
    reviewConfidenceName,
    submissionName,
    recruitmentName,
    paperStatusExportColumns,
    areaChairStatusExportColumns,
    customStageInvitations,
    assignmentUrls,
    emailReplyTo,
  } = webfieldData
  const { setBannerContent } = appContext
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const [activeTabId, setActiveTabId] = useState(
    window.location.hash || '#venue-configuration'
  )
  const [pcConsoleData, setPcConsoleData] = useState({})
  const [isLoadingData, setIsLoadingData] = useState(false)

  const loadData = async () => {
    if (isLoadingData) return

    setIsLoadingData(true)
    try {
      // #region getInvitationMap
      const conferenceInvitationsP = api.getAll(
        '/invitations',
        {
          prefix: `${venueId}/-/.*`,
          expired: true,
          type: 'all',
          domain: venueId,
        },
        { accessToken }
      )
      const reviewerInvitationsP = api.getAll(
        '/invitations',
        {
          prefix: `${reviewersId}/-/.*`,
          expired: true,
          type: 'all',
          domain: venueId,
        },
        { accessToken }
      )
      const acInvitationsP = areaChairsId
        ? api.getAll(
            '/invitations',
            {
              prefix: `${areaChairsId}/-/.*`,
              expired: true,
              type: 'all',
              domain: venueId,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const sacInvitationsP = seniorAreaChairsId
        ? api.getAll(
            '/invitations',
            {
              prefix: `${seniorAreaChairsId}/-/.*`,
              expired: true,
              type: 'all',
              domain: venueId,
            },
            { accessToken }
          )
        : Promise.resolve([])

      const customStageInvitationsP = customStageInvitations
        ? api.getAll(
            '/invitations',
            {
              ids: customStageInvitations.map((p) => `${venueId}/-/${p.name}`),
              type: 'note',
              domain: venueId,
            },
            { accessToken }
          )
        : Promise.resolve([])

      const invitationResultsP = Promise.all([
        conferenceInvitationsP,
        reviewerInvitationsP,
        acInvitationsP,
        sacInvitationsP,
        customStageInvitationsP,
      ])

      // #endregion

      // #region getRequestForm
      const getRequestFormResultP = requestFormId
        ? api
            .get(
              '/notes',
              {
                id: requestFormId,
                limit: 1,
                select: 'id,content',
              },
              { accessToken, version: 1 } // request form is currently in v1
            )
            .then(
              (result) => result.notes?.[0],
              () => null
            )
        : Promise.resolve(null)
      // #endregion

      // #region getRegistrationForms
      const prefixes = [reviewersId, areaChairsId, seniorAreaChairsId]
      const getRegistrationFormPs = prefixes.map((prefix) =>
        prefix
          ? api
              .getAll(
                '/notes',
                {
                  invitation: `${prefix}/-/.*`,
                  signature: venueId,
                  select: 'id,invitation,invitations,content.title',
                  domain: venueId,
                },
                { accessToken }
              )
              .then((notes) =>
                notes.filter((note) => note.invitations.some((p) => p.includes('Form')))
              )
          : Promise.resolve(null)
      )
      const getRegistrationFormResultsP = Promise.all(getRegistrationFormPs)
      // #endregion

      // #region get Reviewer, AC, SAC members
      const committeeMemberResultsP = Promise.all(
        [reviewersId, seniorReviewersId, areaChairsId, seniorAreaChairsId].map((id) =>
          id ? api.getGroupById(id, accessToken, { select: 'members' }) : Promise.resolve([])
        )
      )
      // #endregion

      // #region getSubmissions
      const notesP = api.getAll(
        '/notes',
        {
          invitation: submissionId,
          details: 'replies',
          select: 'id,number,forum,content,details,invitations,readers',
          sort: 'number:asc',
          domain: venueId,
        },
        { accessToken }
      )
      // #endregion

      // #region get ac recommendation count
      const getAcRecommendationsP =
        recommendationName && areaChairsId
          ? api
              .get(
                '/edges',
                {
                  invitation: `${reviewersId}/-/${recommendationName}`,
                  groupBy: 'id',
                  select: 'signatures',
                  domain: venueId,
                },
                { accessToken }
              )
              .then((result) =>
                result.groupedEdges.reduce((profileMap, edge) => {
                  const acId = edge.values[0].signatures[0]
                  if (!profileMap[acId]) {
                    profileMap[acId] = 0 // eslint-disable-line no-param-reassign
                  }
                  profileMap[acId] += 1 // eslint-disable-line no-param-reassign
                  return profileMap
                }, {})
              )
          : Promise.resolve([])
      // #endregion

      // #region get Reviewer, AC, SAC bids
      const bidCountResultsP = Promise.all(
        [reviewersId, areaChairsId, seniorAreaChairsId].map((id) => {
          if (!id || !bidName) return Promise.resolve([])
          return api.getAll(
            '/edges',
            {
              invitation: `${id}/-/${bidName}`,
              groupBy: 'tail',
              select: 'count',
              domain: venueId,
            },
            { accessToken, resultsKey: 'groupedEdges' }
          )
        })
      )
      // #endregion

      // #region getGroups (per paper groups)
      const perPaperGroupResultsP = api.get(
        '/groups',
        {
          prefix: `${venueId}/${submissionName}.*`,
          stream: true,
          select: 'id,members',
          domain: venueId,
        },
        { accessToken }
      )
      // #endregion

      const results = await Promise.all([
        invitationResultsP,
        getRequestFormResultP,
        getRegistrationFormResultsP,
        committeeMemberResultsP,
        notesP,
        getAcRecommendationsP,
        bidCountResultsP,
        perPaperGroupResultsP,
      ])
      const invitationResults = results[0]
      const requestForm = results[1]
      const registrationForms = results[2].flatMap((p) => p ?? [])
      const committeeMemberResults = results[3]
      const notes = results[4].flatMap((note) => {
        if ([withdrawnVenueId, deskRejectedVenueId].includes(note.content?.venueid?.value))
          return []
        return note
      })
      const acRecommendationsCount = results[5]
      const bidCountResults = results[6]
      const perPaperGroupResults = results[7]

      // #region categorize result of per paper groups
      const reviewerGroups = []
      const seniorReviewerGroups = []
      const anonReviewerGroups = {}
      const anonSeniorReviewerGroups = {}
      const areaChairGroups = []
      const anonAreaChairGroups = {}
      const secondaryAreaChairGroups = []
      const secondaryAnonAreaChairGroups = {}
      const seniorAreaChairGroups = []
      let allGroupMembers = []
      perPaperGroupResults.groups?.forEach((p) => {
        const number = getNumberFromGroup(p.id, submissionName)
        const noteVenueId = notes.find((q) => q.number === number)?.content?.venueid?.value
        if (
          !noteVenueId ||
          noteVenueId === withdrawnVenueId ||
          noteVenueId === deskRejectedVenueId
        )
          return
        if (p.id.endsWith(`/${reviewerName}`)) {
          reviewerGroups.push({
            noteNumber: number,
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in anonReviewerGroups)) anonReviewerGroups[number] = {}
            if (
              !(member in anonReviewerGroups[number]) &&
              member.includes(anonReviewerName) &&
              !member.includes(anonSeniorReviewerName)
            ) {
              anonReviewerGroups[number][member] = member
            }
          })
        } else if (p.id.endsWith(`/${seniorReviewerName}`)) {
          seniorReviewerGroups.push({
            noteNumber: number,
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in anonSeniorReviewerGroups)) anonSeniorReviewerGroups[number] = {}
            if (
              !(member in anonSeniorReviewerGroups[number]) &&
              member.includes(anonSeniorReviewerName)
            ) {
              anonSeniorReviewerName[number][member] = member
            }
          })
        } else if (p.id.includes(anonReviewerName) && !p.id.includes(anonSeniorReviewerName)) {
          if (!(number in anonReviewerGroups)) anonReviewerGroups[number] = {}
          if (p.members.length) anonReviewerGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (p.id.includes(anonSeniorReviewerName)) {
          if (!(number in anonSeniorReviewerGroups)) anonSeniorReviewerGroups[number] = {}
          if (p.members.length) anonSeniorReviewerGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (p.id.endsWith(`/${areaChairName}`)) {
          areaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in anonAreaChairGroups)) anonAreaChairGroups[number] = {}
            if (
              !(member in anonAreaChairGroups[number]) &&
              member.includes(`/${anonAreaChairName}`)
            ) {
              anonAreaChairGroups[number][member] = member
            }
          })
        } else if (p.id.includes(`/${anonAreaChairName}`)) {
          if (!(number in anonAreaChairGroups)) anonAreaChairGroups[number] = {}
          if (p.members.length) anonAreaChairGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (p.id.endsWith(seniorAreaChairName)) {
          seniorAreaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (secondaryAreaChairName && p.id.endsWith(`/${secondaryAreaChairName}`)) {
          secondaryAreaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in secondaryAnonAreaChairGroups))
              secondaryAnonAreaChairGroups[number] = {}
            if (
              !(member in secondaryAnonAreaChairGroups[number]) &&
              member.includes(`/${secondaryAnonAreaChairName}`)
            ) {
              secondaryAnonAreaChairGroups[number][member] = member
            }
          })
        } else if (secondaryAreaChairName && p.id.includes(`/${secondaryAnonAreaChairName}`)) {
          if (!(number in secondaryAnonAreaChairGroups))
            secondaryAnonAreaChairGroups[number] = {}
          if (p.members.length) secondaryAnonAreaChairGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        }
      })
      // #endregion

      // #region get all profiles(with assignments)
      const allIds = [...new Set(allGroupMembers)]
      const ids = allIds.filter((p) => p.startsWith('~'))
      const emails = allIds.filter((p) => p.match(/.+@.+/))
      const getProfilesByIdsP = ids.length
        ? api.post(
            '/profiles/search',
            {
              ids,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const getProfilesByEmailsP = emails.length
        ? api.post(
            '/profiles/search',
            {
              emails,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const profileResults = await Promise.all([getProfilesByIdsP, getProfilesByEmailsP])
      const allProfiles = (profileResults[0].profiles ?? [])
        .concat(profileResults[1].profiles ?? [])
        .map((profile) => ({
          ...profile,
          preferredName: getProfileName(profile),
          preferredEmail: profile.content.preferredEmail ?? profile.content.emails[0],
        }))
      // #endregion

      const allProfilesMap = new Map()
      allProfiles.forEach((profile) => {
        const usernames = profile.content.names.flatMap((p) => p.username ?? [])
        const profileEmails = profile.content.emails.filter((p) => p)
        usernames.concat(profileEmails).forEach((key) => {
          allProfilesMap.set(key, profile)
        })
      })

      const officialReviewsByPaperNumberMap = new Map()
      const seniorOfficialReviewsByPaperNumberMap = new Map()
      const metaReviewsByPaperNumberMap = new Map()
      const decisionByPaperNumberMap = new Map()
      const customStageReviewsByPaperNumberMap = new Map()
      notes.forEach((note) => {
        const replies = note.details.replies ?? []
        const officialReviews = replies
          .filter((p) => {
            const officialReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
            return p.invitations.includes(officialReviewInvitationId)
          })
          .map((review) => {
            let anonymousGroupId
            if (review.signatures[0].startsWith('~')) {
              const idToAnonIdMap = Object.keys(anonReviewerGroups[note.number] ?? {}).reduce(
                (prev, curr) => ({ ...prev, [anonReviewerGroups[note.number][curr]]: curr }),
                {}
              )

              Object.entries(idToAnonIdMap).forEach(
                ([anonReviewerId, anonReviewerGroupId]) => {
                  const profile = allProfilesMap.get(anonReviewerId)
                  if (!profile) return
                  const usernames = profile.content.names.flatMap((p) => p.username ?? [])
                  const profileEmails = profile.content.emails.filter((p) => p)
                  usernames.concat(profileEmails).forEach((key) => {
                    idToAnonIdMap[key] = anonReviewerGroupId
                  })
                }
              )
              anonymousGroupId = idToAnonIdMap?.[review.signatures[0]] ?? ''
            } else {
              anonymousGroupId = review.signatures[0]
            }

            return {
              ...review,
              anonId: getIndentifierFromGroup(anonymousGroupId, anonReviewerName),
            }
          })
        const seniorOfficialReviews = replies
          .filter((p) => {
            const seniorOfficialReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${seniorOfficialReviewName}`
            return p.invitations.includes(seniorOfficialReviewInvitationId)
          })
          .map((review) => {
            let anonymousGroupId
            if (review.signatures[0].startsWith('~')) {
              const idToAnonIdMap = Object.keys(
                anonSeniorReviewerGroups[note.number] ?? {}
              ).reduce(
                (prev, curr) => ({
                  ...prev,
                  [anonSeniorReviewerGroups[note.number][curr]]: curr,
                }),
                {}
              )

              Object.entries(idToAnonIdMap).forEach(
                ([anonSeniorReviewerId, anonSeniorReviewerGroupId]) => {
                  const profile = allProfilesMap.get(anonSeniorReviewerId)
                  if (!profile) return
                  const usernames = profile.content.names.flatMap((p) => p.username ?? [])
                  const profileEmails = profile.content.emails.filter((p) => p)
                  usernames.concat(profileEmails).forEach((key) => {
                    idToAnonIdMap[key] = anonSeniorReviewerGroupId
                  })
                }
              )
              anonymousGroupId = idToAnonIdMap?.[review.signatures[0]] ?? ''
            } else {
              anonymousGroupId = review.signatures[0]
            }

            return {
              ...review,
              anonId: getIndentifierFromGroup(anonymousGroupId, anonSeniorReviewerName),
            }
          })
        const metaReviews = replies
          .filter((p) => {
            const officialMetaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`
            return p.invitations.includes(officialMetaReviewInvitationId)
          })
          .map((metaReview) => ({
            ...metaReview,
            anonId: getIndentifierFromGroup(metaReview.signatures[0], anonAreaChairName),
          }))

        const decisionInvitationId = `${venueId}/${submissionName}${note.number}/-/${decisionName}`
        const decision = replies.find((p) => p.invitations.includes(decisionInvitationId))
        const customStageInvitationIds = customStageInvitations
          ? customStageInvitations.map((p) => `/-/${p.name}`)
          : []
        const customStageReviews = replies.filter((p) =>
          p.invitations.some((q) => customStageInvitationIds.some((r) => q.includes(r)))
        )
        officialReviewsByPaperNumberMap.set(note.number, officialReviews)
        seniorOfficialReviewsByPaperNumberMap.set(note.number, seniorOfficialReviews)
        metaReviewsByPaperNumberMap.set(note.number, metaReviews)
        decisionByPaperNumberMap.set(note.number, decision)
        customStageReviewsByPaperNumberMap.set(note.number, customStageReviews)
      })

      setPcConsoleData({
        invitations: invitationResults.flat(),
        allProfiles,
        allProfilesMap,
        requestForm,
        registrationForms,
        reviewers: committeeMemberResults[0]?.members ?? [],
        seniorReviewers: committeeMemberResults[1]?.members ?? [],
        areaChairs: committeeMemberResults[2]?.members ?? [],
        seniorAreaChairs: committeeMemberResults[3]?.members ?? [],
        notes,
        officialReviewsByPaperNumberMap,
        seniorOfficialReviewsByPaperNumberMap,
        metaReviewsByPaperNumberMap,
        decisionByPaperNumberMap,
        customStageReviewsByPaperNumberMap,
        withdrawnNotes: results[4].flatMap((note) => {
          if (note.content?.venueid?.value === withdrawnVenueId) return note
          return []
        }),
        deskRejectedNotes: results[4].flatMap((note) => {
          if (note.content?.venueid?.value === deskRejectedVenueId) return note
          return []
        }),

        acRecommendationsCount,
        bidCounts: {
          reviewers: bidCountResults[0],
          areaChairs: bidCountResults[1],
          seniorAreaChairs: bidCountResults[2],
        },
        paperGroups: {
          anonReviewerGroups,
          anonSeniorReviewerGroups,
          reviewerGroups: reviewerGroups.map((reviewerGroup) => {
            const paperAnonReviewerGroups = anonReviewerGroups[reviewerGroup.noteNumber] || {}
            return {
              ...reviewerGroup,
              members: reviewerGroup.members.flatMap((member) => {
                let deanonymizedGroup = paperAnonReviewerGroups[member]
                let anonymizedGroup = member
                if (!deanonymizedGroup) {
                  deanonymizedGroup = member
                  anonymizedGroup = Object.keys(paperAnonReviewerGroups).find(
                    (key) => paperAnonReviewerGroups[key] === member
                  )
                }
                return {
                  reviewerProfileId: deanonymizedGroup,
                  anonymizedGroup,
                  anonymousId: getIndentifierFromGroup(anonymizedGroup, anonReviewerName),
                }
              }),
            }
          }),
          seniorReviewerGroups: seniorReviewerGroups.map((seniorReviewerGroup) => {
            const paperAnonSeniorReviewerGroups =
              anonSeniorReviewerGroups[seniorReviewerGroup.noteNumber] || {}
            return {
              ...seniorReviewerGroup,
              members: seniorReviewerGroup.members.flatMap((member) => {
                let deanonymizedGroup = paperAnonSeniorReviewerGroups[member]
                let anonymizedGroup = member
                if (!deanonymizedGroup) {
                  deanonymizedGroup = member
                  anonymizedGroup = Object.keys(paperAnonSeniorReviewerGroups).find(
                    (key) => paperAnonSeniorReviewerGroups[key] === member
                  )
                }
                return {
                  reviewerProfileId: deanonymizedGroup,
                  anonymizedGroup,
                  anonymousId: getIndentifierFromGroup(
                    anonymizedGroup,
                    anonSeniorReviewerName
                  ),
                }
              }),
            }
          }),
          anonAreaChairGroups,
          areaChairGroups: areaChairGroups.map((areaChairGroup) => {
            const paperAnonAreaChairGroups = anonAreaChairGroups[areaChairGroup.noteNumber]
            return {
              ...areaChairGroup,
              members: areaChairGroup.members.flatMap((member) => {
                let deanonymizedGroup = paperAnonAreaChairGroups?.[member]
                let anonymizedGroup = member
                if (!deanonymizedGroup) {
                  deanonymizedGroup = member
                  anonymizedGroup = Object.keys(paperAnonAreaChairGroups).find(
                    (key) => paperAnonAreaChairGroups[key] === member
                  )
                }
                if (!(isValidEmail(deanonymizedGroup) || deanonymizedGroup?.startsWith('~')))
                  return []
                return {
                  areaChairProfileId: deanonymizedGroup,
                  anonymizedGroup,
                  anonymousId: anonymizedGroup
                    ? getIndentifierFromGroup(anonymizedGroup, anonAreaChairName)
                    : null,
                }
              }),
              secondaries: areaChairGroup.members.flatMap((member) => {
                if (!secondaryAreaChairName || !member.endsWith(`/${secondaryAreaChairName}`))
                  return []

                const acGroupNoteNumber = areaChairGroup.noteNumber
                const secondaryAreaChairGroup = secondaryAreaChairGroups.find(
                  (p) => p.noteNumber === acGroupNoteNumber
                )
                if (!secondaryAreaChairGroup) return []

                return secondaryAreaChairGroup.members.map((secondaryMember) => ({
                  areaChairProfileId:
                    secondaryAnonAreaChairGroups[acGroupNoteNumber]?.[secondaryMember] ??
                    secondaryMember,
                  anonymizedGroup: secondaryMember,
                  anonymousId: getIndentifierFromGroup(
                    secondaryMember,
                    secondaryAnonAreaChairName
                  ),
                }))
              }),
            }
          }),
          seniorAreaChairGroups,
        },
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
    setIsLoadingData(false)
  }

  // eslint-disable-next-line consistent-return
  const calculateNotesReviewMetaReviewData = () => {
    if (!pcConsoleData) return new Map()
    const noteNumberReviewMetaReviewMap = new Map()
    pcConsoleData.notes.forEach((note) => {
      const assignedReviewers =
        pcConsoleData.paperGroups.reviewerGroups?.find((p) => p.noteNumber === note.number)
          ?.members ?? []
      const assignedSeniorReviewers =
        pcConsoleData.paperGroups.seniorReviewerGroups?.find(
          (p) => p.noteNumber === note.number
        )?.members ?? []

      const assignedReviewerProfiles = assignedReviewers.map((reviewer) => ({
        id: reviewer.reviewerProfileId,
        profile: pcConsoleData.allProfilesMap.get(reviewer.reviewerProfileId),
      }))
      const assignedSeniorReviewerProfiles = assignedSeniorReviewers.map((seniorReviewer) => ({
        id: seniorReviewer.reviewerProfileId,
        profile: pcConsoleData.allProfilesMap.get(seniorReviewer.reviewerProfileId),
      }))

      const assignedAreaChairs =
        pcConsoleData.paperGroups.areaChairGroups?.find((p) => p.noteNumber === note.number)
          ?.members ?? []

      const assignedAreaChairProfiles = assignedAreaChairs.map((areaChair) => ({
        id: areaChair.areaChairProfileId,
        profile: pcConsoleData.allProfilesMap.get(areaChair.areaChairProfileId),
      }))

      const secondaryAreaChairs =
        pcConsoleData.paperGroups.areaChairGroups?.find((p) => p.noteNumber === note.number)
          ?.secondaries ?? []

      const secondaryAreaChairProfiles = secondaryAreaChairs.map((areaChair) => ({
        id: areaChair.areaChairProfileId,
        profile: pcConsoleData.allProfilesMap.get(areaChair.areaChairProfileId),
      }))

      const assignedSeniorAreaChairs =
        pcConsoleData.paperGroups.seniorAreaChairGroups?.find(
          (p) => p.noteNumber === note.number
        )?.members ?? []

      const assignedSeniorAreaChairProfiles = assignedSeniorAreaChairs.map(
        (seniorAreaChairProfileId) => ({
          id: seniorAreaChairProfileId,
          profile: pcConsoleData.allProfilesMap.get(seniorAreaChairProfileId),
        })
      )

      const officialReviews =
        pcConsoleData.officialReviewsByPaperNumberMap?.get(note.number)?.map((q) => {
          const reviewValue = q.content.review?.value
          return {
            anonymousId: q.anonId,
            confidence: parseNumberField(q.content[reviewConfidenceName]?.value),
            ...Object.fromEntries(
              (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
                (ratingName) => {
                  const displayRatingName =
                    typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
                  const ratingValue =
                    typeof ratingName === 'object'
                      ? Object.values(ratingName)[0]
                          .map((r) => q.content[r]?.value)
                          .find((s) => s !== undefined)
                      : q.content[ratingName]?.value
                  return [[displayRatingName], parseNumberField(ratingValue)]
                }
              )
            ),
            reviewLength: reviewValue?.length,
            forum: q.forum,
            id: q.id,
          }
        }) ?? []
      const seniorOfficialReviews =
        pcConsoleData.seniorOfficialReviewsByPaperNumberMap?.get(note.number)?.map((q) => {
          const reviewValue = q.content.review?.value
          return {
            anonymousId: q.anonId,
            confidence: parseNumberField(q.content[reviewConfidenceName]?.value),
            ...Object.fromEntries(
              (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
                (ratingName) => {
                  const displayRatingName =
                    typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
                  const ratingValue =
                    typeof ratingName === 'object'
                      ? Object.values(ratingName)[0]
                          .map((r) => q.content[r]?.value)
                          .find((s) => s !== undefined)
                      : q.content[ratingName]?.value
                  return [[displayRatingName], parseNumberField(ratingValue)]
                }
              )
            ),
            reviewLength: reviewValue?.length,
            forum: q.forum,
            id: q.id,
          }
        }) ?? []
      const ratings = Object.fromEntries(
        (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
          (ratingName) => {
            const ratingDisplayName =
              typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
            const ratingValues = officialReviews.map((p) => p[ratingDisplayName])

            const validRatingValues = ratingValues.filter((p) => p !== null)
            const ratingAvg = validRatingValues.length
              ? (
                  validRatingValues.reduce((sum, curr) => sum + curr, 0) /
                  validRatingValues.length
                ).toFixed(2)
              : 'N/A'
            const ratingMin = validRatingValues.length ? Math.min(...validRatingValues) : 'N/A'
            const ratingMax = validRatingValues.length ? Math.max(...validRatingValues) : 'N/A'
            return [ratingDisplayName, { ratingAvg, ratingMin, ratingMax }]
          }
        )
      )

      const seniorRatings = Object.fromEntries(
        (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
          (ratingName) => {
            const ratingDisplayName =
              typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
            const ratingValues = seniorOfficialReviews.map((p) => p[ratingDisplayName])

            const validRatingValues = ratingValues.filter((p) => p !== null)
            const ratingAvg = validRatingValues.length
              ? (
                  validRatingValues.reduce((sum, curr) => sum + curr, 0) /
                  validRatingValues.length
                ).toFixed(2)
              : 'N/A'
            const ratingMin = validRatingValues.length ? Math.min(...validRatingValues) : 'N/A'
            const ratingMax = validRatingValues.length ? Math.max(...validRatingValues) : 'N/A'
            return [ratingDisplayName, { ratingAvg, ratingMin, ratingMax }]
          }
        )
      )

      const confidences = officialReviews.map((p) => p.confidence)
      const seniorConfidences = seniorOfficialReviews.map((p) => p.confidence)
      const validConfidences = confidences.filter((p) => p !== null)
      const validSeniorConfidences = seniorConfidences.filter((p) => p !== null)
      const confidenceAvg = validConfidences.length
        ? (
            validConfidences.reduce((sum, curr) => sum + curr, 0) / validConfidences.length
          ).toFixed(2)
        : 'N/A'
      const seniorConfidenceAvg = validSeniorConfidences.length
        ? (
            validSeniorConfidences.reduce((sum, curr) => sum + curr, 0) /
            validSeniorConfidences.length
          ).toFixed(2)
        : 'N/A'
      const confidenceMin = validConfidences.length ? Math.min(...validConfidences) : 'N/A'
      const seniorConfidenceMin = validSeniorConfidences.length
        ? Math.min(...validSeniorConfidences)
        : 'N/A'
      const confidenceMax = validConfidences.length ? Math.max(...validConfidences) : 'N/A'
      const seniorConfidenceMax = validSeniorConfidences.length
        ? Math.max(...validSeniorConfidences)
        : 'N/A'

      const customStageReviews =
        pcConsoleData.customStageReviewsByPaperNumberMap?.get(note.number) ?? []

      const metaReviews = (
        pcConsoleData.metaReviewsByPaperNumberMap?.get(note.number) ?? []
      ).map((metaReview) => {
        const metaReviewAgreement = customStageReviews.find(
          (p) => p.replyto === metaReview.id || p.forum === metaReview.forum
        )
        const metaReviewAgreementConfig = metaReviewAgreement
          ? customStageInvitations.find((p) =>
              metaReviewAgreement.invitations.some((q) => q.includes(`/-/${p.name}`))
            )
          : null
        const metaReviewAgreementValue =
          metaReviewAgreement?.content?.[metaReviewAgreementConfig?.displayField]?.value
        return {
          [metaReviewRecommendationName]:
            metaReview?.content[metaReviewRecommendationName]?.value,
          ...additionalMetaReviewFields?.reduce((prev, curr) => {
            const additionalMetaReviewFieldValue = metaReview?.content[curr]?.value
            return {
              ...prev,
              [curr]: {
                value: additionalMetaReviewFieldValue,
                searchValue: additionalMetaReviewFieldValue ?? 'N/A',
              },
            }
          }, {}),
          ...metaReview,
          metaReviewAgreement: metaReviewAgreement
            ? {
                searchValue: metaReviewAgreementValue,
                name: prettyId(metaReviewAgreementConfig.name),
                value: metaReviewAgreementValue,
                id: metaReviewAgreement.id,
                forum: metaReviewAgreement.forum,
              }
            : { searchValue: 'N/A' },
        }
      })

      let decision = 'No Decision'
      const decisionNote = pcConsoleData.decisionByPaperNumberMap.get(note.number)
      if (decisionNote?.content?.decision) decision = decisionNote.content.decision?.value

      noteNumberReviewMetaReviewMap.set(note.number, {
        note,
        reviewers: assignedReviewers?.map((reviewer) => {
          const profile = assignedReviewerProfiles.find(
            (p) => p.id === reviewer.reviewerProfileId
          )?.profile
          return {
            ...reviewer,
            type: 'profile',
            profile,
            hasReview: officialReviews.some((p) => p.anonymousId === reviewer.anonymousId),
            noteNumber: note.number,
            preferredId: reviewer.reviewerProfileId,
            preferredName: profile ? getProfileName(profile) : reviewer.reviewerProfileId,
            preferredEmail: profile
              ? profile.content.preferredEmail ?? profile.content.emails[0]
              : reviewer.reviewerProfileId,
          }
        }),
        seniorReviewers: assignedSeniorReviewers?.map((reviewer) => {
          const profile = assignedSeniorReviewerProfiles.find(
            (p) => p.id === reviewer.reviewerProfileId
          )?.profile
          return {
            ...reviewer,
            type: 'profile',
            profile,
            hasReview: seniorOfficialReviews.some(
              (p) => p.anonymousId === reviewer.anonymousId
            ),
            noteNumber: note.number,
            preferredId: reviewer.reviewerProfileId,
            preferredName: profile ? getProfileName(profile) : reviewer.reviewerProfileId,
            preferredEmail: profile
              ? profile.content.preferredEmail ?? profile.content.emails[0]
              : reviewer.reviewerProfileId,
          }
        }),
        reviewerProfiles: assignedReviewerProfiles,
        seniorReviewerProfiles: assignedSeniorReviewerProfiles,
        officialReviews,
        seniorOfficialReviews,
        reviewProgressData: {
          reviewers: assignedReviewerProfiles,
          numReviewersAssigned: assignedReviewers.length,
          numReviewsDone: officialReviews.length,
          ratings,
          confidenceAvg,
          confidenceMax,
          confidenceMin,
          replyCount: note.details.replies?.length ?? 0,
        },
        seniorReviewProgressData: {
          reviewers: assignedSeniorReviewerProfiles,
          numReviewersAssigned: assignedSeniorReviewers.length,
          numReviewsDone: seniorOfficialReviews.length,
          ratings: seniorRatings,
          confidenceAvg: seniorConfidenceAvg,
          confidenceMax: seniorConfidenceMax,
          confidenceMin: seniorConfidenceMin,
          replyCount: note.details.replies?.length ?? 0,
        },
        metaReviewData: {
          numAreaChairsAssigned: assignedAreaChairs.length,
          areaChairs: assignedAreaChairs.map((areaChair) => {
            const profile = assignedAreaChairProfiles.find(
              (p) => p.id === areaChair.areaChairProfileId
            )?.profile
            return {
              ...areaChair,
              preferredName: profile ? getProfileName(profile) : areaChair.areaChairProfileId,
              preferredEmail: profile
                ? profile.content.preferredEmail ?? profile.content.emails[0]
                : areaChair.areaChairProfileId,
            }
          }),
          secondaryAreaChairs: secondaryAreaChairs.map((areaChair) => {
            const profile = secondaryAreaChairProfiles.find(
              (p) => p.id === areaChair.areaChairProfileId
            )?.profile
            return {
              ...areaChair,
              preferredName: profile ? getProfileName(profile) : areaChair.areaChairProfileId,
              preferredEmail: profile
                ? profile.content.preferredEmail ?? profile.content.emails[0]
                : areaChair.areaChairProfileId,
            }
          }),
          seniorAreaChairs: assignedSeniorAreaChairs.map((seniorAreaChairProfileId) => {
            const profile = assignedSeniorAreaChairProfiles.find(
              (p) => p.id === seniorAreaChairProfileId
            )?.profile
            return {
              type: 'profile',
              preferredId: seniorAreaChairProfileId,
              preferredName: profile ? getProfileName(profile) : seniorAreaChairProfileId,
              preferredEmail: profile
                ? profile.content.preferredEmail ?? profile.content.emails[0]
                : seniorAreaChairProfileId,
            }
          }),
          numMetaReviewsDone: metaReviews.length,
          metaReviews,
          metaReviewsSearchValue: metaReviews?.length
            ? metaReviews.map((p) => p[metaReviewRecommendationName]).join(' ')
            : 'N/A',
          metaReviewAgreementSearchValue: metaReviews
            .map((p) => p.metaReviewAgreement.searchValue)
            .join(' '),
          ...additionalMetaReviewFields?.reduce((prev, curr) => {
            const additionalMetaReviewValues = metaReviews.map((p) => p[curr]?.searchValue)
            return {
              ...prev,
              [`${curr}SearchValue`]: additionalMetaReviewValues.join(' '),
            }
          }, {}),
        },

        decision,
        venue: note?.content?.venue?.value,
      })
    })
    setPcConsoleData((data) => ({ ...data, noteNumberReviewMetaReviewMap }))
  }

  const loadSacAcInfo = async () => {
    // #region get sac edges to get sac of ac
    const sacEdgeResult = seniorAreaChairsId
      ? await api
          .get(
            '/edges',
            {
              invitation: `${seniorAreaChairsId}/-/Assignment`,
              groupBy: 'head,tail',
              select: 'head,tail',
              domain: venueId,
            },
            { accessToken }
          )
          .then((result) => result.groupedEdges)
      : []

    const sacByAcMap = new Map()
    const acBySacMap = new Map()
    sacEdgeResult.forEach((edge) => {
      const ac = edge.values[0].head
      const sac = edge.values[0].tail
      sacByAcMap.set(ac, sac)
      if (!acBySacMap.get(sac)) acBySacMap.set(sac, [])
      acBySacMap.get(sac).push(ac)
    })
    // #endregion

    // #region get profile of acs/sacs without assignments
    const areaChairWithoutAssignmentIds = pcConsoleData.areaChairs.filter(
      (areaChairProfileId) => !pcConsoleData.allProfilesMap.get(areaChairProfileId)
    )
    const seniorAreaChairWithoutAssignmentIds = pcConsoleData.seniorAreaChairs.filter(
      (sacProfileId) => !pcConsoleData.allProfilesMap.get(sacProfileId)
    )
    const allIdsNoAssignment = areaChairWithoutAssignmentIds.concat(
      seniorAreaChairWithoutAssignmentIds
    )
    const ids = allIdsNoAssignment.filter((p) => p.startsWith('~'))
    const emails = allIdsNoAssignment.filter((p) => p.match(/.+@.+/))
    const getProfilesByIdsP = ids.length
      ? api.post(
          '/profiles/search',
          {
            ids,
          },
          { accessToken }
        )
      : Promise.resolve([])
    const getProfilesByEmailsP = emails.length
      ? api.post(
          '/profiles/search',
          {
            emails,
          },
          { accessToken }
        )
      : Promise.resolve([])
    const profileResults = await Promise.all([getProfilesByIdsP, getProfilesByEmailsP])
    const acSacProfilesWithoutAssignment = (profileResults[0].profiles ?? [])
      .concat(profileResults[1].profiles ?? [])
      .map((profile) => ({
        ...profile,
        preferredName: getProfileName(profile),
        preferredEmail: profile.content.preferredEmail ?? profile.content.emails[0],
      }))

    const acSacProfileWithoutAssignmentMap = new Map()
    acSacProfilesWithoutAssignment.forEach((profile) => {
      const usernames = profile.content.names.flatMap((p) => p.username ?? [])
      const profileEmails = profile.content.emails.filter((p) => p)
      usernames.concat(profileEmails).forEach((key) => {
        acSacProfileWithoutAssignmentMap.set(key, profile)
      })
    })
    // #endregion
    setPcConsoleData((data) => ({
      ...data,
      sacAcInfo: {
        sacByAcMap,
        acBySacMap,
        acSacProfileWithoutAssignmentMap,
        areaChairWithoutAssignmentIds,
        seniorAreaChairWithoutAssignmentIds,
      },
    }))
  }

  useEffect(() => {
    if (!query) return

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(venueId))
    }
  }, [query, venueId])

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )}`
      )
    }
  }, [user, userLoading])

  useEffect(() => {
    if (userLoading || !user || !group || !venueId || !reviewersId || !submissionId) return
    loadData()
  }, [user, userLoading, group])

  useEffect(() => {
    if (!activeTabId) return
    router.replace(activeTabId)
  }, [activeTabId])

  const missingConfig = Object.entries({
    header,
    entity: group,
    venueId,
    reviewersId,
    programChairsId,
    authorsId,
    paperReviewsCompleteThreshold,
    submissionId,
    officialReviewName,
    commentName,
    officialMetaReviewName,
    anonReviewerName,
    shortPhrase,
    enableQuerySearch,
    submissionName,
    submissionVenueId,
  })
    .filter(([key, value]) => value === undefined)
    .map((p) => p[0])
  if (missingConfig.length > 0) {
    const errorMessage = `PC Console is missing required properties: ${
      missingConfig.length ? missingConfig.join(', ') : 'submissionVenueId'
    }`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }
  return (
    <>
      <BasicHeader title={header?.title} instructions={header.instructions} />
      <Tabs>
        <TabList>
          <Tab
            id="venue-configuration"
            active={activeTabId === '#venue-configuration' ? true : undefined}
            onClick={() => setActiveTabId('#venue-configuration')}
          >
            Overview
          </Tab>
          <Tab
            id="paper-status"
            active={activeTabId === '#paper-status' ? true : undefined}
            onClick={() => setActiveTabId('#paper-status')}
          >
            Paper Status
          </Tab>
          <Tab
            id="reviewer-status"
            active={activeTabId === '#reviewer-status' ? true : undefined}
            onClick={() => setActiveTabId('#reviewer-status')}
          >
            {prettyId(reviewerName)} Status
          </Tab>
          <Tab
            id="senior-reviewer-status"
            active={activeTabId === '#senior-reviewer-status' ? true : undefined}
            onClick={() => setActiveTabId('#senior-reviewer-status')}
          >
            {prettyId(seniorReviewerName)} Status
          </Tab>
          {areaChairsId && (
            <Tab
              id="areachair-status"
              active={activeTabId === '#areachair-status' ? true : undefined}
              onClick={() => setActiveTabId('#areachair-status')}
            >
              Area Chair Status
            </Tab>
          )}
          {seniorAreaChairsId && (
            <Tab
              id="seniorareachair-status"
              active={activeTabId === '#seniorareachair-status' ? true : undefined}
              onClick={() => setActiveTabId('#seniorareachair-status')}
            >
              Senior Area Chair Status
            </Tab>
          )}
          {(withdrawnVenueId || deskRejectedVenueId) && (
            <Tab
              id="deskrejectwithdrawn-status"
              active={activeTabId === '#deskrejectwithdrawn-status' ? true : undefined}
              onClick={() => setActiveTabId('#deskrejectwithdrawn-status')}
            >
              Desk Rejected/Withdrawn Papers
            </Tab>
          )}
        </TabList>

        <TabPanels>
          <TabPanel id="venue-configuration">
            <Overview pcConsoleData={pcConsoleData} />
          </TabPanel>
          <TabPanel id="paper-status">
            {activeTabId === '#paper-status' && (
              <PaperStatus
                pcConsoleData={pcConsoleData}
                loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
              />
            )}
          </TabPanel>
          <TabPanel id="reviewer-status">
            <ReviewerStatusTab
              pcConsoleData={pcConsoleData}
              loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
              showContent={activeTabId === '#reviewer-status'}
            />
          </TabPanel>
          <TabPanel id="senior-reviewer-status">
            <WebFieldContext.Provider
              value={{ ...webfieldData, reviewersId: seniorReviewersId }}
            >
              <ReviewerStatusTab
                pcConsoleData={{
                  ...pcConsoleData,
                  reviewers: pcConsoleData.seniorReviewers,
                  paperGroups: {
                    ...pcConsoleData.paperGroups,
                    reviewerGroups: pcConsoleData.paperGroups?.seniorReviewerGroups,
                  },
                  noteNumberReviewMetaReviewMap: pcConsoleData.noteNumberReviewMetaReviewMap
                    ? new Map(
                        Array.from(
                          pcConsoleData.noteNumberReviewMetaReviewMap,
                          ([key, value]) => [
                            key,
                            {
                              ...value,
                              reviewers: value.seniorReviewers,
                              reviewProgressData: value.seniorReviewProgressData,
                              officialReviews: value.seniorOfficialReviews,
                            },
                          ]
                        )
                      )
                    : null,
                }}
                loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
                showContent={activeTabId === '#senior-reviewer-status'}
              />
            </WebFieldContext.Provider>
          </TabPanel>
          {areaChairsId && activeTabId === '#areachair-status' && (
            <TabPanel id="areachair-status">
              <AreaChairStatus
                pcConsoleData={pcConsoleData}
                loadSacAcInfo={loadSacAcInfo}
                loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
              />
            </TabPanel>
          )}
          {seniorAreaChairsId && activeTabId === '#seniorareachair-status' && (
            <TabPanel id="seniorareachair-status">
              <SeniorAreaChairStatus
                pcConsoleData={pcConsoleData}
                loadSacAcInfo={loadSacAcInfo}
              />
            </TabPanel>
          )}
          <TabPanel id="deskrejectwithdrawn-status">
            {activeTabId === '#deskrejectwithdrawn-status' && (
              <RejectedWithdrawnPapers pcConsoleData={pcConsoleData} />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default ProgramChairWithSeniorReviewerConsole
