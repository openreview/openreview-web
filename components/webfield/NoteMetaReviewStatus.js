// modified from noteMetaReviewStatus.hbs handlebar template

import { inflect } from '../../lib/utils'

// eslint-disable-next-line import/prefer-default-export
export const AuthorConsoleNoteMetaReviewStatus = ({
  note,
  venueId,
  decisionName,
  submissionName,
}) => {
  const isV2Note = note.version === 2
  const decisionInvitationId = `${venueId}/${submissionName}${note.number}/-/${decisionName}`
  const decisionLookupFn = isV2Note
    ? (p) => p.invitations.includes(decisionInvitationId)
    : (p) => p.invitation === decisionInvitationId
  const decision = note.details?.directReplies?.find(decisionLookupFn)
  const decisionContent = isV2Note
    ? decision?.content?.recommendation?.value
    : decision?.content?.decision
  if (!decision)
    return (
      <>
        {isV2Note && (
          <h4>
            <strong>{note.content?.venue?.value}</strong>
          </h4>
        )}
        <h4>
          <strong>No Recommendation</strong>
        </h4>
      </>
    )
  return (
    decisionContent && (
      <div>
        {isV2Note && (
          <h4>
            <strong>{note.content?.venue?.value}</strong>
          </h4>
        )}
        <h4>Recommendation:</h4>
        <p>
          <strong>{decisionContent}</strong>
        </p>
        <p>
          <a
            href={`/forum?id=${note.forum}&noteId=${decision.id}`}
            target="_blank"
            rel="nofollow noreferrer"
          >
            Read
          </a>
        </p>
      </div>
    )
  )
}

// modified from noteAreaChairs.hbs handlebar template pc console->paper status tab->status column
export const ProgramChairConsolePaperAreaChairProgress = ({ metaReviewData, referrerUrl }) => {
  const { numMetaReviewsDone, areaChairs, metaReviews, seniorAreaChair } = metaReviewData
  return (
    <div className="areachair-progress">
      <h4 className="title">{`${inflect(
        numMetaReviewsDone,
        'Meta Review',
        'Meta Reviews',
        true
      )} Submitted`}</h4>

      <strong>Area Chair:</strong>
      <div>
        {areaChairs.length !== 0 &&
          areaChairs.map((areaChair) => {
            const metaReview = metaReviews.find((p) => p.anonId === areaChair.anonymousId)
            return (
              <div key={areaChair.anonymousId} className="meta-review-info">
                <div className="areachair-contact">
                  <span>
                    {areaChair.preferredName}{' '}
                    <span className="text-muted">&lt;{areaChair.preferredEmail}&gt;</span>
                  </span>
                </div>
                {metaReview && (
                  <div>
                    <span>Recommendation: {metaReview.content.recommendation}</span>
                    <div>
                      <a
                        href={`/forum?id=${metaReview.forum}&noteId=${metaReview.id}&referrer=${referrerUrl}`}
                        target="_blank"
                      >
                        Read Meta Review
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {seniorAreaChair && (
        <>
          <strong>Senior Area Chair:</strong>
          <table class="table table-condensed table-minimal">
            <tbody>
              <tr>
                <td style="width: {{#if tableWidth}}{{tableWidth}}{{else}}320px;{{/if}}">
                  {seniorAreaChair.name}{' '}
                  <span class="text-muted">({seniorAreaChair.email})</span>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
