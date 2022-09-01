// modified from noteReviewStatus.hbs handlebar template

import Link from 'next/link'
import { useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import BasicModal from '../BasicModal'
import Collapse from '../Collapse'
import Dropdown, { CreatableDropdown } from '../Dropdown'
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

const AreaChairConsoleReviewerActivityModal = ({ note, reviewer, venueId }) => {
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
          signature: `${venueId}/Paper${note.number}/Reviewer_${reviewer.anonymousId}`,
        },
        { accessToken }
      )
      setActivityNotes(result.notes)
    } catch (error) {
      setError(error)
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
          displayOptions={{ showContents: true, collapse: true }}
        />
      )}
    </BasicModal>
  )
}

// modified from noteReviewers.hbs handlebar template
export const AreaChairConsoleNoteReviewStatus = ({
  rowData,
  venueId,
  officialReviewName,
  referrerUrl,
  enableReviewerReassignment,
  reviewerGroupWithConflict,
  reviewerGroupMembers,
  allProfiles,
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
  const [reviewerReassignmentOptions, setReviewerReassignmentOptions] = useState([])
  const [selectedReviewer, setSelectedReviewer] = useState(null)
  const [reviewerIdWithConflicts, setReviewerIdWithConflicts] = useState([])
  const { accessToken } = useUser()

  const loadReviewerReassignmentOptions = async () => {
    if (!enableReviewerReassignment) return
    const result = await api.get(
      '/edges',
      {
        head: note.id,
        invitation: reviewerGroupWithConflict,
      },
      { accessToken }
    )
    const profileIdWithConflicts = result.edges.map((p) => p.tail)
    console.log('profileIdWithConflicts', profileIdWithConflicts)
    setReviewerIdWithConflicts(profileIdWithConflicts)
    const options = reviewerGroupMembers
      .filter((m) => !profileIdWithConflicts.includes(m))
      .map((p) => {
        const reviewerProfile = allProfiles.find(
          (q) => q.content.names.some((r) => r.username === p) || q.content.emails.includes(p)
        )
        if (reviewerProfile)
          return {
            value: reviewerProfile.id,
            label: `${prettyId(
              reviewerProfile.id
            )}(${reviewerProfile.content.emailsConfirmed.join(',')})`,
          }

        return {
          value: p,
          label: prettyId(p),
        }
      })
    setReviewerReassignmentOptions(options)
  }

  const assignReviewer = async () => {
    const selectedReviewerValue = selectedReviewer?.value
    if (!(selectedReviewerValue?.startsWith('~') || selectedReviewerValue?.includes('@'))) {
      promptError('Please enter a valid email for assigning a reviewer')
      setSelectedReviewer(null)
      return
    }
    const existingReviewer = reviewers.find(
      (p) =>
        p.profile.content.names.some((r) => r.username === selectedReviewerValue) ||
        p.profile.content.emails.includes(selectedReviewerValue)
    )
    if (existingReviewer) {
      promptError(
        `Reviewer ${existingReviewer.preferredName} has already been assigned to Paper ${note.number}`
      )
      setSelectedReviewer(null)
      return
    }
    if (reviewerIdWithConflicts.includes(selectedReviewerValue)) {
      promptError('The reviewer entered is invalid')
      setSelectedReviewer(null)
      return
    }
  }

  const handleShowReviewerActivityClick = (anonymousId) => {
    $(`#reviewer-activity-${anonymousId}`).modal('show')
  }

  return (
    <div className="areachair-console-reviewer-progress">
      <h4>
        {numReviewsDone} of {numReviewersAssigned} Reviews Submitted
      </h4>
      <Collapse
        showLabel="Show reviewers"
        hideLabel="Hide reviewers"
        onExpand={loadReviewerReassignmentOptions}
        className="assigned-reviewers"
      >
        <div>
          {reviewers.map((reviewer) => {
            const completedReview = officialReviews.find(
              (p) => p.anonymousId === reviewer.anonymousId
            )
            const lastReminderSent = localStorage.getItem(
              `https://openreview.net/forum?id=${note.forum}&noteId=${note.id}&invitationId=${venueId}/Paper${note.number}/${officialReviewName}|${reviewer.reviewerProfileId}`
            )
            return (
              <div key={reviewer.reviewerProfileId} className="assigned-reviewer-row">
                <strong>{reviewer.anonymousId}</strong>
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
                      >
                        Read Review
                      </a>
                    </>
                  ) : (
                    <>
                      {enableReviewerReassignment && (
                        <a href="#" className="unassign-reviewer-link">
                          Unassign
                        </a>
                      )}
                      <a href="#" className="send-reminder-link">
                        Send Reminder
                      </a>
                      {lastReminderSent && (
                        <span>
                          Last send:
                          {new Date(parseInt(lastReminderSent)).toLocaleDateString()}
                        </span>
                      )}
                    </>
                  )}
                  {completedReview && (
                    <>
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
                      />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {enableReviewerReassignment && (
          <div className="assign-new-reviewers">
            {/* <Dropdown
              options={reviewerReassignmentOptions}
              className="reviewers-dropdown"
              menuIsOpen
            /> */}
            <CreatableDropdown
              className="dropdown-select reviewers-dropdown"
              classNamePrefix="reviewers-dropdown"
              options={reviewerReassignmentOptions}
              placeholder="reviewer@domain.edu"
              onChange={(e) => setSelectedReviewer(e)}
              value={selectedReviewer}
              hideArrow
              isClearable
            />
            <button
              className="btn btn-xs"
              onClick={assignReviewer}
              disabled={!selectedReviewer}
            >
              Assign
            </button>
          </div>
        )}
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

// modified from noteReviewers.hbs handlebar template
export const AreaChairConsoleNoteReviewStatusold = ({
  note,
  assignedReviewers,
  officialReviews,
  enableReviewerReassignment,
  referrerUrl,
  venueId,
  officialReviewName,
  allProfiles,
  reviewerGroupMembers,
  reviewerGroupWithConflict,
}) => {
  const { accessToken } = useUser()

  const [reviewerReassignmentOptions, setReviewerReassignmentOptions] = useState([])
  const getReviewerName = (reviewerProfile) => {
    const name =
      reviewerProfile.content.names.find((t) => t.preferred) ||
      reviewerProfile.content.names[0]
    return name ? prettyId(reviewerProfile.id) : `${name.first} ${name.last}`
  }

  const loadReviewerReassignmentOptions = async () => {
    if (!enableReviewerReassignment) return
    const result = await api.get(
      '/edges',
      {
        head: note.id,
        invitation: reviewerGroupWithConflict,
      },
      { accessToken }
    )
    const profileIdWithConflicts = result.edges.map((p) => p.tail)
    const options = reviewerGroupMembers
      .filter((m) => !profileIdWithConflicts.includes(m))
      .map((p) => {
        const reviewerProfile = allProfiles.find(
          (q) => q.content.names.some((r) => r.username === p) || q.content.emails.includes(p)
        )
        if (reviewerProfile)
          return {
            value: reviewerProfile.id,
            label: `${prettyId(
              reviewerProfile.id
            )}(${reviewerProfile.content.emailsConfirmed.join(',')})`,
          }

        return {
          value: p,
          label: prettyId(p),
        }
      })
    setReviewerReassignmentOptions(options)
  }

  const ratings = officialReviews.map((p) => p.rating)
  const validRatings = ratings.filter((p) => p !== null)
  const averageRating = validRatings.length
    ? (validRatings.reduce((sum, curr) => sum + curr, 0) / validRatings.length).toFixed(2)
    : 'N/A'
  const minRating = validRatings.length ? Math.min(...validRatings) : 'N/A'
  const maxRating = validRatings.length ? Math.max(...validRatings) : 'N/A'

  const confidences = officialReviews.map((p) => p.confidence)
  const validConfidences = confidences.filter((p) => p !== null)
  const averageConfidence = validConfidences.length
    ? (
        validConfidences.reduce((sum, curr) => sum + curr, 0) / validConfidences.length
      ).toFixed(2)
    : 'N/A'
  const minConfidence = validConfidences.length ? Math.min(...validConfidences) : 'N/A'
  const maxConfidence = validConfidences.length ? Math.max(...validConfidences) : 'N/A'

  return (
    <div className="areachair-console-reviewer-progress">
      <h4>
        {officialReviews.length} of {assignedReviewers.length} Reviews Submitted
      </h4>
      <Collapse
        showLabel="Show reviewers"
        hideLabel="Hide reviewers"
        onExpand={loadReviewerReassignmentOptions}
        className="assigned-reviewers"
      >
        <div>
          {assignedReviewers.map((reviewer) => {
            const completedReview = officialReviews.find(
              (p) => p.anonymousId === reviewer.anonymousId
            )
            const lastReminderSent = localStorage.getItem(
              `https://openreview.net/forum?id=${note.forum}&noteId=${note.id}&invitationId=${venueId}/Paper${note.number}/${officialReviewName}|${reviewer.reviewerProfileId}`
            )
            const reviewerProfile = allProfiles.find(
              (p) =>
                p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
                p.content.emails.includes(reviewer.reviewerProfileId)
            )
            const preferredName = reviewerProfile
              ? getReviewerName(reviewerProfile)
              : reviewer.reviewerProfileId
            const preferredEmail = reviewerProfile
              ? reviewerProfile.content.preferredEmail ?? reviewerProfile.content.emails[0]
              : reviewer.reviewerProfileId
            return (
              <div key={reviewer.reviewerProfileId} className="assigned-reviewer-row">
                <strong>{reviewer.anonymousId}</strong>
                <div className="assigned-reviewer-action">
                  <span>
                    {preferredName}{' '}
                    <span className="text-muted">&lt;{preferredEmail}&gt;</span>
                  </span>
                  {completedReview ? (
                    <>
                      {completedReview.reviewLength && (
                        <span>Review length: {completedReview.reviewLength}</span>
                      )}
                      <a
                        href={`/forum?id=${note.forum}&noteId=${completedReview.id}&referrer=${referrerUrl}`}
                        target="_blank"
                      >
                        Read Review
                      </a>
                    </>
                  ) : (
                    <>
                      {enableReviewerReassignment && (
                        <a href="#" className="unassign-reviewer-link">
                          Unassign
                        </a>
                      )}
                      <a href="#" className="send-reminder-link">
                        Send Reminder
                      </a>
                      {lastReminderSent && (
                        <span>
                          Last send:
                          {new Date(parseInt(lastReminderSent)).toLocaleDateString()}
                        </span>
                      )}
                    </>
                  )}
                  <a href="#" className="show-activity-modal">
                    Show Reviewer Activity
                  </a>
                </div>
              </div>
            )
          })}
        </div>
        {enableReviewerReassignment && (
          <div className="assign-new-reviewers">
            <Dropdown options={reviewerReassignmentOptions} className="reviewers-dropdown" />
            <button className="btn btn-xs">Assign</button>
          </div>
        )}
      </Collapse>
      <span>
        <strong>Average Rating:</strong> {averageRating} (Min: {minRating}, Max: {maxRating})
      </span>
      <span>
        <strong>Average Confidence:</strong> {averageConfidence} (Min: {minConfidence}, Max:{' '}
        {maxConfidence})
      </span>
      <span>
        <strong>Number of Forum replies:</strong> {note.details['replyCount']}
      </span>
    </div>
  )
}
