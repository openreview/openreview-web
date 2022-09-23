import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import { useRouter } from 'next/router'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import Table from '../Table'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import WebFieldContext from '../WebFieldContext'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import BasicHeader from './BasicHeader'
import { formatDateTime, getNumberFromGroup, inflect, prettyId } from '../../lib/utils'
import Link from 'next/link'
import LoadingSpinner from '../LoadingSpinner'
import { debounce, orderBy, uniqBy } from 'lodash'
import Icon from '../Icon'
import Dropdown from '../Dropdown'
import ExportCSV from '../ExportCSV'
import NoteSummary from './NoteSummary'
import PaginationLinks from '../PaginationLinks'
import { AreaChairConsoleNoteReviewStatus } from './NoteReviewStatus'
import { ProgramChairConsolePaperAreaChairProgress } from './NoteMetaReviewStatus'
import BasicModal from '../BasicModal'
import { filterCollections } from '../../lib/webfield-utils'

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

  const buildEdgeBrowserUrl = (invGroup, invName) => {
    const invitationId = `${invGroup}/-/${invName}`
    const referrerUrl = `/group${location.search}${location.hash}`
    const conflictInvitationId = invitations.find((p) => p.id === `${invGroup}/-/Conflict`)?.id
    const scoresInvitationId = invitations.find(
      (p) => p.id === `${invGroup}/-/${scoresName}`
    )?.id

    // Right now this is only showing bids, affinity scores, and conflicts as the
    // other scores invitations + labels are not available in the PC console
    return `/edges/browse?traverse=${invitationId}&browse=${invitationId}${
      scoresInvitationId ? `;${scoresInvitationId}` : ''
    }${conflictInvitationId ? `;${conflictInvitationId}` : ''}&referrer=${encodeURIComponent(
      `[PC Console](${referrerUrl})`
    )}`
  }

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
                <Link href={buildEdgeBrowserUrl(reviewersId, bidName)}>
                  <a>Reviewer Bids</a>
                </Link>
              </li>
              {seniorAreaChairsId && (
                <li>
                  <Link href={buildEdgeBrowserUrl(seniorAreaChairsId, bidName)}>
                    <a>Senior Area Chair Bids</a>
                  </Link>
                </li>
              )}
              {areaChairsId && (
                <>
                  <li>
                    <Link href={buildEdgeBrowserUrl(areaChairsId, bidName)}>
                      <a>Area Chair Bid</a>
                    </Link>
                  </li>
                  {recommendationEnabled && (
                    <li>
                      <Link href={buildEdgeBrowserUrl(reviewersId, recommendationName)}>
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

const MessageReviewersModal = ({ tableRowsDisplayed, messageOption, selectedNoteIds }) => {
  const { accessToken } = useUser()
  const { shortPhrase, venueId, officialReviewName, submissionName } =
    useContext(WebFieldContext)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] = useState(null)
  const primaryButtonText = currentStep === 1 ? 'Next' : 'Confirm & Send Messages'
  const [recipientsInfo, setRecipientsInfo] = useState([])
  const totalMessagesCount = uniqBy(recipientsInfo, (p) => p.reviewerProfileId).reduce(
    (prev, curr) => prev + curr.count,
    0
  )

  const handlePrimaryButtonClick = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }
    // send emails
    try {
      const sendEmailPs = selectedNoteIds.map((noteId) => {
        const { note } = tableRowsDisplayed.find((row) => row.note.id === noteId)
        const reviewerIds = recipientsInfo
          .filter((p) => p.noteNumber == note.number) // eslint-disable-line eqeqeq
          .map((q) => q.reviewerProfileId)
        if (!reviewerIds.length) return Promise.resolve()
        const forumUrl = `https://openreview.net/forum?id=${note.forum}&noteId=${noteId}&invitationId=${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
        return api.post(
          '/messages',
          {
            groups: reviewerIds,
            subject,
            message: message.replaceAll('{{submit_review_link}}', forumUrl),
          },
          { accessToken }
        )
      })
      await Promise.all(sendEmailPs)
      $('#message-reviewers').modal('hide')
      promptMessage(`Successfully sent ${totalMessagesCount} emails`)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  const getRecipients = (selecteNoteIds) => {
    if (!selecteNoteIds.length) return []
    const selectedRows = tableRowsDisplayed.filter((row) =>
      selecteNoteIds.includes(row.note.id)
    )

    switch (messageOption.value) {
      case 'allReviewers':
        return selectedRows.flatMap((row) => row.reviewers)
      case 'withReviews':
        return selectedRows
          .flatMap((row) => row.reviewers)
          .filter((reviewer) => reviewer.hasReview)
      case 'missingReviews':
        return selectedRows
          .flatMap((row) => row.reviewers)
          .filter((reviewer) => !reviewer.hasReview)
      default:
        return []
    }
  }

  useEffect(() => {
    if (!messageOption) return
    setMessage(`${
      messageOption.value === 'missingReviews'
        ? `This is a reminder to please submit your review for ${shortPhrase}.\n\n`
        : ''
    }Click on the link below to go to the review page:\n\n{{submit_review_link}}
    \n\nThank you,\n${shortPhrase} Area Chair`)
    const recipients = getRecipients(selectedNoteIds)
    const recipientsWithCount = recipients.map((recipient) => {
      const count = recipients.filter(
        (p) => p.reviewerProfileId === recipient.reviewerProfileId
      ).length
      return {
        ...recipient,
        count,
      }
    })
    setRecipientsInfo(recipientsWithCount)
  }, [messageOption, selectedNoteIds])

  return (
    <BasicModal
      id="message-reviewers"
      title={messageOption?.label}
      primaryButtonText={primaryButtonText}
      onPrimaryButtonClick={handlePrimaryButtonClick}
      primaryButtonDisabled={!totalMessagesCount}
      onClose={() => {
        setCurrentStep(1)
      }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {currentStep === 1 ? (
        <>
          <p>
            {`You may customize the message that will be sent to the reviewers. In the email
            body, the text {{ submit_review_link }} will be replaced with a hyperlink to the
            form where the reviewer can fill out his or her review.`}
          </p>
          <div className="form-group">
            <label htmlFor="subject">Email Subject</label>
            <input
              type="text"
              name="subject"
              className="form-control"
              value={subject}
              required
              onChange={(e) => setSubject(e.target.value)}
            />
            <label htmlFor="message">Email Body</label>
            <textarea
              name="message"
              className="form-control message-body"
              rows="6"
              value={message ?? ''}
              required
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <p>
            A total of <span className="num-reviewers">{totalMessagesCount}</span> reminder
            emails will be sent to the following reviewers:
          </p>
          <div className="well reviewer-list">
            {uniqBy(recipientsInfo, (p) => p.reviewerProfileId).map((recipientInfo) => (
              <li key={recipientInfo.preferredEmail}>{`${recipientInfo.preferredName} <${
                recipientInfo.preferredEmail
              }>${recipientInfo.count > 1 ? ` --- (×${recipientInfo.count})` : ''}`}</li>
            ))}
          </div>
        </>
      )}
    </BasicModal>
  )
}

const QuerySearchInfoModal = ({ filterOperators, propertiesAllowed }) => (
  <BasicModal
    id="query-search-info"
    title="Query Search"
    primaryButtonText={null}
    cancelButtonText="OK"
  >
    <>
      <strong className="tooltip-title">Some tips to use query search</strong>
      <p>
        In Query mode, you can enter an expression and hit ENTER to search.
        <br />
        The expression consists of property of a paper and a value you would like to search
      </p>
      <p>
        e.g. <code>+number=5</code> will return the paper 5
      </p>
      <p>
        Expressions may also be combined with AND/OR.
        <br />
        e.g. <code>+number=5 OR number=6 OR number=7</code> will return paper 5,6 and 7.
        <br />
      </p>
      <p>
        If the value has multiple words, it should be enclosed in double quotes.
        <br />
        e.g. <code>+title=&quot;some title to search&quot;</code>
      </p>
      <p>
        Braces can be used to organize expressions.
        <br />
        e.g. <code>+number=1 OR ((number=5 AND number=7) OR number=8)</code> will return paper
        1 and 8.
      </p>
      <p>
        <strong>Operators available</strong>
        {`: ${filterOperators.join(', ')}`}
      </p>
      <p>
        <strong>Properties available</strong>
      </p>
      {Object.keys(propertiesAllowed).map((key) => (
        <li key={key}>{key}</li>
      ))}
    </>
  </BasicModal>
)

const MenuBar = ({
  tableRowsAll,
  tableRows,
  tableRowsDisplayed,
  selectedNoteIds,
  setPaperStatusTabData,
  pageSize,
  pageNumber,
  setTotalCount,
  setPageNumber,
}) => {
  const { shortPhrase, venueId, officialReviewName, enableQuerySearch } =
    useContext(WebFieldContext)
  const disabledMessageButton = selectedNoteIds.length === 0
  const messageReviewerOptions = [
    { label: 'All Reviewers of selected papers', value: 'allReviewers' },
    { label: 'Reviewers of selected papers with submitted reviews', value: 'withReviews' },
    {
      label: 'Reviewers of selected papers with unsubmitted reviews',
      value: 'missingReviews',
    },
  ]
  const sortDropdownOptions = [
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
  const [messageOption, setMessageOption] = useState(null)
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [queryIsInvalidStatus, setQueryIsInvalidStatus] = useState(false)
  const [isQuerySearch, setIsQuerySearch] = useState(false)
  const [sortOption, setSortOption] = useState(sortDropdownOptions[0])
  let filterOperators = ['!=', '>=', '<=', '>', '<', '='] // sequence matters
  let propertiesAllowed = {
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

  const shouldEnableQuerySearch = enableQuerySearch && filterOperators && propertiesAllowed

  const exportFileName = `${shortPhrase}${
    tableRows?.length === tableRowsAll?.length ? ' paper status' : 'paper status(Filtered)'
  }`

  const handleMessageDropdownChange = (option) => {
    setMessageOption(option)
    $('#message-reviewers').modal('show')
  }

  const delaySearch = useCallback(
    debounce((term) => setSearchTerm(term), 300),
    []
  )

  const keyDownHandler = (e) => {
    if (e.key !== 'Enter' || !shouldEnableQuerySearch) return
    const cleanImmediateSearchTerm = immediateSearchTerm.trim()
    if (!cleanImmediateSearchTerm.startsWith('+')) return
    // query search
    const { filteredRows, queryIsInvalid } = filterCollections(
      tableRowsAll,
      cleanImmediateSearchTerm.slice(1),
      filterOperators,
      propertiesAllowed,
      'note.id'
    )
    if (queryIsInvalid) {
      setQueryIsInvalidStatus(true)
      return
    }
    setPaperStatusTabData((paperStatusTabData) => ({
      ...paperStatusTabData,
      tableRows: filteredRows,
      tableRowsDisplayed: filteredRows.slice(0, pageSize),
    }))
  }

  const handleQuerySearchInfoClick = () => {
    $('#query-search-info').modal('show')
  }

  const handleReverseSort = () => {
    const reversedTableRows = [...tableRows].reverse()
    setPaperStatusTabData((paperStatusTabData) => ({
      ...paperStatusTabData,
      tableRows: reversedTableRows,
    }))
  }

  useEffect(() => {
    if (!tableRows) return
    if (!searchTerm) {
      setPaperStatusTabData((paperStatusTabData) => ({
        ...paperStatusTabData,
        tableRows: [...paperStatusTabData.tableRowsAll],
      }))
      return
    }
    const cleanSearchTerm = searchTerm.trim().toLowerCase()
    if (shouldEnableQuerySearch && cleanSearchTerm.startsWith('+')) return // handled in keyDownHandler
    setPaperStatusTabData((paperStatusTabData) => ({
      ...paperStatusTabData,
      tableRows: paperStatusTabData.tableRowsAll.filter((row) => {
        const noteTitle =
          row.note.version === 2 ? row.note.content?.title?.value : row.note.content?.title
        return (
          row.note.number == cleanSearchTerm || // eslint-disable-line eqeqeq
          noteTitle.toLowerCase().includes(cleanSearchTerm)
        )
      }),
    }))
  }, [searchTerm])

  useEffect(() => {
    setPaperStatusTabData((data) => ({
      ...data,
      tableRows: orderBy(data.tableRowsAll, sortOption.getValue),
    }))
  }, [sortOption])

  return (
    <div className="menu-bar">
      <div className="message-button-container">
        <button className={`btn message-button${disabledMessageButton ? ' disabled' : ''}`}>
          <Icon name="envelope" />
          <Dropdown
            className={`dropdown-sm message-button-dropdown${
              disabledMessageButton ? ' dropdown-disable' : ''
            }`}
            options={messageReviewerOptions}
            components={{
              IndicatorSeparator: () => null,
              DropdownIndicator: () => null,
            }}
            value={{ label: 'Message', value: '' }}
            onChange={handleMessageDropdownChange}
            isSearchable={false}
          />
        </button>
      </div>
      <div className="btn-group">
        <ExportCSV records={tableRows} fileName={exportFileName} />
      </div>
      <span className="search-label">Search:</span>
      {isQuerySearch && shouldEnableQuerySearch && (
        <div role="button" onClick={handleQuerySearchInfoClick}>
          <Icon name="info-sign" />
        </div>
      )}
      <input
        className={`form-control search-input${queryIsInvalidStatus ? ' invalid-value' : ''}`}
        placeholder={`Enter search term${
          shouldEnableQuerySearch ? ' or type + to start a query and press enter' : ''
        }`}
        value={immediateSearchTerm}
        onChange={(e) => {
          setImmediateSearchTerm(e.target.value)
          setQueryIsInvalidStatus(false)
          setIsQuerySearch(e.target.value.trim().startsWith('+'))
          delaySearch(e.target.value)
        }}
        onKeyDown={(e) => keyDownHandler(e)}
      />
      <span className="sort-label">Sort by:</span>
      <Dropdown
        className="dropdown-sm sort-dropdown"
        value={sortOption}
        options={sortDropdownOptions}
        onChange={(e) => setSortOption(e)}
      />
      <button className="btn btn-icon sort-button" onClick={handleReverseSort}>
        <Icon name="sort" />
      </button>
      <MessageReviewersModal
        tableRowsDisplayed={tableRows}
        messageOption={messageOption}
        selectedNoteIds={selectedNoteIds}
      />
      {isQuerySearch && shouldEnableQuerySearch && (
        <QuerySearchInfoModal
          filterOperators={filterOperators}
          propertiesAllowed={propertiesAllowed}
        />
      )}
    </div>
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
        {console.log('rowData', rowData)}
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
  } = useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.notes?.length ?? 0)
  const pageSize = 1

  const getReviewerName = (reviewerProfile) => {
    const name =
      reviewerProfile.content.names.find((t) => t.preferred) ||
      reviewerProfile.content.names[0]
    return name ? prettyId(reviewerProfile.id) : `${name.first} ${name.last}`
  }

  useEffect(() => {
    // #region calculate reviewProgressData and metaReviewData
    const notes = pcConsoleData.notes
    if (!notes) return
    const tableRows = notes?.map((note) => {
      const assignedReviewers =
        pcConsoleData.paperGroups.reviewerGroups?.find(
          (group) => group.noteNumber === note.number
        )?.members ?? []

      const assignedReviewerProfiles = assignedReviewers.map((reviewer) => {
        return {
          id: reviewer.reviewerProfileId,
          // profile: pcConsoleData.allProfiles?.find(
          //   (p) =>
          //     p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
          //     p.content.emails.includes(reviewer.reviewerProfileId)
          // ),
          profile: pcConsoleData.allProfilesMap.get(reviewer.reviewerProfileId),
        }
      })

      const assignedAreaChairs =
        pcConsoleData.paperGroups.areaChairGroups?.find(
          (group) => group.noteNumber === note.number
        )?.members ?? []

      const assignedAreaChairProfiles = assignedAreaChairs.map((areaChair) => {
        return {
          id: areaChair.areaChairProfileId,
          // profile: pcConsoleData.allProfiles?.find(
          //   (p) =>
          //     p.content.names.some((q) => q.username === areaChair.areaChairProfileId) ||
          //     p.content.emails.includes(areaChair.areaChairProfileId)
          // ),
          profile: pcConsoleData.allProfilesMap.get(areaChair.areaChairProfileId),
        }
      })

      const officialReviews =
        // pcConsoleData.officialReviewsByPaperNumber
        //   .find((p) => p.noteNumber === note.number)
        pcConsoleData.officialReviewsByPaperNumberMap?.get(note.number)?.map((q) => {
          const isV2Note = q.version === 2
          // const anonymousId = getNumberFromGroup(q.signatures[0], 'Reviewer_', false)
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
          console.log('confidenceMatch', confidenceMatch)
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
        // pcConsoleData.metaReviewsByPaperNumber?.find((p) => p.noteNumber === note.number)
        pcConsoleData.metaReviewsByPaperNumberMap?.get(note.number)?.metaReviews ?? []

      return {
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
            preferredName: profile ? getReviewerName(profile) : reviewer.reviewerProfileId,
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
              preferredName: profile ? getReviewerName(profile) : areaChair.areaChairProfileId,
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
      }
    })

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
        <MenuBar
          tableRowsAll={paperStatusTabData.tableRowsAll}
          tableRows={paperStatusTabData.tableRows}
          tableRowsDisplayed={paperStatusTabData.tableRowsDisplayed}
          selectedNoteIds={selectedNoteIds}
          setPaperStatusTabData={setPaperStatusTabData}
          pageSize={pageSize}
          pageNumber={pageNumber}
          setTotalCount={setTotalCount}
          setPageNumber={setPageNumber}
        />
        <p className="empty-message">No papers matching search criteria.</p>
      </div>
    )
  return (
    <div className="table-container">
      <MenuBar
        tableRowsAll={paperStatusTabData.tableRowsAll}
        tableRows={paperStatusTabData.tableRows}
        tableRowsDisplayed={paperStatusTabData.tableRowsDisplayed}
        selectedNoteIds={selectedNoteIds}
        setPaperStatusTabData={setPaperStatusTabData}
        pageSize={pageSize}
        pageNumber={pageNumber}
        setTotalCount={setTotalCount}
        setPageNumber={setPageNumber}
      />
      <Table
        className="console-table table-striped programchair-console-table"
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
      const allProfiles = (profileResults[0].profiles ?? []).concat(
        profileResults[1].profiles ?? []
      )
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
            anonId: getNumberFromGroup(review.signatures[0], 'Reviewer_', false),
          }))
        const metaReviews = directReplies
          .filter(
            (p) =>
              p.invitation === `${venueId}/Paper${note.number}/-/${officialMetaReviewName}`
          )
          ?.map((metaReview) => ({
            ...metaReview,
            anonId: getNumberFromGroup(metaReview.signatures[0], 'Area_Chair_', false),
          }))
        const decision = directReplies.find(
          (p) => p.invitation === `${venueId}/Paper${note.number}/-/${decisionName}`
        )
        officialReviewsByPaperNumberMap.set(note.number, officialReviews)
        metaReviewsByPaperNumberMap.set(note.number, metaReviews)
        decisionByPaperNumberMap.set(note.number, decision)
      })

      setPcConsoleData({
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
                    ? getNumberFromGroup(reviewerAnonGroup, 'Reviewer_', false)
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
                    ? getNumberFromGroup(areaChairAnonGroup, 'Area_Chair_', false)
                    : null,
                }
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
              loadData={loadData}
              showContent={activeTabId === '#paper-status'}
            />
          </TabPanel>
          {areaChairsId && activeTabId === '#areachair-status' && (
            <TabPanel id="areachair-status">
              <>3</>
            </TabPanel>
          )}
          {seniorAreaChairsId && activeTabId === '#seniorareachair-status' && (
            <TabPanel id="seniorareachair-status">
              <>4</>
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
