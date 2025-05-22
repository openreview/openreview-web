'use client'

/* globals promptError: false */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { get, upperFirst } from 'lodash'
import { getEdgeBrowserUrl } from '../../../lib/edge-utils'
import ScalarStat from '../../../components/assignments/ScalarStat'
import HistogramStat from '../../../components/assignments/HistogramStat'
import { getSingularRoleName, prettyId } from '../../../lib/utils'
import { getNoteContentValues } from '../../../lib/forum-utils'
import api from '../../../lib/api-client'
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

export default function Stats({ configNote, accessToken }) {
  const [labelNames, setLabelNames] = useState({})
  const [values, setValues] = useState({})
  const assignmentConfigNoteContent = getNoteContentValues(configNote.content)

  const headName = labelNames.headName ?? 'papers'
  const tailName = labelNames.tailName ?? 'users'
  const upperHeadName = upperFirst(headName)
  const upperTailName = upperFirst(tailName)
  const upperSingularHeadName = getSingularRoleName(upperHeadName)
  const upperSingularTailName = getSingularRoleName(upperTailName)

  const edgeBrowserUrlParams = {
    browseInvitations: Object.keys(assignmentConfigNoteContent.scores_specification ?? {}),
    editInvitation:
      assignmentConfigNoteContent.status === 'Deployed' &&
      assignmentConfigNoteContent.deployed_assignment_invitation
        ? assignmentConfigNoteContent.deployed_assignment_invitation
        : `${assignmentConfigNoteContent.assignment_invitation},label:${encodeURIComponent(
            assignmentConfigNoteContent.title
          )}`,
    conflictsInvitation: assignmentConfigNoteContent.conflicts_invitation,
    customMaxPapersInvitation: assignmentConfigNoteContent.custom_max_papers_invitation,
    customLoadInvitation: assignmentConfigNoteContent.custom_load_invitation,
    aggregateScoreInvitation: assignmentConfigNoteContent.aggregate_score_invitation,
    assignmentLabel: encodeURIComponent(assignmentConfigNoteContent.title),
    referrerText: `${prettyId(assignmentConfigNoteContent.title)} Statistics`,
    apiVersion: 2,
    configNoteId: configNote.id,
  }

  const getValues = async () => {
    try {
      const assignmentInvitationId = configNote.content?.assignment_invitation?.value
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
        setLabelNames({
          headName: headNameInAssignmentInvitation,
          tailName: tailNameInAssignmentInvitation,
        })
      }

      const paperInvitationElements = assignmentConfigNoteContent.paper_invitation.split('&')

      let papersP
      const indexedContentFields = [
        'content.authorids',
        'content.venueid',
        'content.venue',
        'content.user',
      ]
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

      const usersP = api.get(
        '/groups',
        { id: assignmentConfigNoteContent.match_group },
        { accessToken }
      )

      const queryParams =
        assignmentConfigNoteContent.status === 'Deployed' &&
        assignmentConfigNoteContent.deployed_assignment_invitation
          ? {
              invitation: assignmentConfigNoteContent.deployed_assignment_invitation,
              groupBy: 'head',
              select: 'tail,weight',
            }
          : {
              invitation: assignmentConfigNoteContent.assignment_invitation,
              label: assignmentConfigNoteContent.title,
              groupBy: 'head',
              select: 'tail,weight',
            }

      const assignmentsP = api.getAll('/edges', queryParams, {
        accessToken,
        resultsKey: 'groupedEdges',
      })

      const bidInvitation = Object.keys(
        assignmentConfigNoteContent.scores_specification ?? {}
      ).find((p) => p.endsWith('Bid'))

      const bidsP = bidInvitation
        ? api.getAll(
            '/edges',
            { invitation: bidInvitation, groupBy: 'head', select: 'tail,label' },
            { accessToken, resultsKey: 'groupedEdges' }
          )
        : Promise.resolve([])

      const recommendationInvitation = Object.keys(
        assignmentConfigNoteContent.scores_specification ?? {}
      ).find((p) => p.endsWith('Recommendation'))

      const recommendationsP = recommendationInvitation
        ? api.getAll(
            '/edges',
            { invitation: recommendationInvitation, groupBy: 'head', select: 'tail,weight' },
            { accessToken, resultsKey: 'groupedEdges' }
          )
        : Promise.resolve([])

      await Promise.all([papersP, usersP, assignmentsP, bidsP, recommendationsP]).then(
        (results) => {
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

          const { assignmentMap, usersWithAssignments, papersWithAssignments } =
            getAssignmentMap(assignments, bids, recommendations, papers, users)

          const unassignedPapersList = getUnassignedPapersList(papers, papersWithAssignments)
          const unassignedUsersList = getUnassignedUsersList(users, usersWithAssignments)

          const matchLists = [assignmentMap, unassignedPapersList, unassignedUsersList]

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
        }
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    getValues()
  }, [configNote])

  return (
    <>
      <div className="header">
        <h1>{`Assignment Statistics – ${assignmentConfigNoteContent.title}`}</h1>

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
              {assignmentConfigNoteContent && (
                <li>
                  <Link
                    href={getEdgeBrowserUrl(assignmentConfigNoteContent, {
                      version: 2,
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
        {assignmentConfigNoteContent.randomized_fraction_of_opt && (
          <ScalarStat
            value={
              Math.round(assignmentConfigNoteContent.randomized_fraction_of_opt * 100) / 100
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
      ;
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
