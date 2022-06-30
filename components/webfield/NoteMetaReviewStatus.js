// modified from noteMetaReviewStatus.hbs handlebar template
// eslint-disable-next-line import/prefer-default-export
export const AuthorConsoleNoteMetaReviewStatus = ({
  note,
  venueId,
  decisionName,
  submissionName,
}) => {
  const isV2Note = note.version === 2
  const decision = isV2Note
    ? note.details.replies.filter((p) =>
        p.invitations.includes(`${venueId}/${submissionName}${note.number}/-/${decisionName}`)
      )?.[0]
    : note.details?.directReplies?.find(
        (p) => p.invitation === `${venueId}/${submissionName}${note.number}/-/${decisionName}`
      )
  const decisionContent = isV2Note
    ? decision?.content?.recommendation?.value
    : decision?.content?.decision
  if (!decision)
    return (
      <h4>
        <strong>No Recommendation</strong>
      </h4>
    )
  return (
    decisionContent && (
      <div>
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
