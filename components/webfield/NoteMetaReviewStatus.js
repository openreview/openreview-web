// modified from noteMetaReviewStatus.hbs handlebar template
export const AuthorConsoleNoteMetaReviewStatus = ({ note }) => {
  const decision = note.details?.directReplies?.find(
    (p) => p.invitation === `${conferenceId}/Paper${note.number}/-/Decision`
  )
  if (!decision)
    return (
      <h4>
        <strong>No Recommendation</strong>
      </h4>
    )
  return (
    decision.content?.decision && (
      <div>
        <h4>AC Recommendation:</h4>
        <p>
          <strong>{decision.content.decision}</strong>
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
