'use client'

/* globals promptError: false */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { upperFirst } from 'lodash'
import { getEdgeBrowserUrl } from '../../../lib/edge-utils'
import ScalarStat from '../../../components/assignments/ScalarStat'
import HistogramStat from '../../../components/assignments/HistogramStat'
import { getSingularRoleName, prettyId } from '../../../lib/utils'
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
import api from '../../../lib/api-client'

export default function V1Stats({ configNote, accessToken }) {
  const [assignmentConfigNote, setAssignmentConfigNote] = useState(configNote)
  const [values, setValues] = useState({})
  const [matchLists, setMatchLists] = useState(null)

  const headName = 'papers'
  const tailName = 'users'
  const upperHeadName = upperFirst(headName)
  const upperTailName = upperFirst(tailName)
  const upperSingularHeadName = getSingularRoleName(upperHeadName)
  const upperSingularTailName = getSingularRoleName(upperTailName)

  const configNoteContent = assignmentConfigNote.content
  const edgeBrowserUrlParams = {
    browseInvitations: Object.keys(configNoteContent.scores_specification ?? {}),
    editInvitation:
      configNoteContent.status === 'Deployed' &&
      configNoteContent.deployed_assignment_invitation
        ? configNoteContent.deployed_assignment_invitation
        : `${configNoteContent.assignment_invitation},label:${encodeURIComponent(
            configNoteContent.title
          )}`,
    conflictsInvitation: configNoteContent.conflicts_invitation,
    customMaxPapersInvitation: configNoteContent.custom_max_papers_invitation,
    customLoadInvitation: configNoteContent.custom_load_invitation,
    aggregateScoreInvitation: configNoteContent.aggregate_score_invitation,
    assignmentLabel: encodeURIComponent(configNoteContent.title),
    referrerText: `${prettyId(configNoteContent.title)} Statistics`,
    apiVersion: 1,
    configNoteId: assignmentConfigNote.id,
  }

  const indexedContentFields = [
    'content.authorids',
    'content.venueid',
    'content.venue',
    'content.user',
  ]

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

  const loadMatchingDataFromEdges = async () => {
    const { content: noteContent } = assignmentConfigNote
    const paperInvitationElements = noteContent.paper_invitation.split('&')

    let papersP = Promise.resolve([])
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
      papersP = api.getAll('/notes', getNotesArgs, { accessToken, version: 1 })
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

  useEffect(() => {
    if (assignmentConfigNote.content.scores_specification) {
      loadMatchingDataFromEdges()
    } else {
      loadMatchingDataFromNotes()
    }
  }, [assignmentConfigNote])

  useEffect(() => {
    if (!matchLists) return

    const showRecommendationDistribution =
      matchLists[0]
        .map((p) => p?.otherScores?.recommendation)
        .filter(Number.isFinite)
        .reduce((a, b) => a + b, 0) > 0

    setValues({
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
    })
  }, [matchLists])

  return (
    <>
      <div className="header">
        <h1>{`Assignment Statistics – ${assignmentConfigNote.content.title}`}</h1>

        <div className="action-dropdown text-right">
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-default dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Actions <span className="caret" />
            </button>
            <ul className="dropdown-menu dropdown-align-right">
              {assignmentConfigNote && (
                <li>
                  <Link
                    href={getEdgeBrowserUrl(assignmentConfigNote.content, {
                      version: 1,
                    })}
                  >
                    Browse Assignments
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div className="basic-stats">
        <ScalarStat
          value={values.paperCount}
          name={`Number of ${headName} / Number of ${headName} with assignments`}
        />
        <ScalarStat
          value={values.userCount}
          name={`Number of ${tailName} / Number of ${tailName} with assignments`}
        />
        <ScalarStat value={values.meanFinalScore} name="Mean Final Score" />
        <ScalarStat
          value={values.meanGroupCountPerPaper}
          name={`Mean Number of ${upperTailName} per ${upperSingularHeadName}`}
        />
        <ScalarStat
          value={values.meanPaperCountPerGroup}
          name={`Mean Number of ${upperHeadName} per ${upperSingularTailName}`}
        />
        {assignmentConfigNote?.content.randomized_fraction_of_opt && (
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
      {values.distributionRecomGroupCountPerPaper && (
        <div>
          <h3 className="section-header">Recommendation Distributions</h3>
          <div className="dist-stats">
            <HistogramStat
              id="distributionRecomGroupCountPerPaper"
              stats={values.distributionRecomGroupCountPerPaper}
              edgeBrowserUrlParams={edgeBrowserUrlParams}
            />
            <HistogramStat
              id="distributionRecomGroupCountPerWeight"
              stats={values.distributionRecomGroupCountPerWeight}
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
