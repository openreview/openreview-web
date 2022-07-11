// modified from noteReviewStatus.hbs handlebar template
// eslint-disable-next-line import/prefer-default-export
export const ReviewerConsoleNoteReviewStatus = ({
  editUrl,
  paperRating,
  review,
  invitationUrl,
}) => {
  return (
    <div>
      {editUrl ? (
        <>
          <h4>Your Ratings:</h4>
          <p>{paperRating}</p>
          <h4>Your Review:</h4>
          <p>{review}</p>
          <p>
            <a href={editUrl} target="_blank">
              Edit Official Review
            </a>
          </p>
        </>
      ) : (
        invitationUrl && (
          <h4>
            <a href={invitationUrl} target="_blank">
              Submit Official Review
            </a>
          </h4>
        )
      )}
    </div>
  )
}
