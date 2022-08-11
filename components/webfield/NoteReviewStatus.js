// modified from noteReviewStatus.hbs handlebar template

import Link from 'next/link'
import Collapse from '../Collapse'

// modified from noteReviewStatus.hbs handlebar template
// eslint-disable-next-line import/prefer-default-export
export const ReviewerConsoleNoteReviewStatus = ({
  editUrl,
  paperRating,
  review,
  invitationUrl,
}) => (
  <div>
    {editUrl ? (
      <>
        <h4>Your Ratings:</h4>
        <p>{paperRating}</p>
        <h4>Your Review:</h4>
        <p>{review}</p>
        <p>
          <Link href={editUrl}>
            <a>Edit Official Review</a>
          </Link>
        </p>
      </>
    ) : (
      invitationUrl && (
        <h4>
          <Link href={invitationUrl}>
            <a>Submit Official Review</a>
          </Link>
        </h4>
      )
    )}
  </div>
)

// modified from noteReviewers.hbs handlebar template
export const AcConsoleNoteReviewStatus = ({
  reviewers,
  officialReviews,
  enableReviewerReassignment,
}) => {
  return (
    <div className="reviewer-progress">
      <h4>
        {officialReviews.length} of {reviewers.length} Reviews Submitted
      </h4>
      <Collapse showLabel="Show reviewers" hideLabel="Hide reviewers">
        {reviewers.map((reviewer) => {
          return reviewer.reviewerProfileId
        })}
      </Collapse>
    </div>
  )
}
