/* globals promptError: false */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import Dropdown from '../../components/Dropdown'
import ScalarStat from '../../components/assignments/ScalarStat'
import HistogramStat from '../../components/assignments/HistogramStat'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { prettyId, getGroupIdfromInvitation } from '../../lib/utils'
import { getEdgeBrowserUrl } from '../../lib/edge-utils'
import { referrerLink } from '../../lib/banner-links'
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
} from '../../lib/assignment-stats-utils'

const AssignmentStats = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const [assignmentConfigNote, setAssignmentConfigNote] = useState(null)
  const [matchLists, setMatchLists] = useState(null)
  const [values, setValues] = useState({})
  const [groupId, setGroupId] = useState(null)
  const [error, setError] = useState(null)
  const query = useQuery()
  const router = useRouter()
  const { setBannerContent } = appContext

  const edgeBrowserUrlParams = assignmentConfigNote
    ? {
        browseInvitations: Object.keys(
          assignmentConfigNote.content?.scores_specification ?? {}
        ),
        editInvitation:
          assignmentConfigNote.content?.status === 'Deployed' &&
          assignmentConfigNote.content?.deployed_assignment_invitation
            ? assignmentConfigNote.content?.deployed_assignment_invitation
            : `${
                assignmentConfigNote.content?.assignment_invitation
              },label:${encodeURIComponent(assignmentConfigNote.content?.title)}`,
        conflictsInvitation: assignmentConfigNote.content?.conflicts_invitation,
        customMaxPapersInvitation: assignmentConfigNote.content?.custom_max_papers_invitation,
        customLoadInvitation: assignmentConfigNote.content?.custom_load_invitation,
        aggregateScoreInvitation: assignmentConfigNote.content?.aggregate_score_invitation,
        assignmentLabel: encodeURIComponent(assignmentConfigNote.content?.title),
        referrerText: `${prettyId(assignmentConfigNote.content?.title)} Statistics`,
        configNoteId: assignmentConfigNote.id,
      }
    : {}

  const showRecommendationDistribution =
    matchLists?.[0]
      ?.map((p) => p?.otherScores?.recommendation)
      ?.filter(Number.isFinite)
      ?.reduce((a, b) => a + b, 0) > 0

  const actionOptions = [{ value: 'browserAssignments', label: 'Browse Assignments' }]

  const handleActionChange = (option) => {
    switch (option.value) {
      case 'browserAssignments':
        router.push(getEdgeBrowserUrl(assignmentConfigNote.content))
        break
      default:
        break
    }
  }

  const loadConfigNote = async (assignmentConfigId) => {
    try {
      const { notes } = await api.get('/notes', { id: assignmentConfigId }, { accessToken })
      if (notes?.length > 0) {
        setAssignmentConfigNote(notes[0])
        setGroupId(getGroupIdfromInvitation(notes[0].invitation))
      } else {
        setError({
          statusCode: 404,
          message: `No assignment note with the ID "${assignmentConfigId}" found`,
        })
      }
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  const loadMatchingDataFromEdges = async () => {
    const noteContent = assignmentConfigNote.content
    const paperInvitationElements = noteContent.paper_invitation.split('&')

    let papersP = Promise.resolve([])
    if (paperInvitationElements[0].includes('/-/')) {
      const getNotesArgs = {
        invitation: paperInvitationElements[0],
      }
      paperInvitationElements.slice(1).forEach((filter) => {
        const filterElements = filter.split('=')
        getNotesArgs[filterElements[0]] = filterElements[1]
      })
      papersP = api.getAll('/notes', getNotesArgs, { accessToken, resultsKey: 'notes' })
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

    await Promise.allSettled([papersP, usersP, assignmentsP, bidsP, recommendationsP]).then(
      (results) => {
        const failedRequest = results.find((p) => p.status !== 'fulfilled')
        if (failedRequest) {
          promptError(failedRequest.reason?.message)
          return
        }

        let papers = []
        if (paperInvitationElements[0].includes('/-/')) {
          papers = results[0].value
        } else {
          papers = results[0].value?.groups?.[0]?.members.map((p) => ({ id: p }))
        }

        const users = results[1].value?.groups?.[0]?.members
        const assignments = results[2].value
        const bids = results[3].value
        const recommendations = results[4].value

        const { assignmentMap, usersWithAssignments, papersWithAssignments } =
          getAssignmentMap(assignments, bids, recommendations, papers, users)

        const unassignedPapersList = getUnassignedPapersList(papers, papersWithAssignments)
        const unassignedUsersList = getUnassignedUsersList(users, usersWithAssignments)

        setMatchLists([assignmentMap, unassignedPapersList, unassignedUsersList])
      }
    )
  }

  const loadMatchingDataFromNotes = async () => {
    const noteContent = assignmentConfigNote.content
    const notes = await api.getAll(
      '/notes',
      {
        invitation: noteContent.assignment_invitation,
        'content.title': noteContent.title,
      },
      { accessToken, resultsKey: 'notes' }
    )

    const assignmentMap = notes.flatMap((note) =>
      note.content.assignedGroups.map((group) => {
        const otherScores = group.scores
          .map((v, k) => [k, Number.isNaN(Number(v)) ? 0 : Number(v)])
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})

        return {
          groupId: group.userId,
          paperId: note.forum,
          score: Number.isNaN(Number(group.finalScore)) ? 0 : Number(group.finalScore),
          otherScores,
        }
      })
    )

    setMatchLists([assignmentMap, [], []])
  }

  useEffect(() => {
    if (!assignmentConfigNote) return

    const useEdges = !!assignmentConfigNote.content.scores_specification
    if (useEdges) {
      loadMatchingDataFromEdges()
      return
    }
    loadMatchingDataFromNotes()
  }, [assignmentConfigNote])

  useEffect(() => {
    if (!matchLists) return

    setValues({
      paperCount: getPaperCount(matchLists[0], matchLists[1]),
      userCount: getUserCount(matchLists[0], matchLists[2]),
      meanFinalScore: getMeanFinalScore(matchLists[0]),
      meanGroupCountPerPaper: getMeanGroupCountPerPaper(matchLists[0]),
      meanPaperCountPerGroup: getMeanPaperCountPerGroup(matchLists[0]),
      distributionPapersByUserCount: getDistributionPapersByUserCount(
        matchLists[0],
        matchLists[1]
      ),
      distributionUsersByPaperCount: getDistributionUsersByPaperCount(
        matchLists[0],
        matchLists[2]
      ),
      distributionAssignmentByScore: getDistributionAssignmentByScore(matchLists[0]),
      distributionPapersByMeanScore: getDistributionPapersByMeanScore(
        matchLists[0],
        matchLists[1]
      ),
      distributionUsersByMeanScore: getDistributionUsersByMeanScore(
        matchLists[0],
        matchLists[2]
      ),
      ...(showRecommendationDistribution && {
        distributionRecomGroupCountPerPaper: getDistributionRecomGroupCountPerPaper(
          matchLists[0]
        ),
        distributionRecomGroupCountPerWeight: getDistributionRecomGroupCountPerWeight(
          matchLists[0]
        ),
      }),
      ...getNumDataPerGroupDataByBidScore(matchLists[0]),
    })
  }, [matchLists])

  useEffect(() => {
    if (!accessToken || !query) return

    if (!query.id) {
      setError({
        statusCode: 400,
        message: 'Could not load assignment statistics. Missing parameter id.',
      })
    } else {
      loadConfigNote(query.id)
    }
  }, [accessToken, query])

  useEffect(() => {
    if (!query || !groupId) return

    setBannerContent(
      referrerLink(
        query.referrer ||
          `[all assignments for ${prettyId(groupId)}](/assignments?group=${groupId})`
      )
    )
  }, [query, groupId])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  if (!assignmentConfigNote) return <LoadingSpinner />

  return (
    <>
      <Head>
        <title key="title">{`${assignmentConfigNote.content.title} Stats | OpenReview`}</title>
      </Head>

      <div className="header">
        <h1>{`Assignment Statistics – ${assignmentConfigNote.content.title}`}</h1>
        <Dropdown
          placeholder="Actions"
          className="action-dropdown"
          options={actionOptions}
          onChange={handleActionChange}
        />
      </div>

      <div className="basic-stats">
        <ScalarStat
          value={values.paperCount}
          name="Number of papers / Number of papers with assignments"
        />
        <ScalarStat
          value={values.userCount}
          name="Number of users / Number of users with assignments"
        />
        <ScalarStat value={values.meanFinalScore} name="Mean Final Score" />
        <ScalarStat
          value={values.meanGroupCountPerPaper}
          name="Mean Number of Users per Paper"
        />
        <ScalarStat
          value={values.meanPaperCountPerGroup}
          name="Mean Number of Papers per User"
        />
        {assignmentConfigNote?.content?.randomized_fraction_of_opt && (
          <ScalarStat
            value={
              Math.round(assignmentConfigNote.content.randomized_fraction_of_opt * 100) / 100
            }
            name="Ratio of mean score to hypothetical optimal assignment score (Randomized solver only)"
          />
        )}
      </div>
      <div>
        <h3 className="section-header">Assignment Distributions</h3>
        <div className="dist-stats">
          <HistogramStat
            id="distributionPapersByUserCount"
            stats={values.distributionPapersByUserCount}
            edgeBrowserUrlParams={edgeBrowserUrlParams}
          />
          <HistogramStat
            id="distributionUsersByPaperCount"
            stats={values.distributionUsersByPaperCount}
            edgeBrowserUrlParams={edgeBrowserUrlParams}
          />
          <HistogramStat
            id="distributionAssignmentByScore"
            stats={values.distributionAssignmentByScore}
            edgeBrowserUrlParams={edgeBrowserUrlParams}
          />
          <HistogramStat
            id="distributionPapersByMeanScore"
            stats={values.distributionPapersByMeanScore}
            edgeBrowserUrlParams={edgeBrowserUrlParams}
          />
          <HistogramStat
            id="distributionUsersByMeanScore"
            stats={values.distributionUsersByMeanScore}
            edgeBrowserUrlParams={edgeBrowserUrlParams}
          />
        </div>
      </div>
      {showRecommendationDistribution && (
        <div>
          <h3 className="section-header">Recommendation Distributions</h3>
          <div className="dist-stats">
            <HistogramStat
              id="distributionPapersByUserCount"
              stats={values.distributionPapersByUserCount}
              edgeBrowserUrlParams={edgeBrowserUrlParams}
            />
            <HistogramStat
              id="distributionUsersByPaperCount"
              stats={values.distributionUsersByPaperCount}
              edgeBrowserUrlParams={edgeBrowserUrlParams}
            />
            <HistogramStat
              id="distributionAssignmentByScore"
              stats={values.distributionAssignmentByScore}
              edgeBrowserUrlParams={edgeBrowserUrlParams}
            />
            <HistogramStat
              id="distributionPapersByMeanScore"
              stats={values.distributionPapersByMeanScore}
              edgeBrowserUrlParams={edgeBrowserUrlParams}
            />
            <HistogramStat
              id="distributionUsersByMeanScore"
              stats={values.distributionUsersByMeanScore}
              edgeBrowserUrlParams={edgeBrowserUrlParams}
            />
          </div>
        </div>
      )}
      <div>
        <h3 className="section-header">Bid Distributions</h3>
        <div className="dist-stats">
          {Object.keys(values)
            .filter((key) => key.startsWith('distributionPaperCountPerGroup-bid-'))
            .map((key) => (
              <HistogramStat
                id={key}
                key={key}
                stats={values[key]}
                edgeBrowserUrlParams={edgeBrowserUrlParams}
              />
            ))}
        </div>
      </div>
    </>
  )
}

AssignmentStats.bodyClass = 'assignment-stats'

export default AssignmentStats
