import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import { useRouter } from 'next/router'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import Table from '../Table'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import WebFieldContext from '../WebFieldContext'
import { useContext, useEffect, useMemo, useState } from 'react'
import BasicHeader from './BasicHeader'
import {
  formatDateTime,
  getIndentifierFromGroup,
  getNumberFromGroup,
  getProfileName,
  inflect,
  prettyId,
} from '../../lib/utils'
import Link from 'next/link'
import LoadingSpinner from '../LoadingSpinner'
import NoteSummary from './NoteSummary'
import PaginationLinks from '../PaginationLinks'
import { AreaChairConsoleNoteReviewStatus } from './NoteReviewStatus'
import { ProgramChairConsolePaperAreaChairProgress } from './NoteMetaReviewStatus'
import PaperStatusMenuBar from './PaperStatusMenuBar'
import AreaChairStatusMenuBar from './AreaChairStatusMenuBar'
import { buildEdgeBrowserUrl } from '../../lib/webfield-utils'
import SeniorAreaChairStatusMenuBar from './SeniorAreaChairStatusMenuBar'

// id could be tilde id or email
const getProfileLink = (profileId, id) => {
  if (profileId) return `/profile?id=${profileId}`
  return id.startsWith('~') ? `/profile?id=${id}` : `/profile?email=${id}`
}
// #region overview tab
const StatContainer = ({ title, hint, value }) => {
  return (
    <div className="col-md-4 col-xs-6">
      <h4>{title}:</h4>
      {hint && <p className="hint">{hint}</p>}
      <h3>{value}</h3>
    </div>
  )
}

const renderStat = (numComplete, total) => {
  return total === 0 ? (
    <span>{numComplete} / 0</span>
  ) : (
    <>
      {((numComplete * 100) / total).toFixed(2)} %<span>{` (${numComplete} / ${total})`}</span>
    </>
  )
}

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
        [reviewersInvitedId, areaChairsInvitedId, seniorAreaChairsInvitedId].map(
          (invitedId) => {
            return invitedId
              ? api.getGroupById(invitedId, accessToken, {
                  select: 'members',
                })
              : Promise.resolve(null)
          }
        )
      )
      setInvitedCount({
        reviewersInvitedCount: result[0].members.length,
        areaChairsInvitedCount: result[1].members.length,
        seniorAreaChairsInvitedCount: result[2].members.length,
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
      <div className="row">
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
  return (
    <>
      <div className="row">
        <StatContainer
          title="Active Submissions"
          value={
            pcConsoleData.notes ? (
              pcConsoleData.notes.length
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
        <StatContainer
          title="Withdrawn Submissions"
          value={
            pcConsoleData.withdrawnNotes ? (
              pcConsoleData.withdrawnNotes.length
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
        <StatContainer
          title="Desk Rejected Submissions"
          value={
            pcConsoleData.deskRejectedNotes ? (
              pcConsoleData.deskRejectedNotes.length
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

const BiddingStatsRow = ({ bidEnabled, recommendationEnabled, pcConsoleData }) => {
  if (!bidEnabled && !recommendationEnabled) return null
  const { areaChairsId, seniorAreaChairsId, reviewersId, bidName } =
    useContext(WebFieldContext)

  const calcBiddingProgress = (id, role) => {
    const bidInvitation = pcConsoleData.invitations?.find((p) => p.id === `${id}/-/${bidName}`)
    const taskCompletionCount = bidInvitation?.taskCompletionCount
      ? parseInt(bidInvitation.taskCompletionCount, 10)
      : 0
    const bidComplete = pcConsoleData.bidCounts?.[role]?.reduce((numComplete, bidCount) => {
      return bidCount.count >= taskCompletionCount ? numComplete + 1 : numComplete
    }, 0)
    const total = pcConsoleData[role]?.length
    return total === 0 ? (
      <span>{bidComplete} / 0</span>
    ) : (
      <>
        {((bidComplete * 100) / total).toFixed(2)} %
        <span>{` (${bidComplete} / ${total})`}</span>
      </>
    )
  }

  return (
    <>
      <div className="row">
        {bidEnabled && reviewersId && (
          <StatContainer
            title="Reviewer Bidding Progress"
            hint="% of ACs who have completed the required number of bids"
            value={calcBiddingProgress(reviewersId, 'reviewers')}
          />
        )}
        {bidEnabled && areaChairsId && (
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
            value="7661"
          />
        )}
        {bidEnabled && seniorAreaChairsId && (
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

const ReviewStatsRow = ({ pcConsoleData, showContent }) => {
  const { paperReviewsCompleteThreshold, officialReviewName, venueId } =
    useContext(WebFieldContext)

  const [reviewStats, setReviewStats] = useState({})

  useEffect(() => {
    if (!pcConsoleData.notes || Object.keys(reviewStats).length) return
    // const allOfficialReviews = pcConsoleData.officialReviewsByPaperNumber?.flatMap(
    //   (p) => p.officialReviews
    // )
    const allOfficialReviews = [
      ...(pcConsoleData.officialReviewsByPaperNumberMap?.values() ?? []),
    ]?.flatMap((p) => p.officialReviews)

    const assignedReviewsCount = pcConsoleData.paperGroups?.reviewerGroups?.reduce(
      (prev, curr) => {
        return prev + curr.members.length
      },
      0
    )

    // map tilde id in reviewerGroup to anon reviewer group id in anonReviewerGroups
    const reviewerAnonGroupIds = {}

    pcConsoleData.paperGroups?.reviewerGroups.forEach((reviewerGroup) => {
      reviewerGroup.members.forEach((reviewer) => {
        if (!reviewer.reviewerAnonGroup) return
        const reviewerProfileId = reviewer.reviewerProfileId
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
    // const reviewersCompletedAllReviews = Object.values(reviewerAnonGroupIds ?? {}).filter(
    //   (anonReviewerGroups) =>
    //     anonReviewerGroups?.every((anonReviewerGroup) => {
    //       const paperOfficialReviews = pcConsoleData.officialReviewsByPaperNumber?.find(
    //         (p) => p.noteNumber === anonReviewerGroup.noteNumber
    //       )?.officialReviews
    //       return paperOfficialReviews?.find(
    //         (p) => p.signatures[0] === anonReviewerGroup.anonGroupId
    //       )
    //     })
    // )

    // const reviewersComplete = reviewersCompletedAllReviews?.length
    const reviewersComplete = 0

    const reviewersWithAssignmentsCount = Object.values(reviewerAnonGroupIds ?? {}).length

    const paperWithMoreThanThresholddReviews = pcConsoleData.notes?.filter((note) => {
      // const paperOfficialReviews = pcConsoleData.officialReviewsByPaperNumber?.find(
      //   (p) => p.noteNumber === note.number
      // )
      const paperOfficialReviews = pcConsoleData.officialReviewsByPaperNumberMap.get(
        note.number
      )?.officialReviews
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
      paperWithMoreThanThresholddReviews,
    })
  }, [pcConsoleData])

  if (!showContent) return null
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
                reviewStats.paperWithMoreThanThresholddReviews?.length,
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
  const { areaChairsId } = useContext(WebFieldContext)
  // const metaReviewsCount = pcConsoleData.metaReviewsByPaperNumber?.filter(
  //   (p) => p.metaReviews?.length
  // )?.length
  const metaReviewsCount = [
    ...(pcConsoleData.metaReviewsByPaperNumberMap?.values() ?? []),
  ]?.filter((p) => p.metaReviews?.length)?.length

  // map tilde id in areaChairGroups to anon areachair group id in anonAreaChairGroups
  const areaChairAnonGroupIds = {}
  pcConsoleData.paperGroups?.areaChairGroups.forEach((areaChairGroup) => {
    areaChairGroup.members.forEach((areaChair) => {
      if (!areaChair.areaChairAnonGroup) return
      const areaChairProfileId = areaChair.areaChairProfileId
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
        const paperOfficialMetaReviews = pcConsoleData.metaReviewsByPaperNumber?.find(
          (p) => p.noteNumber === anonAreaChairGroup.noteNumber
        )?.metaReviews
        return paperOfficialMetaReviews?.find(
          (p) => p.signatures[0] === anonAreaChairGroup.anonGroupId
        )
      })
  )

  const areaChairsComplete = areaChairsCompletedAllMetaReviews?.length
  const areaChairsCount = pcConsoleData.areaChairs?.length

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
              renderStat(areaChairsComplete, areaChairsCount)
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

const DecisionStatsRow = ({ pcConsoleData }) => {
  const decisions = [...(pcConsoleData.decisionByPaperNumberMap?.values() ?? [])]
  const notesWithFinalDecision = decisions.filter((p) => p)
  const decisionsCount = notesWithFinalDecision?.length
  const submissionsCount = pcConsoleData.notes?.length

  const allDecisions = decisions.flatMap((p) => {
    return p?.content?.decision ?? []
  })

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
  pcConsoleData,
  bidEnabled,
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
    decisionName,
    scoresName,
  } = useContext(WebFieldContext)

  const { requestForm, registrationForms, invitations } = pcConsoleData
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs)`
  )
  const sacRoles = requestForm?.content?.['senior_area_chair_roles'] ?? ['Senior_Area_Chairs']
  const acRoles = requestForm?.content?.['area_chair_roles'] ?? ['Area_Chairs']
  const hasEthicsChairs =
    requestForm?.content?.['ethics_chairs_and_reviewers']?.includes('Yes')
  const reviewerRoles = requestForm?.content?.['reviewer_roles'] ?? ['Reviewers']

  const timelineInvitations = [
    { id: submissionId, displayName: 'Paper Submissions' },
    { id: `${reviewersId}/-/${bidName}`, displayName: 'Reviewers Bidding' },
    ...(seniorAreaChairsId
      ? [
          {
            id: `${seniorAreaChairsId}/-/${bidName}`,
            displayName: 'Senior Area Chairs Bidding',
          },
        ]
      : []),
    ...(areaChairsId
      ? [
          {
            id: `${areaChairsId}/-/${bidName}`,
            displayName: 'Area Chairs Bidding',
          },
        ]
      : []),
    { id: `${venueId}/-/${officialReviewName}`, displayName: 'Reviewing' },
    { id: `${venueId}/-/${commentName}`, displayName: 'Commenting' },
    { id: `${venueId}/-/${officialMetaReviewName}`, displayName: 'Meta Reviews' },
    { id: `${venueId}/-/${decisionName}`, displayName: 'Decisions' },
  ].flatMap((p) => {
    const invitation = invitations?.find((q) => q.id === p.id)
    if (!invitation) return []
    const dateFormatOption = {
      minute: 'numeric',
      second: undefined,
      timeZoneName: 'short',
      locale: 'en-GB',
    }
    const start = invitation.cdate ? formatDateTime(invitation.cdate, dateFormatOption) : null
    const end = invitation.duedate
      ? formatDateTime(invitation.duedate, dateFormatOption)
      : null
    const exp = invitation.expdate
      ? formatDateTime(invitation.expdate, dateFormatOption)
      : null
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
                {`Author And Reviewer Anonymity: ${requestForm.content['Author and Reviewer Anonymity']}`}
                <br />
                {requestForm.content['Open Reviewing Policy']}
                <br />
                {`Paper matching uses ${requestForm.content['Paper Matching'].join(', ')}`}
                {requestForm.content['Other Important Information'] && (
                  <>
                    <br />
                    {note.content['Other Important Information']}
                  </>
                )}
              </span>
              <br />
              <a href={`/forum?id=${requestForm.id}`}>
                <strong>Full Venue Configuration</strong>
              </a>
            </p>
          </div>
        )}
        <div className="col-md-8 col-xs-12">
          <h4>Timeline:</h4>
          {datedInvitations.map((invitation) => {
            return (
              <li className="overview-timeline" key={invitation.id}>
                <a href={`/invitation/edit?id=${invitation.id}&referrer=${referrerUrl}`}>
                  {invitation.displayName}
                </a>
                {invitation.periodString}
              </li>
            )
          })}
          {notDatedInvitations.map((invitation) => {
            return (
              <li className="overview-timeline" key={invitation.id}>
                <a href={`/invitation/edit?id=${invitation.id}&referrer=${referrerUrl}`}>
                  {invitation.displayName}
                </a>
                {invitation.periodString}
              </li>
            )
          })}
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
          {reviewerRoles.map((role) => {
            return (
              <li className="overview-timeline" key={role}>
                <a href={`/assignments?group=${venueId}/${role}&referrer=${referrerUrl}`}>
                  {`${prettyId(role)} Paper Assignment`}
                </a>{' '}
                open until Reviewing starts
              </li>
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
              sacRoles.map((role) => {
                return (
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
                )
              })}
            {areaChairsId &&
              acRoles.map((role) => {
                return (
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
                )
              })}
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
            {reviewerRoles.map((role) => {
              return (
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
              )
            })}
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
              {registrationForms.map((form) => {
                return (
                  <li key={form.id} className="overview-registration-link">
                    <Link href={`/forum?id=${form.id}`}>
                      <a>{form.content.title}</a>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {bidEnabled && (
          <div className="col-md-4 col-xs-6">
            <h4>Bids & Recommendations:</h4>
            <ul className="overview-list">
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
              {seniorAreaChairsId && (
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
              {areaChairsId && (
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

const OverviewTab = ({ pcConsoleData, showContent }) => {
  const { areaChairsId, seniorAreaChairsId, reviewersId, bidName, recommendationName } =
    useContext(WebFieldContext)
  const bidEnabled = pcConsoleData.invitations?.some((p) =>
    [
      `${seniorAreaChairsId}/-/${bidName}`,
      `${areaChairsId}/-/${bidName}`,
      `${reviewersId}/-/${bidName}`,
    ].includes(p.id)
  )
  const recommendationEnabled = pcConsoleData.invitations?.some(
    (p) => p.id === `${reviewersId}/-/${recommendationName}`
  )
  return (
    <>
      <RecruitmentStatsRow pcConsoleData={pcConsoleData} />
      <SubmissionsStatsRow pcConsoleData={pcConsoleData} />
      <BiddingStatsRow
        bidEnabled={bidEnabled}
        recommendationEnabled={recommendationEnabled}
        pcConsoleData={pcConsoleData}
      />
      <ReviewStatsRow pcConsoleData={pcConsoleData} showContent={showContent} />
      <MetaReviewStatsRow pcConsoleData={pcConsoleData} />
      <DecisionStatsRow pcConsoleData={pcConsoleData} />
      <DescriptionTimelineOtherConfigRow
        pcConsoleData={pcConsoleData}
        bidEnabled={bidEnabled}
        recommendationEnabled={recommendationEnabled}
      />
    </>
  )
}
// #endregion

// #region paperStatus tab
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

const PaperRow = ({ rowData, selectedNoteIds, setSelectedNoteIds }) => {
  const { areaChairsId, venueId, officialReviewName, shortPhrase, recommendationName } =
    useContext(WebFieldContext)
  const { note, metaReviewData } = rowData
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#paper-status)`
  )
  const noteWithAuthorRevealed = {
    ...note,
    content: {
      ...note.content,
      authors: note.details.original?.content?.authors ?? note.content.authors,
      authorids: note.details.original?.content?.authorids ?? note.content.authorids,
    },
  }
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
          note={noteWithAuthorRevealed}
          referrerUrl={referrerUrl}
          isV2Note={note.version === 2}
        />
      </td>
      <td>
        <AreaChairConsoleNoteReviewStatus
          rowData={rowData}
          venueId={venueId}
          officialReviewName={officialReviewName}
          referrerUrl={referrerUrl}
          shortPhrase={shortPhrase}
          submissionName="Paper"
        />
      </td>
      {areaChairsId && (
        <td>
          <ProgramChairConsolePaperAreaChairProgress
            metaReviewData={metaReviewData}
            referrerUrl={referrerUrl}
          />
        </td>
      )}
      <td className="console-decision">
        <h4 className="title">{note.details?.decision?.content?.decision ?? 'No Decision'}</h4>
      </td>
    </tr>
  )
}

const PaperStatusTab = ({ pcConsoleData, showContent }) => {
  const [paperStatusTabData, setPaperStatusTabData] = useState({})
  const [selectedNoteIds, setSelectedNoteIds] = useState([])
  const {
    areaChairsId,
    reviewRatingName,
    reviewConfidenceName,
    recommendationName,
    venueId,
    officialMetaReviewName,
    shortPhrase,
    enableQuerySearch,
    filterOperators,
    propertiesAllowed,
  } = useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.notes?.length ?? 0)
  const pageSize = 1

  useEffect(() => {
    // #region calculate reviewProgressData and metaReviewData
    const notes = pcConsoleData.notes
    if (!notes) return
    const tableRows = [...(pcConsoleData.noteNumberReviewMetaReviewMap.values() ?? [])]
    setPaperStatusTabData({
      tableRowsAll: tableRows,
      tableRows: [...tableRows], // could be filtered
      tableRowsDisplayed: tableRows, // could be filtered and paginated
      // reviewersInfo: result[1],
      // allProfiles,
      // sacProfile: sacProfile
      //   ? {
      //       id: sacProfile.id,
      //       email: sacProfile.content.preferredEmail ?? sacProfile.content.emails[0],
      //     }
      //   : null,
    })

    // const sacProfile = pcConsoleData.allProfiles?.find(
    //   (p) =>
    //     p.content.names.some((q) => q.username === result[2]) ||
    //     p.content.emails.includes(result[2])
    // )
    // #endregion
    setTotalCount(pcConsoleData.notes?.length ?? 0)
  }, [pcConsoleData.notes])

  useEffect(() => {
    setPaperStatusTabData((paperStatusTabData) => ({
      ...paperStatusTabData,
      tableRowsDisplayed: paperStatusTabData.tableRows?.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
  }, [pageNumber, pcConsoleData.notes, showContent, paperStatusTabData.tableRows])

  useEffect(() => {
    if (!paperStatusTabData.tableRows?.length) return
    setTotalCount(paperStatusTabData.tableRows.length)
    setPageNumber(1)
  }, [paperStatusTabData.tableRows])

  if (!showContent) return null
  if (!pcConsoleData.notes) return <LoadingSpinner />

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
          shortPhrase={shortPhrase}
          enableQuerySearch={enableQuerySearch}
          filterOperators={filterOperators}
          propertiesAllowed={propertiesAllowed}
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
        shortPhrase={shortPhrase}
        enableQuerySearch={enableQuerySearch}
        filterOperators={filterOperators}
        propertiesAllowed={propertiesAllowed}
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
          },
          { id: 'number', content: '#' },
          { id: 'summary', content: 'Paper Summary' },
          { id: 'reviewProgress', content: 'Review Progress', width: '30%' },
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

// #endregion

// #region acStatus tab
const CommitteeSummary = ({ rowData, bidEnabled, recommendationEnabled, invitations }) => {
  const { id, preferredName, preferredEmail } = rowData.areaChairProfile ?? {}
  const { sacProfile, seniorAreaChairId } = rowData.seniorAreaChair ?? {}
  const {
    seniorAreaChairsId,
    areaChairsId,
    reviewersId,
    bidName,
    scoresName,
    recommendationName,
  } = useContext(WebFieldContext)
  const completedBids = rowData.completedBids
  const completedRecs = rowData.completedRecommendations
  const edgeBrowserBidsUrl = buildEdgeBrowserUrl(
    `tail:${id}`,
    invitations,
    areaChairsId,
    bidName,
    scoresName
  )
  const edgeBrowserRecsUrl = buildEdgeBrowserUrl(
    `signatory:${id}`,
    invitations,
    reviewersId,
    recommendationName,
    scoresName
  )

  return (
    <>
      <div className="note">
        {preferredName ? (
          <>
            <h4>
              <a href={getProfileLink(id, rowData.areaChairProfileId)} target="_blank">
                {preferredName}
              </a>
            </h4>
            <p className="text-muted">({preferredEmail})</p>
          </>
        ) : (
          <h4>{rowData.areaChairProfileId}</h4>
        )}
        <p>
          {bidEnabled && (
            <>
              Completed Bids:{completedBids}
              {completedBids && (
                <a href={edgeBrowserBidsUrl} className="show-reviewer-bids" target="_blank">
                  view all
                </a>
              )}
            </>
          )}
          {recommendationEnabled && (
            <>
              Reviewers Recommended:{completedRecs}
              {completedBids && (
                <a href={edgeBrowserRecsUrl} className="show-reviewer-bids" target="_blank">
                  view all
                </a>
              )}
            </>
          )}
        </p>
      </div>
      {sacProfile && (
        <>
          <h4>Senior Area Chair: </h4>
          <div className="note">
            {sacProfile?.preferredName && (
              <>
                <h4>
                  <a href={getProfileLink(sacProfile?.id, seniorAreaChairId)} target="_blank">
                    {sacProfile.preferredName}
                  </a>
                </h4>
                <p className="text-muted">({sacProfile.preferredEmail})</p>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}

// modified based on notesAreaChairProgress.hbs
const NoteAreaChairProgress = ({ rowData }) => {
  const numCompletedReviews = rowData.numCompletedReviews
  const numPapers = rowData.notes.length
  return (
    <div className="reviewer-progress">
      <h4>
        {numCompletedReviews} of {numPapers} Papers Reviews Completed
      </h4>
      {rowData.notes.length !== 0 && <strong>Papers:</strong>}
      <div className="review-progress">
        {rowData.notes.map((p) => {
          return (
            <div key={p.noteNumber}>
              <div className="note-info">
                <strong className="note-number">{p.noteNumber}</strong>
                <a>{p.note?.content?.title}</a>
              </div>
              <div className="review-info">
                <strong>
                  {p.reviewProgressData?.numReviewsDone} of{' '}
                  {p.reviewProgressData?.numReviewersAssigned} Reviews Submitted{' '}
                </strong>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// modified based on notesAreaChairStatus.hbs
const NoteAreaChairStatus = ({ rowData, referrerUrl }) => {
  const numCompletedMetaReviews = rowData.numCompletedMetaReviews
  const numPapers = rowData.notes.length
  return (
    <div className="reviewer-progress">
      <h4>
        {numCompletedMetaReviews} of {numPapers} Papers Meta Review Completed
      </h4>
      {rowData.notes.length !== 0 && <strong>Papers:</strong>}
      <div className="review-progress">
        {rowData.notes.map((p) => {
          const venue = p.note?.content?.venue
          const metaReviews = p.metaReviewData?.metaReviews
          const hasMetaReview = metaReviews?.length
          return (
            <div key={p.noteNumber}>
              <div className="note-info">
                <strong className="note-number">{p.noteNumber}</strong>
                {hasMetaReview ? (
                  <>
                    <span>{`${venue ? `${venue} - ` : ''}${
                      p.note?.content?.recommendation ?? ''
                    }`}</span>
                    {metaReviews.map((metaReview) => {
                      return (
                        <div key={metaReview.id}>
                          {metaReview.content.format && (
                            <span>Format: {metaReview.content.format}</span>
                          )}
                          <a
                            href={`/forum?id=${metaReview.forum}&noteId=${metaReview.id}&referrer=${referrerUrl}`}
                            target="_blank"
                          >
                            Read Meta Review
                          </a>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <span>{`${venue ? `${venue} - ` : ''} No Meta Review`}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const AreaChairStatusRow = ({
  rowData,
  bidEnabled,
  recommendationEnabled,
  acBids,
  invitations,
  referrerUrl,
}) => {
  return (
    <tr>
      <td>
        <strong>{rowData.number}</strong>
      </td>
      <td>
        <CommitteeSummary
          rowData={rowData}
          bidEnabled={bidEnabled}
          recommendationEnabled={recommendationEnabled}
          acBids={acBids}
          invitations={invitations}
        />
      </td>
      <td>
        <NoteAreaChairProgress rowData={rowData} />
      </td>
      <td>
        <NoteAreaChairStatus rowData={rowData} referrerUrl={referrerUrl} />
      </td>
    </tr>
  )
}

const AreaChairStatusTab = ({ pcConsoleData, setPcConsoleData }) => {
  const [areaChairStatusTabData, setAreaChairStatusTabData] = useState({})
  const {
    shortPhrase,
    enableQuerySearch,
    filterOperators,
    propertiesAllowed,
    seniorAreaChairsId,
    areaChairsId,
    reviewersId,
    bidName,
    recommendationName,
    venueId,
  } = useContext(WebFieldContext)
  const { accessToken } = useUser()
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.areaChairs?.length ?? 0)
  const pageSize = 5
  const bidEnabled = pcConsoleData.invitations?.some((p) =>
    [
      `${seniorAreaChairsId}/-/${bidName}`,
      `${areaChairsId}/-/${bidName}`,
      `${reviewersId}/-/${bidName}`,
    ].includes(p.id)
  )
  const recommendationEnabled = pcConsoleData.invitations?.some(
    (p) => p.id === `${reviewersId}/-/${recommendationName}`
  )
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#reviewer-status)`
  )

  const loadACStatusTabData = async () => {
    // #region get sac edges to get sac of ac
    const sacEdgeResult = seniorAreaChairsId
      ? await api.getAll(
          '/edges',
          { invitation: `${seniorAreaChairsId}/-/Assignment` },
          { accessToken }
        )
      : []

    const sacByAcMap = new Map()
    const acBySacMap = new Map()
    sacEdgeResult.forEach((edge) => {
      const ac = edge.head
      const sac = edge.tail
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
      const emails = profile.content.emails.filter((p) => p)
      usernames.concat(emails).forEach((key) => {
        acSacProfileWithoutAssignmentMap.set(key, profile)
      })
    })

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

    // const areaChairWithAssignmentsMap = pcConsoleData.paperGroups.areaChairGroups.reduce(
    //   (prev, curr) => {
    //     curr.members.forEach((member) => {
    //       if (prev[member.areaChairProfileId]) {
    //         prev[member.areaChairProfileId].assignedPapers.push(
    //           pcConsoleData.notes.find((p) => p.number === curr.noteNumber)
    //         )
    //       } else {
    //         prev[member.areaChairProfileId] = {
    //           assignedPapers: [pcConsoleData.notes.find((p) => p.number === curr.noteNumber)],
    //         }
    //       }
    //     })
    //     return prev
    //   },
    //   {}
    // )
    // #endregion

    // #region get ac recommendation count
    const acRecommendations =
      recommendationName && areaChairsId
        ? await api.getAll(
            '/edges',
            {
              invitation: `${reviewersId}/-/${recommendationName}`,
              stream: true,
            },
            { accessToken }
          )
        : []
    const acRecommendationCount = acRecommendations.reduce((profileMap, edge) => {
      var acId = edge.signatures[0]
      if (!profileMap[acId]) {
        profileMap[acId] = 0
      }
      profileMap[acId] += 1
      return profileMap
    }, {})

    // #endregion

    // #region calc ac to notes map
    const acNotesMap = new Map()
    const allNoteNumbers = pcConsoleData.notes.map((p) => p.number)
    pcConsoleData.paperGroups.areaChairGroups.forEach((acGroup) => {
      const members = acGroup.members
      members.forEach((member) => {
        const noteNumber = acGroup.noteNumber
        if (!allNoteNumbers.includes(noteNumber)) return // paper could have been desk rejected
        const reviewMetaReviewInfo =
          pcConsoleData.noteNumberReviewMetaReviewMap.get(noteNumber) ?? {}
        if (acNotesMap.get(member.areaChairProfileId)) {
          acNotesMap
            .get(member.areaChairProfileId)
            .push({ noteNumber, ...reviewMetaReviewInfo })
        } else {
          acNotesMap.set(member.areaChairProfileId, [{ noteNumber, ...reviewMetaReviewInfo }])
        }
      })
    })
    // #endregion

    console.log('sacByAcMap', sacByAcMap)
    console.log('acBySacMap', acBySacMap)
    const tableRows = pcConsoleData.areaChairs.map((areaChairProfileId, index) => {
      let sacId = null
      let sacProfile = null
      if (seniorAreaChairsId) {
        sacId = sacByAcMap.get(areaChairProfileId)
        if (seniorAreaChairWithoutAssignmentIds.includes(sacId)) {
          sacProfile = acSacProfileWithoutAssignmentMap.get(sacId)
        } else {
          sacProfile = pcConsoleData.allProfilesMap.get(sacId)
        }
      }
      let acProfile = null
      if (areaChairWithoutAssignmentIds.includes(areaChairProfileId)) {
        acProfile = acSacProfileWithoutAssignmentMap.get(areaChairProfileId)
      } else {
        acProfile = pcConsoleData.allProfilesMap.get(areaChairProfileId)
      }
      const notes = acNotesMap.get(areaChairProfileId) ?? []
      return {
        areaChairProfileId: areaChairProfileId,
        areaChairProfile: acProfile,
        number: index + 1,
        completedRecommendations: acRecommendationCount[areaChairProfileId] ?? 0,
        completedBids:
          pcConsoleData.bidCount?.areaChairs?.find((p) => p.id?.tail === areaChairProfileId)
            ?.count ?? 0,
        numCompletedReviews: notes.filter(
          (p) => p.reviewers?.length === p.officialReviews?.length
        ).length,
        numCompletedMetaReviews:
          notes.filter(
            (p) =>
              p.metaReviewData?.numMetaReviewsDone === p.metaReviewData?.numAreaChairsAssigned
          ).length ?? 0,
        notes,
        ...(seniorAreaChairsId && {
          seniorAreaChair: {
            seniorAreaChairId: sacId,
            sacProfile,
          },
        }),
      }
    })
    setAreaChairStatusTabData({
      tableRowsAll: tableRows,
      tableRows: [...tableRows],
    })
  }

  useEffect(() => {
    if (!pcConsoleData.paperGroups?.areaChairGroups) return
    loadACStatusTabData()
  }, [pcConsoleData.paperGroups?.areaChairGroups])

  useEffect(() => {
    setAreaChairStatusTabData((areaChairStatusTabData) => ({
      ...areaChairStatusTabData,
      tableRowsDisplayed: areaChairStatusTabData.tableRows?.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    setTotalCount(areaChairStatusTabData.tableRows?.length ?? 0)
  }, [
    pageNumber,
    pcConsoleData.paperGroups?.areaChairGroups,
    areaChairStatusTabData.tableRows,
  ])

  if (!pcConsoleData.notes) return <LoadingSpinner />

  if (areaChairStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        There are no area chairs.Check back later or contact info@openreview.net if you believe
        this to be an error.
      </p>
    )
  if (areaChairStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <AreaChairStatusMenuBar
          tableRowsAll={areaChairStatusTabData.tableRowsAll}
          tableRows={areaChairStatusTabData.tableRows}
          setAreaChairStatusTabData={setAreaChairStatusTabData}
          shortPhrase={shortPhrase}
          enableQuerySearch={enableQuerySearch}
          filterOperators={filterOperators}
          propertiesAllowed={propertiesAllowed}
          bidEnabled={bidEnabled}
          recommendationEnabled={recommendationEnabled}
          messageParentGroup={areaChairsId}
        />
        <p className="empty-message">No area chair matching search criteria.</p>
      </div>
    )
  return (
    <div className="table-container">
      <AreaChairStatusMenuBar
        tableRowsAll={areaChairStatusTabData.tableRowsAll}
        tableRows={areaChairStatusTabData.tableRows}
        setAreaChairStatusTabData={setAreaChairStatusTabData}
        shortPhrase={shortPhrase}
        enableQuerySearch={enableQuerySearch}
        filterOperators={filterOperators}
        propertiesAllowed={propertiesAllowed}
        bidEnabled={bidEnabled}
        recommendationEnabled={recommendationEnabled}
        messageParentGroup={areaChairsId}
      />
      <Table
        className="console-table table-striped pc-console-ac-status"
        headings={[
          { id: 'number', content: '#' },
          { id: 'areachair', content: 'Area Chair' },
          { id: 'reviewProgress', content: 'Review Progress' },
          { id: 'status', content: 'Status' },
        ]}
      >
        {areaChairStatusTabData.tableRowsDisplayed?.map((row) => (
          <AreaChairStatusRow
            key={row.areaChairProfileId}
            rowData={row}
            bidEnabled={bidEnabled}
            recommendationEnabled={recommendationEnabled}
            invitations={pcConsoleData.invitations}
            referrerUrl={referrerUrl}
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
// #endregion

// #region sacStatus tab
const BasicProfileSummary = ({ profile, profileId }) => {
  const { id, preferredName, preferredEmail } = profile ?? {}
  return (
    <div className="note">
      {preferredName ? (
        <>
          <h4>
            <a href={getProfileLink(id, profileId)} target="_blank">
              {preferredName}
            </a>
          </h4>
          <p className="text-muted">({preferredEmail})</p>
        </>
      ) : (
        <h4>{profileId}</h4>
      )}
    </div>
  )
}
const SeniorAreaChairStatusRow = ({ rowData }) => {
  return (
    <tr>
      <td>
        <strong className="note-number">{rowData.number}</strong>
      </td>
      <td>
        <BasicProfileSummary
          profile={rowData.sacProfile ?? {}}
          profileId={rowData.sacProfileId}
        />
      </td>
      <td>
        {rowData.acs.map((ac) => (
          <BasicProfileSummary key={ac.id} profile={ac.profile ?? {}} profileId={ac.id} />
        ))}
      </td>
    </tr>
  )
}

const SeniorAreaChairStatusTab = ({ pcConsoleData, setPcConsoleData }) => {
  const [seniorAreaChairStatusTabData, setSeniorAreaChairStatusTabData] = useState({})
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.areaChairs?.length ?? 0)
  const { seniorAreaChairsId } = useContext(WebFieldContext)
  const { accessToken } = useUser()
  const pageSize = 5

  const loadSacStatusTabData = async () => {
    if (!pcConsoleData.sacAcInfo) {
      // #region get sac edges to get sac of ac
      const sacEdgeResult = seniorAreaChairsId
        ? await api.getAll(
            '/edges',
            { invitation: `${seniorAreaChairsId}/-/Assignment` },
            { accessToken }
          )
        : []

      const sacByAcMap = new Map()
      const acBySacMap = new Map()
      sacEdgeResult.forEach((edge) => {
        const ac = edge.head
        const sac = edge.tail
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
        const emails = profile.content.emails.filter((p) => p)
        usernames.concat(emails).forEach((key) => {
          acSacProfileWithoutAssignmentMap.set(key, profile)
        })
      })

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

      const tableRows = pcConsoleData.seniorAreaChairs.map((sacProfileId, index) => {
        const acs =
          acBySacMap.get(sacProfileId)?.map((acProfileId) => {
            const acProfile = areaChairWithoutAssignmentIds.includes(acProfileId)
              ? acSacProfileWithoutAssignmentMap.get(acProfileId)
              : pcConsoleData.allProfilesMap.get(acProfileId)
            return {
              id: acProfileId,
              profile: acProfile,
            }
          }) ?? []
        const sacProfile = seniorAreaChairWithoutAssignmentIds.includes(sacProfileId)
          ? acSacProfileWithoutAssignmentMap.get(sacProfileId)
          : pcConsoleData.allProfilesMap.get(sacProfileId)
        return {
          number: index + 1,
          sacProfileId,
          sacProfile,
          acs,
        }
      })

      setSeniorAreaChairStatusTabData({
        tableRowsAll: tableRows,
        tableRows: [...tableRows],
      })
    } else {
      const tableRows = pcConsoleData.seniorAreaChairs.map((sacProfileId, index) => {
        const acs =
          pcConsoleData.sacAcInfo.acBySacMap.get(sacProfileId)?.map((acProfileId) => {
            const acProfile = pcConsoleData.sacAcInfo.areaChairWithoutAssignmentIds.includes(
              acProfileId
            )
              ? pcConsoleData.sacAcInfo.acSacProfileWithoutAssignmentMap.get(acProfileId)
              : pcConsoleData.allProfilesMap.get(acProfileId)
            return {
              id: acProfileId,
              profile: acProfile,
            }
          }) ?? []
        const sacProfile =
          pcConsoleData.sacAcInfo.seniorAreaChairWithoutAssignmentIds.includes(sacProfileId)
            ? pcConsoleData.sacAcInfo.acSacProfileWithoutAssignmentMap.get(sacProfileId)
            : pcConsoleData.allProfilesMap.get(sacProfileId)
        return {
          number: index + 1,
          sacProfileId,
          sacProfile,
          acs,
        }
      })

      setSeniorAreaChairStatusTabData({
        tableRowsAll: tableRows,
        tableRows: [...tableRows],
      })
    }
  }

  useEffect(() => {
    if (!pcConsoleData?.paperGroups?.seniorAreaChairGroups) return
    loadSacStatusTabData()
  }, [pcConsoleData?.paperGroups?.seniorAreaChairGroups])

  useEffect(() => {
    setSeniorAreaChairStatusTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    setTotalCount(seniorAreaChairStatusTabData.tableRows?.length ?? 0)
  }, [
    pageNumber,
    pcConsoleData.paperGroups?.areaChairGroups,
    seniorAreaChairStatusTabData.tableRows,
  ])

  if (!pcConsoleData.sacAcInfo) return <LoadingSpinner />

  if (seniorAreaChairStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        There are no senior area chairs.Check back later or contact info@openreview.net if you
        believe this to be an error.
      </p>
    )
  if (seniorAreaChairStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <SeniorAreaChairStatusMenuBar
          tableRowsAll={seniorAreaChairStatusTabData.tableRowsAll}
          tableRows={seniorAreaChairStatusTabData.tableRows}
          setSeniorAreaChairStatusTabData={setSeniorAreaChairStatusTabData}
        />
        <p className="empty-message">No senior area chair matching search criteria.</p>
      </div>
    )
  return (
    <div className="table-container">
      <SeniorAreaChairStatusMenuBar
        tableRowsAll={seniorAreaChairStatusTabData.tableRowsAll}
        tableRows={seniorAreaChairStatusTabData.tableRows}
        setSeniorAreaChairStatusTabData={setSeniorAreaChairStatusTabData}
      />
      <Table
        className="console-table table-striped pc-console-ac-status"
        headings={[
          { id: 'number', content: '#' },
          { id: 'seniorAreaChair', content: 'Senior Area Chair' },
          { id: 'areachair', content: 'Area Chair' },
        ]}
      >
        {seniorAreaChairStatusTabData.tableRowsDisplayed?.map((row) => (
          <SeniorAreaChairStatusRow key={row.sacProfileId} rowData={row} />
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
// #endregion

const ProgramChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    apiVersion,
    areaChairsId,
    seniorAreaChairsId,
    reviewersId,
    programChairsId,
    authorsId,
    paperReviewsCompleteThreshold,
    bidName,
    recommendationName,
    requestFormId,
    submissionId,
    withdrawnSubmissionId,
    deskRejectedSubmissionId,
    officialReviewName,
    commentName,
    officialMetaReviewName,
    decisionName,
    anonReviewerName,
    anonAreaChairName,
    scoresName,
    shortPhrase,
    enableQuerySearch,
    reviewRatingName,
    reviewConfidenceName,
  } = useContext(WebFieldContext)
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
          ...(apiVersion === 2 && { prefix: `${venueId}/-/.*` }),
          ...(apiVersion !== 2 && { regex: `${venueId}/-/.*` }),
          expired: true,
          type: 'all',
        },
        { accessToken, version: apiVersion }
      )
      const reviewerInvitationsP = api.getAll(
        '/invitations',
        {
          ...(apiVersion === 2 && { prefix: `${reviewersId}/-/.*` }),
          ...(apiVersion !== 2 && { regex: `${reviewersId}/-/.*` }),
          expired: true,
          type: 'all',
        },
        { accessToken, version: apiVersion }
      )
      const acInvitationsP = areaChairsId
        ? api.getAll(
            '/invitations',
            {
              ...(apiVersion === 2 && { prefix: `${areaChairsId}/-/.*` }),
              ...(apiVersion !== 2 && { regex: `${areaChairsId}/-/.*` }),
              expired: true,
              type: 'all',
            },
            { accessToken, version: apiVersion }
          )
        : Promise.resolve([])
      const sacInvitationsP = seniorAreaChairsId
        ? api.getAll(
            '/invitations',
            {
              ...(apiVersion === 2 && { prefix: `${seniorAreaChairsId}/-/.*` }),
              ...(apiVersion !== 2 && { regex: `${seniorAreaChairsId}/-/.*` }),
              expired: true,
              type: 'all',
            },
            { accessToken, version: apiVersion }
          )
        : Promise.resolve([])
      const invitationResults = await Promise.all([
        conferenceInvitationsP,
        reviewerInvitationsP,
        acInvitationsP,
        sacInvitationsP,
      ])

      // #endregion

      // #region getRequestForm
      let requestForm = null
      if (requestFormId) {
        const getRequestFormResult = await api.get(
          '/notes',
          {
            id: requestFormId,
            limit: 1,
            select: 'id,content',
          },
          { accessToken }
        )
        requestForm = getRequestFormResult.notes?.[0]
      }
      // #endregion

      // #region getRegistrationForms
      const prefixes = [reviewersId, areaChairsId, seniorAreaChairsId]
      const getRegistrationFormPs = prefixes.map((prefix) => {
        return api
          .getAll(
            '/notes',
            {
              invitation: `${prefix}/-/.*`,
              signature: venueId,
              select: 'id,invitation,content.title',
            },
            { accessToken }
          )
          .then((notes) => {
            return notes.filter((note) => note.invitation.endsWith('Form'))
          })
      })
      const getRegistrationFormResults = await Promise.all(getRegistrationFormPs)
      const registrationForms = getRegistrationFormResults.flat()
      // #endregion

      // #region get Reviewer,AC,SAC Members
      const committeeMemberResults = await Promise.all(
        [reviewersId, areaChairsId, seniorAreaChairsId].map((id) => {
          return id
            ? api.getGroupById(id, accessToken, { select: 'members' })
            : Promise.resolve([])
        })
      )
      // #endregion

      // #region getSubmissions
      const notes = await api.getAll('/notes', {
        invitation: submissionId,
        details: 'invitation,tags,original,replyCount,directReplies',
        select: 'id,number,forum,content,details',
        sort: 'number:asc',
      })
      // #endregion

      // #region get withdrawn and rejected submissions
      const withdrawnRejectedSubmissionResults = await Promise.all(
        [withdrawnSubmissionId, deskRejectedSubmissionId].map((id) => {
          return id
            ? api.getAll(
                '/notes',
                {
                  invitation: id,
                  details: 'original',
                },
                { accessToken }
              )
            : Promise.resolve([])
        })
      )
      // #endregion

      // #region get Reviewer,AC,SAC bid
      const bidCountResults = await Promise.all(
        [reviewersId, areaChairsId, seniorAreaChairsId].map((id) => {
          if (!id || !bidName) return Promise.resolve({})
          return api.getAll(
            '/edges',
            {
              invitation: `${id}/-/${bidName}`,
              groupBy: 'tail',
              select: 'count',
            },
            { accessToken, resultsKey: 'groupedEdges' }
          )
        })
      )
      // #endregion

      // #region getGroups (per paper groups)
      const perPaperGroupResults = await api.get(
        '/groups',
        {
          id: `${venueId}/Paper.*`,
          stream: true,
          select: 'id,members',
        },
        { accessToken }
      )
      const reviewerGroups = []
      const anonReviewerGroups = {}
      const areaChairGroups = []
      const anonAreaChairGroups = {}
      const seniorAreaChairGroups = []
      let allGroupMembers = []
      perPaperGroupResults.groups?.forEach((group) => {
        if (group.id.endsWith('/Reviewers')) {
          reviewerGroups.push({
            noteNumber: getNumberFromGroup(group.id, 'Paper'),
            ...group,
          })
          allGroupMembers = allGroupMembers.concat(group.members)
        } else if (group.id.includes(anonReviewerName)) {
          const number = getNumberFromGroup(group.id, 'Paper')
          if (!(number in anonReviewerGroups)) anonReviewerGroups[number] = {}
          if (group.members.length) anonReviewerGroups[number][group.members[0]] = group.id
        } else if (group.id.endsWith('/Area_Chairs')) {
          areaChairGroups.push({
            noteNumber: getNumberFromGroup(group.id, 'Paper'),
            ...group,
          })
          allGroupMembers = allGroupMembers.concat(group.members)
        } else if (group.id.includes(anonAreaChairName)) {
          const number = getNumberFromGroup(group.id, 'Paper')
          if (!(number in anonAreaChairGroups)) anonAreaChairGroups[number] = {}
          if (group.members.length) anonAreaChairGroups[number][group.members[0]] = group.id
        } else if (group.id.endsWith('Senior_Area_Chairs')) {
          seniorAreaChairGroups.push(group)
          allGroupMembers = allGroupMembers.concat(group.members)
        }
      })
      // #endregion

      // #region get all profiles
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
        // p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
        //       p.content.emails.includes(reviewer.reviewerProfileId)
        const usernames = profile.content.names.flatMap((p) => p.username ?? [])
        const emails = profile.content.emails.filter((p) => p)
        usernames.concat(emails).forEach((key) => {
          allProfilesMap.set(key, profile)
        })
      })

      const officialReviewsByPaperNumberMap = new Map()
      const metaReviewsByPaperNumberMap = new Map()
      const decisionByPaperNumberMap = new Map()
      notes.forEach((note) => {
        const directReplies = note.details.directReplies
        const officialReviews = directReplies
          .filter(
            (p) => p.invitation === `${venueId}/Paper${note.number}/-/${officialReviewName}`
          )
          ?.map((review) => ({
            ...review,
            anonId: getIndentifierFromGroup(review.signatures[0], 'Reviewer_'),
          }))
        const metaReviews = directReplies
          .filter(
            (p) =>
              p.invitation === `${venueId}/Paper${note.number}/-/${officialMetaReviewName}`
          )
          ?.map((metaReview) => ({
            ...metaReview,
            anonId: getIndentifierFromGroup(metaReview.signatures[0], 'Area_Chair_'),
          }))
        const decision = directReplies.find(
          (p) => p.invitation === `${venueId}/Paper${note.number}/-/${decisionName}`
        )
        officialReviewsByPaperNumberMap.set(note.number, officialReviews)
        metaReviewsByPaperNumberMap.set(note.number, metaReviews)
        decisionByPaperNumberMap.set(note.number, decision)
      })

      const pcConsoleDataNoReview = {
        invitations: invitationResults.flat(),
        allProfiles,
        allProfilesMap,
        requestForm,
        registrationForms,
        reviewers: committeeMemberResults[0]?.members ?? [],
        areaChairs: committeeMemberResults[1]?.members ?? [],
        seniorAreaChairs: committeeMemberResults[2]?.members ?? [],
        notes,
        officialReviewsByPaperNumberMap,
        metaReviewsByPaperNumberMap,
        decisionByPaperNumberMap,
        // officialReviewsByPaperNumber: notes.map((note) => {
        //   return {
        //     noteNumber: note.number,
        //     officialReviews: note.details.directReplies
        //       .filter(
        //         (p) =>
        //           p.invitation === `${venueId}/Paper${note.number}/-/${officialReviewName}`
        //       )
        //       ?.map((review) => ({
        //         ...review,
        //         anonId: getNumberFromGroup(review.signatures[0], 'Reviewer_', false),
        //       })),
        //   }
        // }),
        // metaReviewsByPaperNumber: notes.map((note) => {
        //   return {
        //     noteNumber: note.number,
        //     metaReviews: note.details.directReplies
        //       .filter(
        //         (p) =>
        //           p.invitation === `${venueId}/Paper${note.number}/-/${officialMetaReviewName}`
        //       )
        //       ?.map((metaReview) => ({
        //         ...metaReview,
        //         anonId: getNumberFromGroup(metaReview.signatures[0], 'Area_Chair_', false),
        //       })),
        //   }
        // }),
        // decisionByPaperNumber: notes.map((note) => {
        //   return {
        //     noteNumber: note.number,
        //     decision: note.details.directReplies.find(
        //       (p) => p.invitation === `${venueId}/Paper${note.number}/-/${decisionName}`
        //     ),
        //   }
        // }),
        withdrawnNotes: withdrawnRejectedSubmissionResults[0],
        deskRejectedNotes: withdrawnRejectedSubmissionResults[1],
        bidCounts: {
          reviewers: bidCountResults[0],
          areaChairs: bidCountResults[1],
          seniorAreaChairs: bidCountResults[2],
        },
        paperGroups: {
          anonReviewerGroups,
          reviewerGroups: reviewerGroups.map((reviewerGroup) => {
            const paperAnonReviewerGroups = anonReviewerGroups[reviewerGroup.noteNumber]
            return {
              ...reviewerGroup,
              members: reviewerGroup.members.map((member) => {
                const reviewerAnonGroup = paperAnonReviewerGroups[member]
                return {
                  reviewerProfileId: member,
                  reviewerAnonGroup,
                  anonymousId: reviewerAnonGroup
                    ? getIndentifierFromGroup(reviewerAnonGroup, 'Reviewer_')
                    : null,
                }
              }),
            }
          }),
          anonAreaChairGroups,
          areaChairGroups: areaChairGroups.map((areaChairGroup) => {
            const paperAnonAreaChairGroups = anonAreaChairGroups[areaChairGroup.noteNumber]
            return {
              ...areaChairGroup,
              members: areaChairGroup.members.map((member) => {
                const areaChairAnonGroup = paperAnonAreaChairGroups[member]
                return {
                  areaChairProfileId: member,
                  areaChairAnonGroup,
                  anonymousId: areaChairAnonGroup
                    ? getIndentifierFromGroup(areaChairAnonGroup, 'Area_Chair_')
                    : null,
                }
              }),
            }
          }),
          seniorAreaChairGroups,
        },
      }
      setPcConsoleData({
        ...pcConsoleDataNoReview,
        noteNumberReviewMetaReviewMap:
          calculateNotesReviewMetaReviewData(pcConsoleDataNoReview),
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
    setIsLoadingData(false)
  }

  const calculateNotesReviewMetaReviewData = (pcConsoleDataNoReview) => {
    if (!pcConsoleDataNoReview) return new Map()
    const noteNumberReviewMetaReviewMap = new Map()
    pcConsoleDataNoReview.notes.forEach((note) => {
      const assignedReviewers =
        pcConsoleDataNoReview.paperGroups.reviewerGroups?.find(
          (group) => group.noteNumber === note.number
        )?.members ?? []

      const assignedReviewerProfiles = assignedReviewers.map((reviewer) => {
        return {
          id: reviewer.reviewerProfileId,
          profile: pcConsoleDataNoReview.allProfilesMap.get(reviewer.reviewerProfileId),
        }
      })

      const assignedAreaChairs =
        pcConsoleDataNoReview.paperGroups.areaChairGroups?.find(
          (group) => group.noteNumber === note.number
        )?.members ?? []

      const assignedAreaChairProfiles = assignedAreaChairs.map((areaChair) => {
        return {
          id: areaChair.areaChairProfileId,
          profile: pcConsoleDataNoReview.allProfilesMap.get(areaChair.areaChairProfileId),
        }
      })

      const officialReviews =
        pcConsoleDataNoReview.officialReviewsByPaperNumberMap?.get(note.number)?.map((q) => {
          const isV2Note = q.version === 2
          const reviewRatingValue = isV2Note
            ? q.content[reviewRatingName]?.value
            : q.content[reviewRatingName]
          const ratingNumber = reviewRatingValue
            ? reviewRatingValue.substring(0, reviewRatingValue.indexOf(':'))
            : null
          const confidenceValue = isV2Note
            ? q.content[reviewConfidenceName]?.value
            : q.content[reviewConfidenceName]

          const confidenceMatch = confidenceValue && confidenceValue.match(/^(\d+): .*/)
          const reviewValue = isV2Note ? q.content.review?.value : q.content.review
          return {
            anonymousId: q.anonId,
            confidence: confidenceMatch ? parseInt(confidenceMatch[1], 10) : null,
            rating: ratingNumber ? parseInt(ratingNumber, 10) : null,
            reviewLength: reviewValue?.length,
            id: q.id,
          }
        }) ?? []
      const ratings = officialReviews.map((p) => p.rating)
      const validRatings = ratings.filter((p) => p !== null)
      const ratingAvg = validRatings.length
        ? (validRatings.reduce((sum, curr) => sum + curr, 0) / validRatings.length).toFixed(2)
        : 'N/A'
      const ratingMin = validRatings.length ? Math.min(...validRatings) : 'N/A'
      const ratingMax = validRatings.length ? Math.max(...validRatings) : 'N/A'

      const confidences = officialReviews.map((p) => p.confidence)
      const validConfidences = confidences.filter((p) => p !== null)
      const confidenceAvg = validConfidences.length
        ? (
            validConfidences.reduce((sum, curr) => sum + curr, 0) / validConfidences.length
          ).toFixed(2)
        : 'N/A'
      const confidenceMin = validConfidences.length ? Math.min(...validConfidences) : 'N/A'
      const confidenceMax = validConfidences.length ? Math.max(...validConfidences) : 'N/A'

      const metaReviews =
        pcConsoleDataNoReview.metaReviewsByPaperNumberMap?.get(note.number) ?? []

      noteNumberReviewMetaReviewMap.set(note.number, {
        note,
        reviewers: assignedReviewers?.map((reviewer) => {
          const profile = assignedReviewerProfiles.find(
            (p) => p.id === reviewer.reviewerProfileId
          )?.profile
          return {
            ...reviewer,
            type: 'reviewer',
            profile,
            hasReview: officialReviews.some((p) => p.anonymousId === reviewer.anonymousId),
            noteNumber: note.number,
            preferredName: profile ? getProfileName(profile) : reviewer.reviewerProfileId,
            preferredEmail: profile
              ? profile.content.preferredEmail ?? profile.content.emails[0]
              : reviewer.reviewerProfileId,
          }
        }),
        reviewerProfiles: assignedReviewerProfiles,
        officialReviews,
        reviewProgressData: {
          reviewers: assignedReviewerProfiles,
          numReviewersAssigned: assignedReviewers.length,
          numReviewsDone: officialReviews.length,
          ratingAvg,
          ratingMax,
          ratingMin,
          confidenceAvg,
          confidenceMax,
          confidenceMin,
          replyCount: note.details.replyCount,
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
          numMetaReviewsDone: metaReviews.length,
          metaReviews: metaReviews.map((metaReview) => {
            return {
              [recommendationName]:
                metaReview?.version === 2
                  ? metaReview?.content[recommendationName]?.value
                  : metaReview?.content[recommendationName],
              ...metaReview,
            }
          }),
        },
      })
    })

    return noteNumberReviewMetaReviewMap
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
    if (!userLoading && (!user || !user.profile || user.profile.id === 'guest')) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )}`
      )
    }
  }, [user, userLoading])

  useEffect(() => {
    if (userLoading || !user || !group || !venueId) return
    loadData()
  }, [user, userLoading, group])

  useEffect(() => {
    if (!activeTabId) return
    location.replace(activeTabId)
  }, [activeTabId])

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
          <Tab
            id="reviewer-status"
            active={activeTabId === '#reviewer-status' ? true : undefined}
            onClick={() => setActiveTabId('#reviewer-status')}
          >
            Reviewer Status
          </Tab>
          <Tab
            id="deskrejectwithdrawn-status"
            active={activeTabId === '#deskrejectwithdrawn-status' ? true : undefined}
            onClick={() => setActiveTabId('#deskrejectwithdrawn-status')}
          >
            Desk Rejected/Withdrawn Papers
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="venue-configuration">
            {/* {activeTabId === '#venue-configuration' && (
              <OverviewTab pcConsoleData={pcConsoleData} />
            )} */}
            <OverviewTab
              pcConsoleData={pcConsoleData}
              showContent={activeTabId === '#venue-configuration'}
            />
          </TabPanel>
          <TabPanel id="paper-status">
            {/* {activeTabId === '#paper-status' && (
              <PaperStatusTab pcConsoleData={pcConsoleData} loadData={loadData} />
            )} */}
            <PaperStatusTab
              pcConsoleData={pcConsoleData}
              showContent={activeTabId === '#paper-status'}
            />
          </TabPanel>
          {areaChairsId && activeTabId === '#areachair-status' && (
            <TabPanel id="areachair-status">
              <AreaChairStatusTab
                pcConsoleData={pcConsoleData}
                setPcConsoleData={setPcConsoleData}
              />
            </TabPanel>
          )}
          {seniorAreaChairsId && activeTabId === '#seniorareachair-status' && (
            <TabPanel id="seniorareachair-status">
              <SeniorAreaChairStatusTab
                pcConsoleData={pcConsoleData}
                setPcConsoleData={setPcConsoleData}
              />
            </TabPanel>
          )}
          <TabPanel id="reviewer-status">
            {activeTabId === '#reviewer-status' && <>5</>}
          </TabPanel>
          <TabPanel id="deskrejectwithdrawn-status">
            {activeTabId === '#deskrejectwithdrawn-status' && <>6</>}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default ProgramChairConsole
