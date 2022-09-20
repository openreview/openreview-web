import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import { useRouter } from 'next/router'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import Table from '../Table'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import WebFieldContext from '../WebFieldContext'
import { useContext, useEffect, useState } from 'react'
import BasicHeader from './BasicHeader'
import { formatDateTime, getNumberFromGroup, inflect, prettyId } from '../../lib/utils'
import Link from 'next/link'
import LoadingSpinner from '../LoadingSpinner'

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

const ReviewStatsRow = ({ pcConsoleData }) => {
  const { paperReviewsCompleteThreshold, officialReviewName, venueId } =
    useContext(WebFieldContext)

  const allOfficialReviews = pcConsoleData.officialReviewsByPaperNumber?.flatMap(
    (p) => p.officialReviews
  )

  const assignedReviewsCount = pcConsoleData.paperGroups?.reviewerGroups?.reduce(
    (prev, curr) => {
      return prev + curr.members.length
    },
    0
  )

  // map tilde id in reviewerGroup to anon reviewer group id in anonReviewerGroups
  const reviewerAnonGroupIds = {}
  pcConsoleData.paperGroups?.reviewerGroups.forEach((reviewerGroup) => {
    const paperAnonReviewerGroups =
      pcConsoleData.paperGroups?.anonReviewerGroups[reviewerGroup.noteNumber]
    reviewerGroup.members.forEach((reviewerTildeId) => {
      if (!paperAnonReviewerGroups?.[reviewerTildeId]) return
      if (reviewerAnonGroupIds[reviewerTildeId]) {
        reviewerAnonGroupIds[reviewerTildeId].push({
          noteNumber: reviewerGroup.noteNumber,
          anonGroupId: paperAnonReviewerGroups[reviewerTildeId],
        })
      } else {
        reviewerAnonGroupIds[reviewerTildeId] = [
          {
            noteNumber: reviewerGroup.noteNumber,
            anonGroupId: paperAnonReviewerGroups[reviewerTildeId],
          },
        ]
      }
    })
  })

  // all anon reviewer id group have signed official review
  const reviewersCompletedAllReviews = Object.values(reviewerAnonGroupIds ?? {}).filter(
    (anonReviewerGroups) =>
      anonReviewerGroups?.every((anonReviewerGroup) => {
        const paperOfficialReviews = pcConsoleData.officialReviewsByPaperNumber?.find(
          (p) => p.noteNumber === anonReviewerGroup.noteNumber
        )?.officialReviews
        return paperOfficialReviews?.find(
          (p) => p.signatures[0] === anonReviewerGroup.anonGroupId
        )
      })
  )

  const reviewersComplete = reviewersCompletedAllReviews?.length

  const reviewersWithAssignmentsCount = Object.values(reviewerAnonGroupIds ?? {}).length

  const paperWithMoreThanThresholddReviews = pcConsoleData.notes?.filter((note) => {
    const paperOfficialReviews = pcConsoleData.officialReviewsByPaperNumber?.find(
      (p) => (p.noteNumber = note.number)
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

  return (
    <>
      <div className="row">
        <StatContainer
          title="Review Progress"
          hint="% of all assigned official reviews that have been submitted"
          value={
            pcConsoleData.notes && pcConsoleData.paperGroups ? (
              renderStat(allOfficialReviews.length, assignedReviewsCount)
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
        <StatContainer
          title="Reviewer Progress"
          hint="% of reviewers who have reviewed all of their assigned papers"
          value={
            pcConsoleData.notes && pcConsoleData.paperGroups ? (
              renderStat(reviewersComplete, reviewersWithAssignmentsCount)
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
              renderStat(paperWithMoreThanThresholddReviews.length, pcConsoleData.notes.length)
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
  const metaReviewsCount = pcConsoleData.metaReviewsByPaperNumber?.filter(
    (p) => p.metaReviews?.length
  )?.length

  // map tilde id in areaChairGroups to anon areachair group id in anonAreaChairGroups
  const areaChairAnonGroupIds = {}
  pcConsoleData.paperGroups?.areaChairGroups.forEach((areaChairGroup) => {
    const paperAnonAreaChairGroups =
      pcConsoleData.paperGroups?.anonAreaChairGroups[areaChairGroup.noteNumber]
    areaChairGroup.members.forEach((areaChairTildeId) => {
      if (!paperAnonAreaChairGroups?.[areaChairTildeId]) return
      if (areaChairAnonGroupIds[areaChairTildeId]) {
        areaChairAnonGroupIds[areaChairTildeId].push({
          noteNumber: areaChairGroup.noteNumber,
          anonGroupId: paperAnonAreaChairGroups[areaChairTildeId],
        })
      } else {
        areaChairAnonGroupIds[areaChairTildeId] = [
          {
            noteNumber: areaChairGroup.noteNumber,
            anonGroupId: paperAnonAreaChairGroups[areaChairTildeId],
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
  const notesWithFinalDecision = pcConsoleData.decisionByPaperNumber?.filter((p) => p.decision)
  const decisionsCount = notesWithFinalDecision?.length
  const submissionsCount = pcConsoleData.notes?.length

  const allDecisions = pcConsoleData.decisionByPaperNumber?.flatMap((p) => {
    return p.decision?.content?.decision ?? []
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
                pcConsoleData.decisionByPaperNumber ? (
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
  requestForm,
  registrationForms,
  invitations,
  bidEnabled,
  recommendationEnabled,
}) => {
  if (!requestForm) return null
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
    const invitation = invitations.find((q) => q.id === p.id)
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
                  <li key={form.id}>
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

const OverviewTab = ({ pcConsoleData }) => {
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
      <ReviewStatsRow pcConsoleData={pcConsoleData} />
      <MetaReviewStatsRow pcConsoleData={pcConsoleData} />
      <DecisionStatsRow pcConsoleData={pcConsoleData} />
      <DescriptionTimelineOtherConfigRow
        requestForm={pcConsoleData.requestForm}
        registrationForms={pcConsoleData.registrationForms}
        invitations={pcConsoleData.invitations}
        bidEnabled={bidEnabled}
        recommendationEnabled={recommendationEnabled}
      />
    </>
  )
}

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
  } = useContext(WebFieldContext)
  const { setBannerContent } = appContext
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const [activeTabId, setActiveTabId] = useState('venue-configuration')
  const [pcConsoleData, setPcConsoleData] = useState({})

  const loadData = async () => {
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
            : Promise.resolve(null)
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
      perPaperGroupResults.groups?.forEach((group) => {
        if (group.id.endsWith('/Reviewers')) {
          reviewerGroups.push({
            noteNumber: getNumberFromGroup(group.id, 'Paper'),
            ...group,
          })
        } else if (group.id.includes(anonReviewerName)) {
          const number = getNumberFromGroup(group.id, 'Paper')
          if (!(number in anonReviewerGroups)) anonReviewerGroups[number] = {}
          if (group.members.length) anonReviewerGroups[number][group.members[0]] = group.id
        } else if (group.id.endsWith('/Area_Chairs')) {
          areaChairGroups.push({
            noteNumber: getNumberFromGroup(group.id, 'Paper'),
            ...group,
          })
        } else if (group.id.includes(anonAreaChairName)) {
          const number = getNumberFromGroup(group.id, 'Paper')
          if (!(number in anonAreaChairGroups)) anonAreaChairGroups[number] = {}
          if (group.members.length) anonAreaChairGroups[number][group.members[0]] = group.id
        } else if (group.id.endsWith('Senior_Area_Chairs')) {
          seniorAreaChairGroups.push(group)
        }
      })
      // #endregion

      setPcConsoleData({
        invitations: invitationResults.flat(),
        requestForm,
        registrationForms,
        reviewers: committeeMemberResults[0]?.members ?? [],
        areaChairs: committeeMemberResults[1]?.members ?? [],
        seniorAreaChairs: committeeMemberResults[2]?.members ?? [],
        notes,
        officialReviewsByPaperNumber: notes.map((note) => {
          return {
            noteNumber: note.number,
            officialReviews: note.details.directReplies.filter(
              (p) => p.invitation === `${venueId}/Paper${note.number}/-/${officialReviewName}`
            ),
          }
        }),
        metaReviewsByPaperNumber: notes.map((note) => {
          return {
            noteNumber: note.number,
            metaReviews: note.details.directReplies.filter(
              (p) =>
                p.invitation === `${venueId}/Paper${note.number}/-/${officialMetaReviewName}`
            ),
          }
        }),
        decisionByPaperNumber: notes.map((note) => {
          return {
            noteNumber: note.number,
            decision: note.details.directReplies.find(
              (p) => p.invitation === `${venueId}/Paper${note.number}/-/${decisionName}`
            ),
          }
        }),
        withdrawnNotes: withdrawnRejectedSubmissionResults[0],
        deskRejectedNotes: withdrawnRejectedSubmissionResults[1],
        bidCounts: {
          reviewers: bidCountResults[0],
          areaChairs: bidCountResults[1],
          seniorAreaChairs: bidCountResults[2],
        },
        paperGroups: {
          anonReviewerGroups,
          reviewerGroups,
          anonAreaChairGroups,
          areaChairGroups,
          seniorAreaChairGroups,
        },
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
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

  return (
    <>
      <BasicHeader title={header?.title} instructions={header.instructions} />
      <Tabs>
        <TabList>
          <Tab id="venue-configuration" active>
            Overview
          </Tab>
          <Tab id="paper-status" onClick={() => setActiveTabId('paper-status')}>
            Paper Status
          </Tab>
          {areaChairsId && (
            <Tab id="areachair-status" onClick={() => setActiveTabId('areachair-status')}>
              Area Chair Status
            </Tab>
          )}
          {seniorAreaChairsId && (
            <Tab
              id="seniorareachair-status"
              onClick={() => setActiveTabId('seniorareachair-status')}
            >
              Senior Area Chair Status
            </Tab>
          )}
          <Tab id="reviewer-status" onClick={() => setActiveTabId('reviewer-status')}>
            Reviewer Status
          </Tab>
          <Tab
            id="deskrejectwithdrawn-status"
            onClick={() => setActiveTabId('deskrejectwithdrawn-status')}
          >
            Desk Rejected/Withdrawn Papers
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="venue-configuration">
            <OverviewTab pcConsoleData={pcConsoleData} />
          </TabPanel>
          <TabPanel id="paper-status">{activeTabId === 'paper-status' && <>2</>}</TabPanel>
          {areaChairsId && activeTabId === 'areachair-status' && (
            <TabPanel id="areachair-status">
              <>3</>
            </TabPanel>
          )}
          {seniorAreaChairsId && activeTabId === 'seniorareachair-status' && (
            <TabPanel id="seniorareachair-status">
              <>4</>
            </TabPanel>
          )}
          <TabPanel id="reviewer-status">
            {activeTabId === 'reviewer-status' && <>5</>}
          </TabPanel>
          <TabPanel id="deskrejectwithdrawn-status">
            {activeTabId === 'deskrejectwithdrawn-status' && <>6</>}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default ProgramChairConsole
