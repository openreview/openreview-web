/* globals promptError: false */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { groupBy, floor, ceil } from 'lodash'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { prettyId, getGroupIdfromInvitation } from '../../lib/utils'
import { getEdgeBrowserUrl } from '../../lib/edge-utils'
import { referrerLink } from '../../lib/banner-links'
import Dropdown from '../../components/Dropdown'
import ScalarStat from '../../components/assignments/ScalarStat'
import HistogramStat from '../../components/assignments/HistogramStat'

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

        // #region compute data
        const paperIds = {}
        const userIds = {}
        const bidDict = {}

        papers.forEach((note) => {
          paperIds[note.id] = note
        })
        users.forEach((member) => {
          userIds[member] = member
        })
        bids.forEach((groupedEdge) => {
          const paperId = groupedEdge.id.head
          bidDict[paperId] = {}
          groupedEdge.values.forEach((value) => {
            if (paperId in paperIds) {
              bidDict[paperId][value.tail] = value.label
            }
          })
        })

        const recommendationDict = {}
        recommendations.forEach((groupedEdge) => {
          const paperId = groupedEdge.id.head
          recommendationDict[paperId] = {}
          groupedEdge.values.forEach((value) => {
            if (paperId in paperIds) {
              recommendationDict[paperId][value.tail] = value.weight
            }
          })
        })

        const usersWithAssignments = new Set()
        const papersWithAssignments = new Set()
        const assignmentMap = assignments.flatMap((groupedEdge) => {
          const paperId = groupedEdge.id.head
          const paperBids = bidDict[paperId] || {}

          const paperRecommendations = recommendationDict[paperId] || {}
          const validGroupEdges = groupedEdge.values.filter(
            (value) => paperId in paperIds && value.tail in userIds
          )
          return validGroupEdges.map((value) => {
            const otherScores = { bid: 'No Bid' }
            if (value.tail in paperBids) {
              otherScores.bid = paperBids[value.tail]
            }
            if (value.tail in paperRecommendations) {
              otherScores.recommendation = paperRecommendations[value.tail]
            } else {
              otherScores.recommendation = 0
            }
            papersWithAssignments.add(paperId)
            usersWithAssignments.add(value.tail)
            return {
              groupId: value.tail,
              paperId,
              score: value.weight,
              otherScores,
            }
          })
        })

        const unassignedPapersList = []
        Object.keys(paperIds).forEach((paperId) => {
          if (!papersWithAssignments.has(paperId)) {
            unassignedPapersList.push(paperId)
          }
        })

        const unassignedUsersList = []
        Object.keys(userIds).forEach((user) => {
          if (!usersWithAssignments.has(user)) {
            unassignedUsersList.push(user)
          }
        })
        // #endregion

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
    const paperMap = groupBy(matchLists[0], (match) => match.paperId) ?? {}
    const papersWithoutAssignments = matchLists?.[1] ?? []
    const paperCount = `${Object.keys(paperMap).length + papersWithoutAssignments.length} / ${
      Object.keys(paperMap ?? {}).length
    }`

    const groupMap = groupBy(matchLists[0], (match) => match.groupId)
    const usersWithoutAssignments = matchLists?.[2] ?? []
    const userCount = `${Object.keys(groupMap).length + usersWithoutAssignments.length} / ${
      Object.keys(groupMap ?? {}).length
    }`

    const meanFinalScore =
      matchLists[0].length === 0
        ? '-'
        : (
            Math.round(
              (matchLists[0].map((p) => p.score ?? 0).reduce((a, b) => a + b, 0) * 100) /
                matchLists[0].length
            ) / 100
          ).toFixed(2)

    const meanGroupCountPerPaper =
      Object.values(paperMap).length === 0
        ? '-'
        : (
            Math.round(
              (Object.values(paperMap ?? {})
                .map((p) => p.length)
                .reduce((a, b) => a + b, 0) *
                100) /
                Object.values(paperMap ?? {}).length
            ) / 100
          ).toFixed(2)

    const meanPaperCountPerGroup =
      Object.values(groupMap).length === 0
        ? '-'
        : (
            Math.round(
              (Object.values(groupMap ?? {})
                .map((p) => p.length)
                .reduce((a, b) => a + b, 0) *
                100) /
                Object.values(groupMap ?? {}).length
            ) / 100
          ).toFixed(2)

    let groupCountPerPaperList = Object.entries(paperMap).map(([paperId, matches]) => ({
      num: matches.length,
      data: paperId,
    }))
    const papersWithoutAssignmentsList = papersWithoutAssignments.map((paperId) => ({
      num: 0,
      data: paperId,
    }))
    groupCountPerPaperList = groupCountPerPaperList.concat(papersWithoutAssignmentsList)
    const groupCountPerPaperDataList = groupCountPerPaperList.map((p) => p.num)
    const distributionPapersByUserCount = {
      tag: 'discrete',
      data: groupCountPerPaperDataList,
      name: 'Distribution of Papers by Number of Users',
      min: 0,
      max: groupCountPerPaperDataList
        .filter(Number.isFinite)
        .reduce((a, b) => Math.max(a, b), 0),
      xLabel: 'Number of Users',
      yLabel: 'Number of Papers',
      type: 'paper',
      interactiveData: groupCountPerPaperList,
    }

    let paperCountPerGroupList = Object.entries(groupMap).map(([p, matches]) => ({
      num: matches.length,
      data: p,
    }))
    const usersWithoutAssignmentsList = usersWithoutAssignments.map((p) => ({
      num: 0,
      data: p,
    }))
    paperCountPerGroupList = paperCountPerGroupList.concat(usersWithoutAssignmentsList)
    const paperCountPerGroupDataList = paperCountPerGroupList.map((p) => p.num)
    const distributionUsersByPaperCount = {
      tag: 'discrete',
      data: paperCountPerGroupDataList,
      name: 'Distribution of Users by Number of Papers',
      min: 0,
      max: paperCountPerGroupDataList
        .filter(Number.isFinite)
        .reduce((a, b) => Math.max(a, b), 0),
      xLabel: 'Number of Papers',
      yLabel: 'Number of Users',
      type: 'reviewer',
      interactiveData: paperCountPerGroupList,
    }

    const allScoresList = matchLists[0].map((match) => ({
      num: match.score,
      data: match.paperId,
    }))
    const allScoresDataList = allScoresList.map((p) => p.num)
    const distributionAssignmentByScore = {
      tag: 'continuous',
      data: allScoresDataList,
      name: 'Distribution of Assignments by Scores',
      min: floor(
        allScoresDataList.filter(Number.isFinite).reduce((a, b) => Math.min(a, b), 0),
        1
      ),
      max: ceil(
        1.1 * allScoresDataList.filter(Number.isFinite).reduce((a, b) => Math.max(a, b), 0),
        1
      ),
      binCount: 50,
      xLabel: 'Score',
      yLabel: 'Number of Assignments',
      type: 'paper',
      fullWidth: true,
      interactiveData: allScoresList,
    }

    let meanScorePerPaperList = Object.entries(paperMap).map(([paperId, matches]) => ({
      num:
        matches
          .map((p) => p.score)
          .filter(Number.isFinite)
          .reduce((a, b) => a + b, 0) / matches.length,
      data: paperId,
    }))
    meanScorePerPaperList = meanScorePerPaperList.concat(papersWithoutAssignmentsList)
    const meanScorePerPaperDataList = meanScorePerPaperList.map((p) => p.num)
    const distributionPapersByMeanScore = {
      tag: 'continuous',
      data: meanScorePerPaperDataList,
      name: 'Distribution of Number of Papers by Mean Scores',
      min: 0,
      max:
        1.1 *
        meanScorePerPaperDataList.filter(Number.isFinite).reduce((a, b) => Math.max(a, b), 0),
      binCount: 20,
      xLabel: 'Mean Score',
      yLabel: 'Number of Papers',
      type: 'paper',
      interactiveData: meanScorePerPaperList,
    }

    let meanScorePerGroupList = Object.entries(groupMap).map(([p, matches]) => ({
      num:
        matches
          .map((q) => q.score)
          .filter(Number.isFinite)
          .reduce((a, b) => a + b, 0) / matches.length,
      data: p,
    }))
    meanScorePerGroupList = meanScorePerGroupList.concat(usersWithoutAssignmentsList)
    const meanScorePerGroupDataList = meanScorePerGroupList.map((p) => p.num)
    const distributionUsersByMeanScore = {
      tag: 'continuous',
      data: meanScorePerGroupDataList,
      name: 'Distribution of Number of Users by Mean Scores',
      min: 0,
      max:
        1.1 *
        meanScorePerGroupDataList.filter(Number.isFinite).reduce((a, b) => Math.max(a, b), 0),
      binCount: 20,
      xLabel: 'Mean Score',
      yLabel: 'Number of Users',
      type: 'reviewer',
      interactiveData: meanScorePerGroupList,
    }

    if (showRecommendationDistribution) {
      const recomNumDataPerPaperList = Object.entries(paperMap).map(([paperId, matches]) => ({
        num: matches.filter((p) => p.otherScores.recommendation > 0).length,
        data: paperId,
      }))
      const distributionRecomGroupCountPerPaper = {
        tag: 'discrete',
        data: recomNumDataPerPaperList.map((p) => p.num),
        interactiveData: recomNumDataPerPaperList,
        name: 'Distribution of Number of Recommended Users per Paper',
        min: 0,
        max: recomNumDataPerPaperList
          .map((p) => p.num)
          .filter(Number.isFinite)
          .reduce((a, b) => Math.max(a, b), 0),
        xLabel: 'Number of Users',
        yLabel: 'Number of Papers',
        type: 'paper',
      }

      const recommendationWeights = matchLists[0].map((p) => p.otherScores.recommendation)
      const distributionRecomGroupCountPerWeight = {
        tag: 'discrete',
        data: recommendationWeights,
        name: 'Distribution of Number of Recommendations per value',
        min: 0,
        max: 10,
        xLabel: 'Recommendation value',
        yLabel: 'Number of Recommendations',
        type: 'recommendation',
      }
    }

    const bidValues = [
      ...new Set(matchLists[0].flatMap((p) => p.otherScores.bid ?? [])),
    ].sort()
    const numDataPerGroupDataByBidScore = Object.fromEntries(
      bidValues.map((bidVal) => {
        const numDataPerGroupList = Object.entries(groupMap).map(([p, matches]) => ({
          num: matches.filter((q) => q.otherScores.bid === bidVal).length,
          data: p,
        }))
        return [
          `distributionPaperCountPerGroup-bid-${bidVal
            .toString()
            .replace('.', '_')
            .replace(' ', '_')}`,
          {
            tag: 'discrete',
            data: numDataPerGroupList.map((p) => p.num),
            name: `Distribution of Number of Papers per User with Bid of ${bidVal}`,
            min: 0,
            max: numDataPerGroupList
              .map((p) => p.num)
              .filter(Number.isFinite)
              .reduce((a, b) => Math.max(a, b), 0),
            xLabel: `Number of Papers with Bid = ${bidVal}`,
            yLabel: 'Number of Users',
            type: 'reviewer',
            interactiveData: numDataPerGroupList,
          },
        ]
      })
    )

    setValues({
      paperCount,
      userCount,
      meanFinalScore,
      meanGroupCountPerPaper,
      meanPaperCountPerGroup,
      distributionPapersByUserCount,
      distributionUsersByPaperCount,
      distributionAssignmentByScore,
      distributionPapersByMeanScore,
      distributionUsersByMeanScore,
      ...(showRecommendationDistribution && {
        // eslint-disable-next-line no-undef
        distributionRecomGroupCountPerPaper,
        // eslint-disable-next-line no-undef
        distributionRecomGroupCountPerWeight,
      }),
      ...numDataPerGroupDataByBidScore,
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
          {Object.entries(values)
            .filter(([key, _]) => key.startsWith('distributionPaperCountPerGroup-bid-'))
            // eslint-disable-next-line max-len
            .map(([key, value]) => (
              <HistogramStat
                id={key}
                key={key}
                stats={value}
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
