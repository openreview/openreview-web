'use client'

import Link from 'next/link'
import { use } from 'react'
import { getEdgeBrowserUrl } from '../../../lib/edge-utils'
import ScalarStat from '../../../components/assignments/ScalarStat'
import HistogramStat from '../../../components/assignments/HistogramStat'
import { prettyId } from '../../../lib/utils'

export default function Stats({ valuesP, assignmentConfigNoteContent, names, configNoteId }) {
  const { values, errorMessage } = use(valuesP)
  if (errorMessage) throw new Error(errorMessage)

  const {
    headName,
    tailName,
    upperHeadName,
    upperTailName,
    upperSingularHeadName,
    upperSingularTailName,
  } = names
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
    configNoteId,
  }
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
