import { stringify } from 'query-string'
import { redirect } from 'next/navigation'
import { get, upperFirst } from 'lodash'
import { Suspense } from 'react'
import serverAuth from '../../auth'
import api from '../../../lib/api-client'
import CommonLayout from '../../CommonLayout'
import { referrerLink } from '../../../lib/banner-links'
import { getGroupIdfromInvitation, getSingularRoleName, prettyId } from '../../../lib/utils'
import Banner from '../../../components/Banner'
import V1Stats from './V1Stats'
import styles from './Stats.module.scss'
import { getNoteContentValues } from '../../../lib/forum-utils'
import {
  getAssignmentMap,
  getDistributionPapersByUserCount,
  getMeanFinalScore,
  getMeanGroupCountPerPaper,
  getMeanPaperCountPerGroup,
  getPaperCount,
  getUnassignedPapersList,
  getUnassignedUsersList,
  getUserCount,
  getDistributionUsersByPaperCount,
  getDistributionAssignmentByScore,
  getDistributionPapersByMeanScore,
  getDistributionUsersByMeanScore,
  getDistributionRecomGroupCountPerPaper,
  getDistributionRecomGroupCountPerWeight,
  getNumDataPerGroupDataByBidScore,
} from '../../../lib/assignment-stats-utils'
import Stats from './Stats'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ErrorDisplay from '../../../components/ErrorDisplay'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams
  const { token: accessToken } = await serverAuth()
  try {
    const note = await api.getNoteById(id, accessToken)
    const title = note.apiVersion === 2 ? note.content.title.value : note.content.title
    return {
      title: `${title} Stats | OpenReview`,
    }
  } catch (error) {
    return {
      title: 'OpenReview',
    }
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { id, referrer } = query
  const { token: accessToken } = await serverAuth()
  if (!accessToken) redirect(`/login?redirect=/assignments/stats?${stringify(query)}`)
  if (!id)
    return (
      <ErrorDisplay message="Could not load assignment statistics. Missing parameter id." />
    )

  const note = await api.getNoteById(id, accessToken)
  if (!note) return <ErrorDisplay message={`No assignment note with the ID "${id}" found`} />

  const isV2Note = note.apiVersion === 2
  const groupId = isV2Note
    ? getGroupIdfromInvitation(note.invitations[0])
    : getGroupIdfromInvitation(note.invitation)

  const banner = referrerLink(
    referrer || `[all assignments for ${prettyId(groupId)}](/assignments?group=${groupId})`
  )

  if (!isV2Note)
    return (
      <CommonLayout banner={<Banner>{banner}</Banner>}>
        <div className={styles.stats}>
          <V1Stats configNote={note} accessToken={accessToken} />
        </div>
      </CommonLayout>
    )

  let labelNames = {}
  const assignmentInvitationId = note.content?.assignment_invitation?.value
  const assignmentInvitation = assignmentInvitationId
    ? await api.getInvitationById(assignmentInvitationId, accessToken)
    : Promise.resolve(null)
  const headNameInAssignmentInvitation = prettyId(
    assignmentInvitation?.edge?.head?.param?.inGroup?.split('/').pop()
  )
  const tailNameInAssignmentInvitation = prettyId(
    assignmentInvitation?.edge?.tail?.param?.options?.group?.split('/').pop()
  )

  if (headNameInAssignmentInvitation && tailNameInAssignmentInvitation) {
    labelNames = {
      headName: headNameInAssignmentInvitation,
      tailName: tailNameInAssignmentInvitation,
    }
  }

  const headName = labelNames.headName ?? 'papers'
  const tailName = labelNames.tailName ?? 'users'
  const upperHeadName = upperFirst(headName)
  const upperTailName = upperFirst(tailName)
  const upperSingularHeadName = getSingularRoleName(upperHeadName)
  const upperSingularTailName = getSingularRoleName(upperTailName)

  const indexedContentFields = [
    'content.authorids',
    'content.venueid',
    'content.venue',
    'content.user',
  ]
  const noteContent = getNoteContentValues(note.content)

  const paperInvitationElements = noteContent.paper_invitation.split('&')
  let papersP
  if (paperInvitationElements[0].includes('/-/')) {
    const getNotesArgs = {
      invitation: paperInvitationElements[0],
    }
    const localFilterContentFields = {}
    paperInvitationElements.slice(1).forEach((filter) => {
      const filterElements = filter.split('=')
      if (indexedContentFields.includes(filterElements[0])) {
        getNotesArgs[filterElements[0]] = filterElements[1]
      } else {
        localFilterContentFields[filterElements[0]] = filterElements[1]
      }
    })
    papersP = api
      .getAll('/notes', getNotesArgs, { accessToken, version: 2 })
      .then((results) =>
        results.filter((p) =>
          Object.keys(localFilterContentFields).every(
            (key) => get(p, `${key}.value`) === localFilterContentFields[key]
          )
        )
      )
  } else {
    papersP = api.get('/groups', { id: paperInvitationElements[0] }, { accessToken })
  }

  const usersP = api.get('/groups', { id: noteContent.match_group }, { accessToken })

  const queryParams =
    noteContent.status === 'Deployed' && noteContent.deployed_assignment_invitation
      ? {
          invitation: noteContent.deployed_assignment_invitation,
          groupBy: 'head',
          select: 'tail,weight',
        }
      : {
          invitation: noteContent.assignment_invitation,
          label: noteContent.title,
          groupBy: 'head',
          select: 'tail,weight',
        }
  const assignmentsP = api.getAll('/edges', queryParams, {
    accessToken,
    resultsKey: 'groupedEdges',
  })

  const bidInvitation = Object.keys(noteContent.scores_specification ?? {}).find((p) =>
    p.endsWith('Bid')
  )
  const bidsP = bidInvitation
    ? api.getAll(
        '/edges',
        { invitation: bidInvitation, groupBy: 'head', select: 'tail,label' },
        { accessToken, resultsKey: 'groupedEdges' }
      )
    : Promise.resolve([])

  const recommendationInvitation = Object.keys(noteContent.scores_specification ?? {}).find(
    (p) => p.endsWith('Recommendation')
  )
  const recommendationsP = recommendationInvitation
    ? api.getAll(
        '/edges',
        { invitation: recommendationInvitation, groupBy: 'head', select: 'tail,weight' },
        { accessToken, resultsKey: 'groupedEdges' }
      )
    : Promise.resolve([])

  const valuesP = Promise.all([papersP, usersP, assignmentsP, bidsP, recommendationsP])
    .then((results) => {
      let papers = []
      if (paperInvitationElements[0].includes('/-/')) {
        papers = results[0]
      } else {
        papers = results[0]?.groups?.[0]?.members.map((p) => ({ id: p }))
      }

      const users = results[1]?.groups?.[0]?.members
      const assignments = results[2]
      const bids = results[3]
      const recommendations = results[4]

      const { assignmentMap, usersWithAssignments, papersWithAssignments } = getAssignmentMap(
        assignments,
        bids,
        recommendations,
        papers,
        users
      )

      const unassignedPapersList = getUnassignedPapersList(papers, papersWithAssignments)
      const unassignedUsersList = getUnassignedUsersList(users, usersWithAssignments)

      const matchLists = [assignmentMap, unassignedPapersList, unassignedUsersList]

      const showRecommendationDistribution =
        matchLists[0]
          .map((p) => p?.otherScores?.recommendation)
          .filter(Number.isFinite)
          .reduce((a, b) => a + b, 0) > 0
      return {
        values: {
          paperCount: getPaperCount(matchLists[0], matchLists[1]),
          userCount: getUserCount(matchLists[0], matchLists[2]),
          meanFinalScore: getMeanFinalScore(matchLists[0]),
          meanGroupCountPerPaper: getMeanGroupCountPerPaper(matchLists[0]),
          meanPaperCountPerGroup: getMeanPaperCountPerGroup(matchLists[0]),
          distributionPapersByUserCount: getDistributionPapersByUserCount(
            matchLists[0],
            matchLists[1],
            upperHeadName,
            upperTailName
          ),
          distributionUsersByPaperCount: getDistributionUsersByPaperCount(
            matchLists[0],
            matchLists[2],
            upperHeadName,
            upperTailName
          ),
          distributionAssignmentByScore: getDistributionAssignmentByScore(matchLists[0]),
          distributionPapersByMeanScore: getDistributionPapersByMeanScore(
            matchLists[0],
            matchLists[1],
            upperHeadName
          ),
          distributionUsersByMeanScore: getDistributionUsersByMeanScore(
            matchLists[0],
            matchLists[2],
            upperTailName
          ),
          ...(showRecommendationDistribution && {
            distributionRecomGroupCountPerPaper: getDistributionRecomGroupCountPerPaper(
              matchLists[0],
              upperHeadName,
              upperSingularHeadName
            ),
            distributionRecomGroupCountPerWeight: getDistributionRecomGroupCountPerWeight(
              matchLists[0]
            ),
          }),
          ...getNumDataPerGroupDataByBidScore(
            matchLists[0],
            upperHeadName,
            upperTailName,
            upperSingularTailName
          ),
        },
      }
    })
    .catch((error) => ({ errorMessage: error.message }))

  return (
    <CommonLayout banner={<Banner>{banner}</Banner>}>
      <div className={styles.stats}>
        <Suspense fallback={<LoadingSpinner />}>
          <Stats
            valuesP={valuesP}
            assignmentConfigNoteContent={noteContent}
            names={{
              headName,
              tailName,
              upperHeadName,
              upperTailName,
              upperSingularHeadName,
              upperSingularTailName,
            }}
            configNoteId={note.id}
          />
        </Suspense>
      </div>
    </CommonLayout>
  )
}
