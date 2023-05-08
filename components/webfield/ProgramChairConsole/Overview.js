/* globals promptError: false */
import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import LoadingSpinner from '../../LoadingSpinner'
import WebFieldContext from '../../WebFieldContext'
import { formatDateTime, inflect, prettyId } from '../../../lib/utils'
import { buildEdgeBrowserUrl } from '../../../lib/webfield-utils'

const StatContainer = ({ title, hint, value }) => (
  <div className="col-md-4 col-xs-6">
    <h4>{title}:</h4>
    {hint && <p className="hint">{hint}</p>}
    <h3>{value}</h3>
  </div>
)

const renderStat = (numComplete, total) =>
  total === 0 ? (
    <span>{numComplete} / 0</span>
  ) : (
    <>
      {((numComplete * 100) / total).toFixed(2)}%&nbsp;&nbsp;
      <span className="fraction">{` (${numComplete} / ${total})`}</span>
    </>
  )

const RecruitmentStatsRow = ({ pcConsoleData }) => {
  const { reviewersId, areaChairsId, seniorAreaChairsId } = useContext(WebFieldContext)
  const { accessToken } = useUser()
  const [invitedCount, setInvitedCount] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const reviewersInvitedId = reviewersId ? `${reviewersId}/Invited` : null
  const areaChairsInvitedId = areaChairsId ? `${areaChairsId}/Invited` : null
  const seniorAreaChairsInvitedId = seniorAreaChairsId ? `${seniorAreaChairsId}/Invited` : null

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await Promise.all(
        [reviewersInvitedId, areaChairsInvitedId, seniorAreaChairsInvitedId].map((invitedId) =>
          invitedId
            ? api.getGroupById(invitedId, accessToken, {
                select: 'members',
              })
            : Promise.resolve(null)
        )
      )
      setInvitedCount({
        reviewersInvitedCount: result[0]?.members?.length ?? 0,
        areaChairsInvitedCount: result[1]?.members?.length ?? 0,
        seniorAreaChairsInvitedCount: result[2]?.members?.length ?? 0,
      })
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (!reviewersId) return
    loadData()
  }, [])

  return (
    <>
      <div className="row recruitment-stat-row">
        <StatContainer
          title="Reviewer Recruitment"
          hint="accepted / invited"
          value={
            !isLoading && pcConsoleData.reviewers ? (
              `${pcConsoleData.reviewers?.length} / ${invitedCount.reviewersInvitedCount}`
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
        {areaChairsId && (
          <StatContainer
            title="Area Chair Recruitment"
            hint="accepted / invited"
            value={
              !isLoading && pcConsoleData.areaChairs ? (
                `${pcConsoleData.areaChairs?.length} / ${invitedCount.areaChairsInvitedCount}`
              ) : (
                <LoadingSpinner inline={true} text={null} />
              )
            }
          />
        )}
        {seniorAreaChairsId && (
          <StatContainer
            title="Senior Area Chair Recruitment"
            hint="accepted / invited"
            value={
              !isLoading && pcConsoleData.seniorAreaChairs ? (
                `${pcConsoleData.seniorAreaChairs?.length} / ${invitedCount.seniorAreaChairsInvitedCount}`
              ) : (
                <LoadingSpinner inline={true} text={null} />
              )
            }
          />
        )}
      </div>
      <hr className="spacer" />
    </>
  )
}

const SubmissionsStatsRow = ({ pcConsoleData }) => {
  const [submissionByStatus, setSubmissionByStatus] = useState({})

  useEffect(() => {
    if (!pcConsoleData) return
    const { withdrawnNotes, deskRejectedNotes, notes: activeSubmissions } = pcConsoleData
    setSubmissionByStatus({ activeSubmissions, deskRejectedNotes, withdrawnNotes })
  }, [pcConsoleData])
  return (
    <>
      <div className="row">
        <StatContainer
          title="Active Submissions"
          value={
            submissionByStatus.activeSubmissions ? (
              submissionByStatus.activeSubmissions.length
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
        <StatContainer
          title="Withdrawn Submissions"
          value={
            submissionByStatus.withdrawnNotes ? (
              submissionByStatus.withdrawnNotes.length
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
        <StatContainer
          title="Desk Rejected Submissions"
          value={
            submissionByStatus.deskRejectedNotes ? (
              submissionByStatus.deskRejectedNotes.length
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

const BiddingStatsRow = ({
  reviewersBidEnabled,
  areaChairsBidEnabled,
  seniorAreaChairsBidEnabled,
  recommendationEnabled,
  pcConsoleData,
}) => {
  const { areaChairsId, seniorAreaChairsId, reviewersId, bidName, recommendationName } =
    useContext(WebFieldContext)

  const calcBiddingProgress = (id, role) => {
    const bidInvitation = pcConsoleData.invitations?.find((p) => p.id === `${id}/-/${bidName}`)
    const taskCompletionCount = bidInvitation?.taskCompletionCount
      ? parseInt(bidInvitation.taskCompletionCount, 10)
      : 0
    const bidComplete = pcConsoleData.bidCounts?.[role]?.reduce(
      (numComplete, bidCount) =>
        bidCount.count >= taskCompletionCount ? numComplete + 1 : numComplete,
      0
    )
    const total = pcConsoleData[role]?.length
    return total === 0 ? (
      <span>{bidComplete} / 0</span>
    ) : (
      <>
        {((bidComplete * 100) / total).toFixed(2)}%&nbsp;&nbsp;
        <span className="fraction">{` (${bidComplete} / ${total})`}</span>
      </>
    )
  }
  const calcRecommendationProgress = () => {
    const recommendationInvitation = pcConsoleData.invitations?.find(
      (p) => p.id === `${reviewersId}/-/${recommendationName}`
    )
    const taskCompletionCount = recommendationInvitation?.taskCompletionCount
      ? parseInt(recommendationInvitation.taskCompletionCount, 10)
      : 0
    const recommendationComplete = Object.values(
      pcConsoleData.acRecommendationsCount ?? {}
    )?.reduce(
      (numComplete, recommendationCount) =>
        recommendationCount >= taskCompletionCount ? numComplete + 1 : numComplete,
      0
    )
    const total = pcConsoleData.areaChairs?.length
    return total === 0 ? (
      <span>{recommendationComplete} / 0</span>
    ) : (
      <>
        {((recommendationComplete * 100) / total).toFixed(2)}%&nbsp;&nbsp;
        <span className="fraction">{` (${recommendationComplete} / ${total})`}</span>
      </>
    )
  }
  if (
    !reviewersBidEnabled &&
    !areaChairsBidEnabled &&
    !seniorAreaChairsBidEnabled &&
    !recommendationEnabled
  )
    return null

  return (
    <>
      <div className="row">
        {reviewersBidEnabled && reviewersId && (
          <StatContainer
            title="Reviewer Bidding Progress"
            hint="% of Reviewers who have completed the required number of bids"
            value={calcBiddingProgress(reviewersId, 'reviewers')}
          />
        )}
        {areaChairsBidEnabled && areaChairsId && (
          <StatContainer
            title="AC Bidding Progress"
            hint="% of ACs who have completed the required number of bids"
            value={calcBiddingProgress(areaChairsId, 'areaChairs')}
          />
        )}
        {recommendationEnabled && areaChairsId && (
          <StatContainer
            title="Recommendation Progress"
            hint="% of ACs who have completed the required number of reviewer recommendations"
            value={calcRecommendationProgress()}
          />
        )}
        {seniorAreaChairsBidEnabled && seniorAreaChairsId && (
          <StatContainer
            title="SAC Bidding Progress"
            hint="% of SACs who have completed the required number of bids"
            value={calcBiddingProgress(seniorAreaChairsId, 'seniorAreaChairs')}
          />
        )}
      </div>
      <hr className="spacer" />
    </>
  )
}

const ReviewStatsRow = ({ pcConsoleData }) => {
  const { paperReviewsCompleteThreshold } = useContext(WebFieldContext)

  const [reviewStats, setReviewStats] = useState({})

  useEffect(() => {
    if (!pcConsoleData.notes || Object.keys(reviewStats).length) return
    const allOfficialReviews = [
      ...(pcConsoleData.officialReviewsByPaperNumberMap?.values() ?? []),
    ]?.flat()

    const assignedReviewsCount = pcConsoleData.paperGroups?.reviewerGroups?.reduce(
      (prev, curr) => prev + curr.members.length,
      0
    )

    // map tilde id in reviewerGroup to anon reviewer group id in anonReviewerGroups
    const reviewerAnonGroupIds = {}
    const activeNoteNumbers = pcConsoleData.notes.map((note) => note.number)
    pcConsoleData.paperGroups?.reviewerGroups.forEach((reviewerGroup) => {
      if (!activeNoteNumbers.includes(reviewerGroup.noteNumber)) return
      reviewerGroup.members.forEach((reviewer) => {
        if (!reviewer.reviewerAnonGroup) return
        const reviewerProfileId = reviewer.reviewerProfileId // eslint-disable-line prefer-destructuring
        if (reviewerAnonGroupIds[reviewerProfileId]) {
          reviewerAnonGroupIds[reviewerProfileId].push({
            noteNumber: reviewerGroup.noteNumber,
            anonGroupId: reviewer.reviewerAnonGroup,
          })
        } else {
          reviewerAnonGroupIds[reviewerProfileId] = [
            {
              noteNumber: reviewerGroup.noteNumber,
              anonGroupId: reviewer.reviewerAnonGroup,
            },
          ]
        }
      })
    })

    // all anon reviewer id group have signed official review
    const reviewersCompletedAllReviews = Object.values(reviewerAnonGroupIds ?? {}).filter(
      (anonReviewerGroups) =>
        anonReviewerGroups?.every((anonReviewerGroup) => {
          const paperOfficialReviews = pcConsoleData.officialReviewsByPaperNumberMap.get(
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
      const paperOfficialReviews = pcConsoleData.officialReviewsByPaperNumberMap.get(
        note.number
      )

      const paperReviewers = pcConsoleData.paperGroups?.reviewerGroups?.find(
        (p) => p.noteNumber === note.number
      )?.members

      const completedReviewsCount = paperOfficialReviews?.length
      const assignedReviewersCount = paperReviewers?.length
      return (
        assignedReviewersCount > 0 &&
        completedReviewsCount >= (paperReviewsCompleteThreshold ?? assignedReviewersCount)
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
          title="Review Progress"
          hint="% of all assigned official reviews that have been submitted"
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
          title="Reviewer Progress"
          hint="% of reviewers who have reviewed all of their assigned papers"
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
            paperReviewsCompleteThreshold
              ? `at least ${inflect(paperReviewsCompleteThreshold, 'review', 'reviews', true)}`
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

const MetaReviewStatsRow = ({ pcConsoleData }) => {
  const { areaChairsId, recommendationName } = useContext(WebFieldContext)
  const metaReivews = [...(pcConsoleData.metaReviewsByPaperNumberMap?.values() ?? [])].filter(
    (p) => p.length
  )
  const metaReviewsCount = metaReivews.length
  const allMetaReviews = metaReivews
    .flat()
    .flatMap((p) => p?.content?.[recommendationName]?.value ?? [])

  // map tilde id in areaChairGroups to anon areachair group id in anonAreaChairGroups
  const areaChairAnonGroupIds = {}
  const activeNoteNumbers = pcConsoleData.notes?.map((n) => n.number)
  pcConsoleData.paperGroups?.areaChairGroups.forEach((areaChairGroup) => {
    if (!activeNoteNumbers.includes(areaChairGroup.noteNumber)) return
    areaChairGroup.members.forEach((areaChair) => {
      if (!areaChair.areaChairAnonGroup) return
      const areaChairProfileId = areaChair.areaChairProfileId // eslint-disable-line prefer-destructuring
      if (areaChairAnonGroupIds[areaChairProfileId]) {
        areaChairAnonGroupIds[areaChairProfileId].push({
          noteNumber: areaChairGroup.noteNumber,
          anonGroupId: areaChair.areaChairAnonGroup,
        })
      } else {
        areaChairAnonGroupIds[areaChairProfileId] = [
          {
            noteNumber: areaChairGroup.noteNumber,
            anonGroupId: areaChair.areaChairAnonGroup,
          },
        ]
      }
    })
  })

  // all anon areaChair id group have signed meta review
  const areaChairsCompletedAllMetaReviews = Object.values(areaChairAnonGroupIds ?? {}).filter(
    (anonAreaChairGroups) =>
      anonAreaChairGroups?.every((anonAreaChairGroup) => {
        const paperOfficialMetaReviews = pcConsoleData.metaReviewsByPaperNumberMap.get(
          anonAreaChairGroup.noteNumber
        )
        return paperOfficialMetaReviews?.find(
          (p) => p.signatures[0] === anonAreaChairGroup.anonGroupId
        )
      })
  )

  const areaChairsComplete = areaChairsCompletedAllMetaReviews?.length
  const areaChairsWithAssignmentsCount = Object.values(areaChairAnonGroupIds ?? {}).length

  if (!areaChairsId) return null
  return (
    <>
      <div className="row">
        <StatContainer
          title="Meta-Review Progress"
          hint="% of papers that have received meta-reviews"
          value={
            pcConsoleData.notes && pcConsoleData.paperGroups ? (
              renderStat(metaReviewsCount, pcConsoleData.notes.length)
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
        <StatContainer
          title="AC Meta-Review Progress"
          hint="% of area chairs who have completed meta reviews for all their assigned papers"
          value={
            pcConsoleData.notes && pcConsoleData.paperGroups ? (
              renderStat(areaChairsComplete, areaChairsWithAssignmentsCount)
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
      </div>
      <div className="row">
        {[...new Set(allMetaReviews)].sort().map((type) => {
          const perDecisionCount = allMetaReviews.filter((p) => p === type).length
          return (
            <StatContainer
              key={type}
              title={type}
              value={
                pcConsoleData.metaReviewsByPaperNumberMap ? (
                  renderStat(perDecisionCount, pcConsoleData.notes.length)
                ) : (
                  <LoadingSpinner inline={true} text={null} />
                )
              }
            />
          )
        })}
      </div>
      <hr className="spacer" />
    </>
  )
}

const CustomStageStatsRow = ({ pcConsoleData }) => {
  const { customStageInvitations = [] } = useContext(WebFieldContext)
  const customStageInvitationIds = customStageInvitations.map((p) => `/-/${p.name}`)
  const noCustomStage = !pcConsoleData.invitations?.some((p) =>
    customStageInvitationIds?.some((q) => p.id.includes(q))
  )

  const getReviews = (customStageInvitation) => {
    const customStageInvitationId = `/-/${customStageInvitation.name}`
    return [...(pcConsoleData.customStageReviewsByPaperNumberMap?.values() ?? [])].filter(
      (repliesToNote) =>
        repliesToNote.filter((reply) =>
          reply.invitations.find((q) => q.includes(customStageInvitationId))
        ).length >= customStageInvitation.repliesPerSubmission
    )
  }

  if (noCustomStage) return null
  return (
    <>
      {customStageInvitations.map((customStageInvitation) => {
        const reviews = getReviews(customStageInvitation)
        const uniqueDisplayValues = [
          ...new Set(
            reviews
              .flat()
              .flatMap(
                (review) => review.content?.[customStageInvitation.displayField]?.value ?? []
              )
          ),
        ].sort()

        return (
          <React.Fragment key={customStageInvitation.name}>
            <div className="row">
              <StatContainer
                title={`${prettyId(customStageInvitation.role)} ${prettyId(
                  customStageInvitation.name
                )} Progress`}
                hint={customStageInvitation.description}
                value={
                  pcConsoleData.notes ? (
                    renderStat(reviews?.length, pcConsoleData.notes.length)
                  ) : (
                    <LoadingSpinner inline={true} text={null} />
                  )
                }
              />
            </div>
            <div className="row">
              {uniqueDisplayValues.map((displayValue) => {
                const noteCount = reviews.filter((p) =>
                  p.some(
                    (q) =>
                      q.content?.[customStageInvitation.displayField]?.value === displayValue
                  )
                ).length
                return (
                  <StatContainer
                    key={displayValue}
                    title={displayValue}
                    value={
                      pcConsoleData.customStageReviewsByPaperNumberMap ? (
                        renderStat(noteCount, pcConsoleData.notes.length)
                      ) : (
                        <LoadingSpinner inline={true} text={null} />
                      )
                    }
                  />
                )
              })}
            </div>
            <hr className="spacer" />
          </React.Fragment>
        )
      })}
    </>
  )
}

const DecisionStatsRow = ({ pcConsoleData }) => {
  const decisions = [...(pcConsoleData.decisionByPaperNumberMap?.values() ?? [])]
  const notesWithFinalDecision = decisions.filter((p) => p)
  const decisionsCount = notesWithFinalDecision?.length
  const submissionsCount = pcConsoleData.notes?.length
  const allDecisions = decisions.flatMap((p) => p?.content?.decision?.value ?? [])

  return (
    <>
      <div className="row">
        <StatContainer
          title="Decision Progress"
          hint="% of papers that have received a decision"
          value={
            pcConsoleData.notes ? (
              renderStat(decisionsCount, submissionsCount)
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
      </div>
      <div className="row">
        {[...new Set(allDecisions)]?.sort().map((type) => {
          const perDecisionCount = allDecisions.filter((p) => p === type).length
          return (
            <StatContainer
              key={type}
              title={type}
              value={
                pcConsoleData.decisionByPaperNumberMap ? (
                  renderStat(perDecisionCount, pcConsoleData.notes.length)
                ) : (
                  <LoadingSpinner inline={true} text={null} />
                )
              }
            />
          )
        })}
      </div>
      <hr className="spacer" />
    </>
  )
}

const DescriptionTimelineOtherConfigRow = ({
  reviewersBidEnabled,
  areaChairsBidEnabled,
  seniorAreaChairsBidEnabled,
  pcConsoleData,
  recommendationEnabled,
}) => {
  const {
    venueId,
    areaChairsId,
    seniorAreaChairsId,
    reviewersId,
    programChairsId,
    authorsId,
    bidName,
    submissionId,
    officialReviewName,
    commentName,
    officialMetaReviewName,
    decisionName = 'Decision',
    scoresName,
    recommendationName,
    recruitmentName = 'Recruitment',
    customStageInvitations = [],
    assignmentUrls,
  } = useContext(WebFieldContext)

  const { requestForm, registrationForms, invitations } = pcConsoleData
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs)`
  )
  const requestFormContent = requestForm?.content
  const sacRoles = requestFormContent?.senior_area_chair_roles ?? ['Senior_Area_Chairs']
  const acRoles = requestFormContent?.area_chair_roles ?? ['Area_Chairs']
  const hasEthicsChairs = requestFormContent?.ethics_chairs_and_reviewers?.includes('Yes')
  const reviewerRoles = requestFormContent?.reviewer_roles ?? ['Reviewers']

  const getFotmattedDate = (invitation, type) => {
    const dateFormatOption = {
      minute: 'numeric',
      second: undefined,
      timeZoneName: 'short',
      locale: 'en-GB',
    }

    const rawDate = invitation.edit?.invitation
      ? invitation.edit.invitation[type]
      : invitation[type]
    return rawDate ? formatDateTime(rawDate, dateFormatOption) : null
  }

  const getAssignmentLink = (role) => {
    if (assignmentUrls?.[role]?.automaticAssignment === false) {
      return assignmentUrls?.[role]?.manualAssignmentUrl &&
        pcConsoleData.invitations?.some((p) => p.id === `${venueId}/${role}/-/Assignment`)
        ? `${assignmentUrls[role].manualAssignmentUrl}&referrer=${referrerUrl}`
        : null
    }
    return `/assignments?group=${venueId}/${role}&referrer=${referrerUrl}`
  }

  const timelineInvitations = [
    { id: submissionId, displayName: 'Paper Submissions' },
    { id: `${reviewersId}/-/${bidName}`, displayName: 'Reviewers Bidding' },
    { id: `${reviewersId}/-/${recruitmentName}`, displayName: 'Reviewers Recruitment' },
    ...(seniorAreaChairsId
      ? [
          {
            id: `${seniorAreaChairsId}/-/${bidName}`,
            displayName: 'Senior Area Chairs Bidding',
          },
          {
            id: `${seniorAreaChairsId}/-/${recruitmentName}`,
            displayName: 'Senior Area Chairs Recruitment',
          },
        ]
      : []),
    ...(areaChairsId
      ? [
          {
            id: `${areaChairsId}/-/${bidName}`,
            displayName: 'Area Chairs Bidding',
          },
          {
            id: `${areaChairsId}/-/${recruitmentName}`,
            displayName: 'Area Chairs Recruitment',
          },
        ]
      : []),
    { id: `${venueId}/-/${officialReviewName}`, displayName: 'Reviewing' },
    { id: `${venueId}/-/${commentName}`, displayName: 'Commenting' },
    { id: `${venueId}/-/${officialMetaReviewName}`, displayName: 'Meta Reviews' },
    { id: `${venueId}/-/${decisionName}`, displayName: 'Decisions' },
    ...(customStageInvitations?.length > 0
      ? customStageInvitations.map((p) => ({
          id: `${venueId}/-/${p.name}`,
          displayName: prettyId(p.name),
        }))
      : []),
  ].flatMap((p) => {
    const invitation = invitations?.find((q) => q.id === p.id)
    if (!invitation) return []

    const start = getFotmattedDate(invitation, 'cdate')
    const end = getFotmattedDate(invitation, 'duedate')
    const exp = getFotmattedDate(invitation, 'expdate')

    const periodString = (
      <span>
        {start ? (
          <>
            {' '}
            from <em>{start}</em>
          </>
        ) : (
          ' open'
        )}
        {end ? (
          <>
            {' '}
            until <em>{end}</em> and expires <em>{exp}</em>
          </>
        ) : (
          <>
            {' '}
            no deadline and expired <em>{exp}</em>
          </>
        )}
      </span>
    )
    return { ...p, duedate: invitation.duedate, invitationObj: invitation, periodString }
  })

  const datedInvitations = timelineInvitations
    .filter((p) => p.duedate)
    .sort((a, b) => a.duedate - b.duedate)
  const notDatedInvitations = timelineInvitations.filter((p) => !p.duedate)

  if (!requestForm) return null
  return (
    <>
      <div className="row">
        {requestForm && (
          <div className="col-md-4 col-xs-12">
            <h4>Description:</h4>
            <p>
              <span>
                {`Author And Reviewer Anonymity: ${requestFormContent?.['Author and Reviewer Anonymity']}`}
                <br />
                {requestFormContent?.['Open Reviewing Policy']}
                <br />
                {`Paper matching uses ${requestFormContent?.['Paper Matching']?.join(', ')}`}
                {requestFormContent?.['Other Important Information'] && (
                  <>
                    <br />
                    {requestFormContent?.['Other Important Information']}
                  </>
                )}
              </span>
              <br />
              <a href={`/forum?id=${requestForm.id}&referrer=${referrerUrl}`}>
                <strong>Full Venue Configuration</strong>
              </a>
            </p>
          </div>
        )}
        <div className="col-md-8 col-xs-12">
          <h4>Timeline:</h4>
          {datedInvitations.map((invitation) => (
            <li className="overview-timeline" key={invitation.id}>
              <a href={`/forum?id=${requestForm.id}&referrer=${referrerUrl}`}>
                {invitation.displayName}
              </a>
              {invitation.periodString}
            </li>
          ))}
          {notDatedInvitations.map((invitation) => (
            <li className="overview-timeline" key={invitation.id}>
              <a href={`/forum?id=${requestForm.id}&referrer=${referrerUrl}`}>
                {invitation.displayName}
              </a>
              {invitation.periodString}
            </li>
          ))}
          {seniorAreaChairsId &&
            sacRoles.map((role) => {
              const assignmentConfig = invitations.find(
                (p) => p.id === `${venueId}/${role}/-/Assignment_Configuration`
              )
              if (!assignmentConfig) return null
              return (
                <li className="overview-timeline" key={assignmentConfig.id}>
                  <a href={`/assignments?group=${venueId}/${role}&referrer=${referrerUrl}`}>
                    {`${prettyId(role)} Paper Assignment`}
                  </a>{' '}
                  open until Reviewing starts
                </li>
              )
            })}
          {areaChairsId &&
            acRoles.map((role) => {
              const assignmentLink = getAssignmentLink(role)
              return (
                assignmentLink && (
                  <li className="overview-timeline" key={role}>
                    <a
                      href={assignmentLink}
                      target="_blank"
                      rel="noreferrer noopener"
                    >{`${prettyId(role)} Paper Assignment`}</a>{' '}
                    open until Reviewing starts
                  </li>
                )
              )
            })}
          {reviewerRoles.map((role) => {
            const assignmentLink = getAssignmentLink(role)
            return (
              assignmentLink && (
                <li className="overview-timeline" key={role}>
                  <a
                    href={assignmentLink}
                    target="_blank"
                    rel="noreferrer noopener"
                  >{`${prettyId(role)} Paper Assignment`}</a>{' '}
                  open until Reviewing starts
                </li>
              )
            )
          })}
        </div>
      </div>

      {/* Official Committee, Registration Forms, Bids & Recommendation */}
      <div className="row">
        <div className="col-md-4 col-xs-6">
          <h4>Venue Roles:</h4>
          <ul className="overview-list">
            <li>
              <Link href={`/group/edit?id=${programChairsId}`}>
                <a>Program Chairs</a>
              </Link>
            </li>
            {seniorAreaChairsId &&
              sacRoles.map((role) => (
                <li key={role}>
                  <Link href={`/group/edit?id=${venueId}/${role}`}>
                    <a>{prettyId(role)}</a>
                  </Link>{' '}
                  (
                  <Link href={`/group/edit?id=${venueId}/${role}/Invited`}>
                    <a>Invited</a>
                  </Link>
                  ,
                  <Link href={`/group/edit?id=${venueId}/${role}/Declined`}>
                    <a>Declined</a>
                  </Link>
                  )
                </li>
              ))}
            {areaChairsId &&
              acRoles.map((role) => (
                <li key={role}>
                  <Link href={`/group/edit?id=${venueId}/${role}`}>
                    <a>{prettyId(role)}</a>
                  </Link>{' '}
                  (
                  <Link href={`/group/edit?id=${venueId}/${role}/Invited`}>
                    <a>Invited</a>
                  </Link>
                  ,
                  <Link href={`/group/edit?id=${venueId}/${role}/Declined`}>
                    <a>Declined</a>
                  </Link>
                  )
                </li>
              ))}
            {hasEthicsChairs && (
              <>
                <li>
                  <Link href={`/group/edit?id=${venueId}/Ethics_Chairs`}>
                    <a>Ethics_Chairs</a>
                  </Link>{' '}
                  (
                  <Link href={`/group/edit?id=${venueId}/Ethics_Chairs/Invited`}>
                    <a>Invited</a>
                  </Link>
                  ,
                  <Link href={`/group/edit?id=${venueId}/Ethics_Chairs/Declined`}>
                    <a>Declined</a>
                  </Link>
                  )
                </li>
                <li>
                  <Link href={`/group/edit?id=${venueId}/Ethics_Reviewers`}>
                    <a>Ethics_Reviewers</a>
                  </Link>{' '}
                  (
                  <Link href={`/group/edit?id=${venueId}/Ethics_Reviewers/Invited`}>
                    <a>Invited</a>
                  </Link>
                  ,
                  <Link href={`/group/edit?id=${venueId}/Ethics_Reviewers/Declined`}>
                    <a>Declined</a>
                  </Link>
                  )
                </li>
              </>
            )}
            {reviewerRoles.map((role) => (
              <li key={role}>
                <Link href={`/group/edit?id=${venueId}/${role}`}>
                  <a>{prettyId(role)}</a>
                </Link>{' '}
                (
                <Link href={`/group/edit?id=${venueId}/${role}/Invited`}>
                  <a>Invited</a>
                </Link>
                ,
                <Link href={`/group/edit?id=${venueId}/${role}/Declined`}>
                  <a>Declined</a>
                </Link>
                )
              </li>
            ))}
            <li>
              <Link href={`/group/edit?id=${authorsId}`}>
                <a>Authors</a>
              </Link>{' '}
              (
              <Link href={`/group/edit?id=${authorsId}/Accepted`}>
                <a>Accepted</a>
              </Link>
              )
            </li>
          </ul>
        </div>
        {registrationForms && registrationForms.length !== 0 && (
          <div className="col-md-4 col-xs-6">
            <h4>Registration Forms:</h4>
            <ul className="overview-list">
              {registrationForms.map((form) => (
                <li key={form.id} className="overview-registration-link">
                  <Link href={`/forum?id=${form.id}&referrer=${referrerUrl}`}>
                    <a>{form.content?.title?.value}</a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(reviewersBidEnabled || areaChairsBidEnabled || seniorAreaChairsBidEnabled) && (
          <div className="col-md-4 col-xs-6">
            <h4>Bids & Recommendations:</h4>
            <ul className="overview-list">
              {reviewersBidEnabled && (
                <li>
                  <Link
                    href={buildEdgeBrowserUrl(
                      null,
                      invitations,
                      reviewersId,
                      bidName,
                      scoresName
                    )}
                  >
                    <a>Reviewer Bids</a>
                  </Link>
                </li>
              )}
              {seniorAreaChairsBidEnabled && (
                <li>
                  <Link
                    href={buildEdgeBrowserUrl(
                      null,
                      invitations,
                      seniorAreaChairsId,
                      bidName,
                      scoresName
                    )}
                  >
                    <a>Senior Area Chair Bids</a>
                  </Link>
                </li>
              )}
              {areaChairsBidEnabled && (
                <>
                  <li>
                    <Link
                      href={buildEdgeBrowserUrl(
                        null,
                        invitations,
                        areaChairsId,
                        bidName,
                        scoresName
                      )}
                    >
                      <a>Area Chair Bid</a>
                    </Link>
                  </li>
                  {recommendationEnabled && (
                    <li>
                      <Link
                        href={buildEdgeBrowserUrl(
                          null,
                          invitations,
                          reviewersId,
                          recommendationName,
                          scoresName
                        )}
                      >
                        <a>Area Chair Reviewer Recommendations</a>
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}

const Overview = ({ pcConsoleData }) => {
  const { areaChairsId, seniorAreaChairsId, reviewersId, bidName, recommendationName } =
    useContext(WebFieldContext)

  const isBidEnabled = (groupId) =>
    pcConsoleData.invitations?.find((p) => p.id === `${groupId}/-/${bidName}`)

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
      <ReviewStatsRow pcConsoleData={pcConsoleData} />
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

export default Overview
