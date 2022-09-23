/* globals $,promptMessage: false */

// modified from noteReviewStatus.hbs handlebar template
import Link from 'next/link'
import { useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import BasicModal from '../BasicModal'
import Collapse from '../Collapse'
import ErrorAlert from '../ErrorAlert'
import LoadingSpinner from '../LoadingSpinner'
import NoteList from '../NoteList'

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

const AreaChairConsoleReviewerActivityModal = ({
  note,
  reviewer,
  venueId,
  submissionName,
}) => {
  const { accessToken } = useUser()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activityNotes, setActivityNotes] = useState(null)

  const loadReviewerActivity = async () => {
    setIsLoading(true)
    try {
      const result = await api.get(
        '/notes',
        {
          signature: `${venueId}/${submissionName}${note.number}/Reviewer_${reviewer.anonymousId}`,
        },
        { accessToken, version: note.version }
      )
      setActivityNotes(result.notes)
    } catch (apiError) {
      setError(apiError)
    }
    setIsLoading(false)
  }
  return (
    <BasicModal
      id={`reviewer-activity-${reviewer.anonymousId}`}
      title={
        <>
          {`Paper ${note.number} Reviewer ${reviewer.anonymousId} Activity`}
          <div className="reviewer-activity-header">
            <span>
              <strong>Name:</strong> {reviewer.preferredName}
            </span>
            <span>
              <strong>Email:</strong> {reviewer.preferredEmail}
            </span>
          </div>
        </>
      }
      onOpen={loadReviewerActivity}
      options={{ hideFooter: true }}
    >
      {error && <ErrorAlert error={error} />}
      {isLoading && <LoadingSpinner inline={true} text={null} />}
      {activityNotes && (
        <NoteList
          notes={activityNotes}
          displayOptions={{ showContents: true, collapse: true, openNoteInNewWindow: true }}
        />
      )}
    </BasicModal>
  )
}

const AreaChairConsoleReviewerReminderModal = ({
  note,
  reviewer,
  shortPhrase,
  venueId,
  officialReviewName,
  setUpdateLastSent,
  submissionName,
}) => {
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] =
    useState(`This is a reminder to please submit your review for ${shortPhrase}.\n\n
Click on the link below to go to the review page:\n\n{{submit_review_link}}
  \n\nThank you,\n${shortPhrase} Area Chair`)
  const [error, setError] = useState(null)
  const { accessToken } = useUser()

  const sendReminder = async () => {
    try {
      const forumUrl = `https://openreview.net/forum?id=${note.forum}&noteId=${note.id}&invitationId=${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
      await api.post(
        '/messages',
        {
          groups: [reviewer.reviewerProfileId],
          subject,
          message: message.replaceAll('{{submit_review_link}}', forumUrl),
        },
        { accessToken }
      )
      localStorage.setItem(`${forumUrl}|${reviewer.reviewerProfileId}`, Date.now())
      setUpdateLastSent((p) => !p)
      $(`#reviewer-reminder-${reviewer.anonymousId}`).modal('hide')
      promptMessage(`A reminder email has been sent to ${reviewer.preferredName}`, {
        scrollToTop: false,
      })
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  return (
    <BasicModal
      id={`reviewer-reminder-${reviewer.anonymousId}`}
      title="Message"
      primaryButtonText="Send Message"
      onPrimaryButtonClick={sendReminder}
      onClose={() => {}}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      <p>
        {`You may customize the message that will be sent to the reviewer. In the email body,
          the text {{ submit_review_link }} will be replaced with a hyperlink to the form where
          the reviewer can fill out his or her review.`}
      </p>
      <div className="form-group">
        <label htmlFor="reviewer">Reviewer</label>
        <input
          type="text"
          name="reviewer"
          className="form-control"
          value={reviewer.preferredName}
          disabled
        />
        <label htmlFor="subject">Email Subject</label>
        <input
          type="text"
          name="subject"
          className="form-control"
          value={subject}
          required
          onChange={(e) => setSubject(e.target.value)}
        />
        <label htmlFor="message">Email Body</label>
        <textarea
          name="message"
          className="form-control message-body"
          rows="6"
          value={message}
          required
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
    </BasicModal>
  )
}

const AreaChairConsoleReviewerStatusRow = ({
  officialReviews,
  reviewer,
  note,
  venueId,
  officialReviewName,
  referrerUrl,
  shortPhrase,
  submissionName,
}) => {
  const [updateLastSent, setUpdateLastSent] = useState(true)
  const completedReview = officialReviews.find((p) => p.anonymousId === reviewer.anonymousId)
  const lastReminderSent = localStorage.getItem(
    `https://openreview.net/forum?id=${note.forum}&noteId=${note.id}&invitationId=${venueId}/${submissionName}${note.number}/-/${officialReviewName}|${reviewer.reviewerProfileId}`
  )
  const handleShowReviewerActivityClick = (anonymousId) => {
    $(`#reviewer-activity-${anonymousId}`).modal('show')
  }
  const handleSendReminder = (anonymousId) => {
    $(`#reviewer-reminder-${anonymousId}`).modal('show')
  }
  return (
    <div key={reviewer.reviewerProfileId} className="assigned-reviewer-row">
      <strong className="assigned-reviewer-id">{reviewer.anonymousId}</strong>
      <div className="assigned-reviewer-action">
        <span>
          {reviewer.preferredName}{' '}
          <span className="text-muted">&lt;{reviewer.preferredEmail}&gt;</span>
        </span>
        {completedReview ? (
          <>
            {completedReview.reviewLength && (
              <span>Review length: {completedReview.reviewLength}</span>
            )}
            <a
              href={`/forum?id=${note.forum}&noteId=${completedReview.id}&referrer=${referrerUrl}`}
              target="_blank"
              rel="nofollow noreferrer"
            >
              Read Review
            </a>
          </>
        ) : (
          <div>
            <AreaChairConsoleReviewerReminderModal
              note={note}
              reviewer={reviewer}
              shortPhrase={shortPhrase}
              venueId={venueId}
              officialReviewName={officialReviewName}
              setUpdateLastSent={setUpdateLastSent}
              submissionName={submissionName}
            />
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              href="#"
              className="send-reminder-link"
              onClick={(e) => {
                e.preventDefault()
                handleSendReminder(reviewer.anonymousId)
              }}
            >
              Send Reminder
            </a>
            {lastReminderSent && (
              <span>
                (Last sent:
                {new Date(parseInt(lastReminderSent, 10)).toLocaleDateString()})
              </span>
            )}
          </div>
        )}
        {completedReview && (
          <>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              href="#"
              className="show-activity-modal"
              onClick={(e) => {
                e.preventDefault()
                handleShowReviewerActivityClick(reviewer.anonymousId)
              }}
            >
              Show Reviewer Activity
            </a>
            <AreaChairConsoleReviewerActivityModal
              note={note}
              reviewer={reviewer}
              venueId={venueId}
              submissionName={submissionName}
            />
          </>
        )}
      </div>
    </div>
  )
}

// modified from noteReviewers.hbs handlebar template
export const AreaChairConsoleNoteReviewStatus = ({
  rowData,
  venueId,
  officialReviewName,
  referrerUrl,
  shortPhrase,
  submissionName,
}) => {
  const { officialReviews, reviewers, note } = rowData
  const {
    numReviewsDone,
    numReviewersAssigned,
    replyCount,
    ratingMax,
    ratingMin,
    ratingAvg,
    confidenceMax,
    confidenceMin,
    confidenceAvg,
  } = rowData.reviewProgressData

  return (
    <div className="areachair-console-reviewer-progress">
      <h4>
        {numReviewsDone} of {numReviewersAssigned} Reviews Submitted
      </h4>
      <Collapse
        showLabel="Show reviewers"
        hideLabel="Hide reviewers"
        className="assigned-reviewers"
      >
        <div>
          {reviewers.map((reviewer) => (
            <AreaChairConsoleReviewerStatusRow
              key={reviewer.anonymousId}
              officialReviews={officialReviews}
              reviewer={reviewer}
              note={note}
              venueId={venueId}
              officialReviewName={officialReviewName}
              referrerUrl={referrerUrl}
              shortPhrase={shortPhrase}
              submissionName={submissionName}
            />
          ))}
        </div>
      </Collapse>
      <span>
        <strong>Average Rating:</strong> {ratingAvg} (Min: {ratingMin}, Max: {ratingMax})
      </span>
      <span>
        <strong>Average Confidence:</strong> {confidenceAvg} (Min: {confidenceMin}, Max:{' '}
        {confidenceMax})
      </span>
      <span>
        <strong>Number of Forum replies:</strong> {replyCount}
      </span>
    </div>
  )
}
