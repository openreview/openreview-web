/* globals $,promptMessage,promptError: false */

// modified from noteReviewStatus.hbs handlebar template
import Link from 'next/link'
import React, { useContext, useState } from 'react'
import upperFirst from 'lodash/upperFirst'
import copy from 'copy-to-clipboard'
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from 'dayjs'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import BasicModal from '../BasicModal'
import Collapse from '../Collapse'
import ErrorAlert from '../ErrorAlert'
import LoadingSpinner from '../LoadingSpinner'
import NoteList from '../NoteList'
import WebFieldContext from '../WebFieldContext'
import { pluralizeString, prettyField, prettyId, prettyInvitationId } from '../../lib/utils'
import { getProfileLink } from '../../lib/webfield-utils'

dayjs.extend(relativeTime)

// modified from noteReviewStatus.hbs handlebar template
export const ReviewerConsoleNoteReviewStatus = ({
  editUrl,
  paperRatings,
  officialReview,
  invitationUrl,
  reviewDisplayFields,
  officialReviewName = 'Official_Review',
}) => (
  <div>
    {editUrl ? (
      <>
        {paperRatings.map((rating, index) => {
          const ratingName = Object.keys(rating)[0]
          const ratingValue = rating[ratingName]
          return (
            <div key={index}>
              <h4>{upperFirst(ratingName)}:</h4>
              <p>{ratingValue}</p>
            </div>
          )
        })}
        {reviewDisplayFields.map((reviewDisplayField, index) => {
          const displayFieldValue = officialReview?.content?.[reviewDisplayField]?.value
          if (!displayFieldValue) return null
          return (
            <div key={index}>
              <h4>Your {prettyField(reviewDisplayField)}:</h4>
              <p>{displayFieldValue}</p>
            </div>
          )
        })}
        <p>
          <Link href={editUrl}>Edit {prettyField(officialReviewName)}</Link>
        </p>
      </>
    ) : (
      invitationUrl && (
        <h4>
          <Link href={invitationUrl}>Submit {prettyField(officialReviewName)}</Link>
        </h4>
      )
    )}
  </div>
)

const AcPcConsoleReviewerActivityModal = ({
  note,
  reviewer,
  venueId,
  submissionName,
  reviewerName,
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
          signature: reviewer.reviewerProfileId,
          transitiveMembers: true,
          invitation: `${venueId}/${submissionName}${note.number}/-/.*`,
          domain: venueId,
        },
        { accessToken }
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
          {`${prettyField(submissionName)} ${note.number} ${prettyField(reviewerName)} ${
            reviewer.anonymousId
          } Activity`}
          <div className="reviewer-activity-header">
            <span>
              <strong>Name:</strong> {reviewer.preferredName}
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

const AcPcConsoleReviewerReminderModal = ({
  note,
  reviewer,
  shortPhrase,
  venueId,
  officialReviewName,
  reviewerName,
  setUpdateLastSent,
  submissionName,
  messageSignature,
}) => {
  const { emailReplyTo, messageSubmissionReviewersInvitationId } = useContext(WebFieldContext)
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] =
    useState(`This is a reminder to please submit your ${prettyField(
      officialReviewName
    ).toLowerCase()} for ${shortPhrase}.\n\n
Click on the link below to go to the ${prettyField(
      officialReviewName
    ).toLowerCase()} page:\n\n{{submit_review_link}}
  \n\nThank you,\n${shortPhrase}`)
  const [error, setError] = useState(null)
  const { accessToken } = useUser()

  const sendReminder = async () => {
    try {
      const forumUrl = `https://openreview.net/forum?id=${note.forum}&noteId=${note.id}&invitationId=${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
      await api.post(
        '/messages',
        {
          invitation:
            messageSubmissionReviewersInvitationId &&
            messageSubmissionReviewersInvitationId.replace('{number}', note.number),
          signature: messageSubmissionReviewersInvitationId && messageSignature,
          groups: [reviewer.anonymizedGroup],
          subject,
          message: message.replaceAll('{{submit_review_link}}', forumUrl),
          parentGroup: `${venueId}/${submissionName}${note.number}/${reviewerName}`,
          replyTo: emailReplyTo,
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
        {`You may customize the message that will be sent to the ${prettyField(
          reviewerName
        ).toLowerCase()}. In the email body,
          the text {{ submit_review_link }} will be replaced with a hyperlink to the form where
          the ${prettyField(reviewerName).toLowerCase()} can fill out his or her ${prettyField(
            officialReviewName
          ).toLowerCase()}.`}
      </p>
      <div className="form-group">
        <label htmlFor="reviewer">{prettyField(reviewerName)}</label>
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

export const AcPcConsoleReviewerStatusRow = ({
  officialReviews,
  reviewer,
  note,
  venueId,
  officialReviewName,
  reviewerName,
  referrerUrl,
  shortPhrase,
  submissionName,
  reviewRatingName,
  showRatingConfidence = true,
  showActivity = true,
  messageSignature,
  preferredEmailInvitationId,
}) => {
  const [updateLastSent, setUpdateLastSent] = useState(true)
  const completedReview = officialReviews.find((p) => p.anonymousId === reviewer.anonymousId)
  const hasConfidence = completedReview?.confidence !== null
  const lastReminderSent = localStorage.getItem(
    `https://openreview.net/forum?id=${note.forum}&noteId=${note.id}&invitationId=${venueId}/${submissionName}${note.number}/-/${officialReviewName}|${reviewer.reviewerProfileId}`
  )
  const handleShowReviewerActivityClick = (anonymousId) => {
    $(`#reviewer-activity-${anonymousId}`).modal('show')
  }
  const handleSendReminder = (anonymousId) => {
    $(`#reviewer-reminder-${anonymousId}`).modal('show')
  }
  const getReviewerEmail = async () => {
    if (!preferredEmailInvitationId) {
      promptError('Email is not available.', { scrollToTop: false })
      return
    }
    try {
      const result = await api.get(`/edges`, {
        invitation: preferredEmailInvitationId,
        head: reviewer.reviewerProfileId,
      })
      const email = result.edges?.[0]?.tail
      if (!email) throw new Error('Email is not available.')
      copy(`${reviewer.preferredName} <${email}>`)
      promptMessage(`${email} copied to clipboard`, { scrollToTop: false })
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
  }
  return (
    <div key={reviewer.reviewerProfileId} className="assigned-reviewer-row">
      <strong className="assigned-reviewer-id">{reviewer.anonymousId}</strong>
      <div className="assigned-reviewer-action">
        <span>
          <a
            href={getProfileLink(reviewer.reviewerProfileId)}
            target="_blank"
            rel="noreferrer"
          >
            {reviewer.preferredName}
          </a>
          <div>{reviewer.profile?.title}</div>
          {preferredEmailInvitationId && (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a
              href="#"
              className="text-muted"
              onClick={(e) => {
                e.preventDefault()
                getReviewerEmail()
              }}
            >
              Copy Email
            </a>
          )}
        </span>
        {completedReview ? (
          <>
            {showRatingConfidence && (
              <div>
                {(Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName])
                  .flatMap((ratingName, index) => {
                    let ratingValue
                    let ratingDisplayName
                    if (typeof ratingName === 'object') {
                      ratingDisplayName = Object.keys(ratingName)[0]
                      ratingValue = completedReview[ratingDisplayName]
                    } else {
                      ratingDisplayName = ratingName
                      ratingValue = completedReview[ratingName]
                    }
                    if (ratingValue !== null)
                      return `${prettyField(ratingDisplayName)}: ${ratingValue}`
                    return []
                  })
                  .join(' / ')}
                {hasConfidence && ` / Confidence: ${completedReview.confidence}`}
              </div>
            )}
            {completedReview.reviewLength && (
              <span>
                {prettyField(officialReviewName)} length: {completedReview.reviewLength}
              </span>
            )}
            <a
              href={`/forum?id=${note.forum}&noteId=${completedReview.id}&referrer=${referrerUrl}`}
              target="_blank"
              rel="nofollow noreferrer"
            >
              Read {prettyField(officialReviewName)}
            </a>
          </>
        ) : (
          <div>
            <AcPcConsoleReviewerReminderModal
              note={note}
              reviewer={reviewer}
              shortPhrase={shortPhrase}
              venueId={venueId}
              officialReviewName={officialReviewName}
              reviewerName={reviewerName}
              setUpdateLastSent={setUpdateLastSent}
              submissionName={submissionName}
              messageSignature={messageSignature}
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
        {completedReview && showActivity && (
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
              Show {prettyField(reviewerName)} Activity
            </a>
            <AcPcConsoleReviewerActivityModal
              note={note}
              reviewer={reviewer}
              venueId={venueId}
              submissionName={submissionName}
              reviewerName={reviewerName}
            />
          </>
        )}
      </div>
    </div>
  )
}

// reviewers info might not be visible so only show info of reviews
export const AcPcConsoleReviewStatusRow = ({
  review,
  note,
  referrerUrl,
  reviewRatingName,
  officialReviewName,
  showRatingConfidence = true,
}) => {
  const hasConfidence = review?.confidence !== null

  return (
    <div className="review-row">
      {showRatingConfidence && (
        <div>
          {(Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName])
            .flatMap((ratingName, index) => {
              let ratingValue
              let ratingDisplayName
              if (typeof ratingName === 'object') {
                ratingDisplayName = Object.keys(ratingName)[0]
                ratingValue = Object.values(ratingName)[0]
                  .map((p) => review[p])
                  .find((q) => q !== undefined)
              } else {
                ratingDisplayName = ratingName
                ratingValue = review[ratingName]
              }
              if (ratingValue !== null)
                return `${prettyField(ratingDisplayName)}: ${ratingValue}`
              return []
            })
            .join(' / ')}
          {hasConfidence && ` / Confidence: ${review.confidence}`}
        </div>
      )}
      {review.reviewLength && (
        <span>
          {prettyField(officialReviewName)} length: {review.reviewLength}
        </span>
      )}
      <a
        href={`/forum?id=${note.forum}&noteId=${review.id}&referrer=${referrerUrl}`}
        target="_blank"
        rel="nofollow noreferrer"
      >
        Read {prettyField(officialReviewName)}
      </a>
    </div>
  )
}

// modified from noteReviewers.hbs handlebar template
// shared by AC and PC console
export const AcPcConsoleNoteReviewStatus = ({
  rowData,
  venueId,
  officialReviewName,
  referrerUrl,
  shortPhrase,
  submissionName,
  reviewerAssignmentUrl,
}) => {
  const { officialReviews, reviewers = [], note } = rowData
  const {
    reviewRatingName,
    reviewerName = 'Reviewers',
    preferredEmailInvitationId,
  } = useContext(WebFieldContext)
  const {
    numReviewsDone,
    numReviewersAssigned,
    replyCount,
    ratings,
    confidenceMax,
    confidenceMin,
    confidenceAvg,
  } = rowData.reviewProgressData
  const paperManualReviewerAssignmentUrl = reviewerAssignmentUrl?.replace(
    'edges/browse?',
    `edges/browse?start=staticList,type:head,ids:${note.id}&`
  )

  // reviewers group not visible
  if (reviewers.length === 0 && numReviewsDone > 0)
    return (
      <div className="console-reviewer-progress">
        <h4>
          {numReviewsDone} {pluralizeString(prettyField(officialReviewName))} Submitted
        </h4>
        <Collapse
          showLabel={`Show ${prettyField(reviewerName)}`}
          hideLabel={`Hide ${prettyField(reviewerName)}`}
          className="assigned-reviewers"
        >
          {officialReviews.map((review) => (
            <AcPcConsoleReviewStatusRow
              key={review.id}
              review={review}
              note={note}
              referrerUrl={referrerUrl}
              reviewRatingName={reviewRatingName}
              officialReviewName={officialReviewName}
            />
          ))}
        </Collapse>
        {(Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
          (ratingName, index) => {
            const { ratingAvg, ratingMin, ratingMax } = ratings[ratingName]
            return (
              <span key={index}>
                <strong>Average {prettyField(ratingName)}:</strong> {ratingAvg} (Min:{' '}
                {ratingMin}, Max: {ratingMax})
              </span>
            )
          }
        )}
        <span>
          <strong>Average Confidence:</strong> {confidenceAvg} (Min: {confidenceMin}, Max:{' '}
          {confidenceMax})
        </span>
        <span>
          <strong>Number of Forum replies:</strong> {replyCount}
        </span>
        {paperManualReviewerAssignmentUrl && (
          <div className="mt-3">
            <a
              href={`${paperManualReviewerAssignmentUrl}&referrer=${referrerUrl}`}
              target="_blank"
              rel="noreferrer"
            >
              Edit {prettyField(reviewerName)} Assignments
            </a>
          </div>
        )}
      </div>
    )

  return (
    <div className="console-reviewer-progress">
      <h4>
        {numReviewsDone} of {numReviewersAssigned}{' '}
        {pluralizeString(prettyField(officialReviewName))} Submitted
      </h4>
      {reviewers.length > 0 && (
        <Collapse
          showLabel={`Show ${prettyField(reviewerName)}`}
          hideLabel={`Hide ${prettyField(reviewerName)}`}
          className="assigned-reviewers"
        >
          <div>
            {reviewers.map((reviewer) => (
              <AcPcConsoleReviewerStatusRow
                key={reviewer.anonymousId}
                officialReviews={officialReviews}
                reviewer={reviewer}
                note={note}
                venueId={venueId}
                officialReviewName={officialReviewName}
                reviewerName={reviewerName}
                referrerUrl={referrerUrl}
                shortPhrase={shortPhrase}
                submissionName={submissionName}
                reviewRatingName={reviewRatingName}
                messageSignature={rowData.messageSignature}
                preferredEmailInvitationId={preferredEmailInvitationId}
              />
            ))}
          </div>
        </Collapse>
      )}
      {(Array.isArray(reviewRatingName)
        ? reviewRatingName.map((p) => (typeof p === 'object' ? Object.keys(p)[0] : p))
        : [reviewRatingName]
      ).map((ratingName, index) => {
        const { ratingAvg, ratingMin, ratingMax } = ratings[ratingName]
        return (
          <span key={index}>
            <strong>Average {prettyField(ratingName)}:</strong> {ratingAvg} (Min: {ratingMin},
            Max: {ratingMax})
          </span>
        )
      })}
      <span>
        <strong>Average Confidence:</strong> {confidenceAvg} (Min: {confidenceMin}, Max:{' '}
        {confidenceMax})
      </span>
      <span>
        <strong>Number of Forum replies:</strong> {replyCount}
      </span>
      {paperManualReviewerAssignmentUrl && (
        <div className="mt-3">
          <a
            href={`${paperManualReviewerAssignmentUrl}&referrer=${referrerUrl}`}
            target="_blank"
            rel="noreferrer"
          >
            Edit {prettyField(reviewerName)} Assignments
          </a>
        </div>
      )}
    </div>
  )
}

export const EthicsReviewStatus = ({
  rowData,
  venueId,
  ethicsReviewersName,
  ethicsReviewName,
  ethicsChairsName,
  referrerUrl,
  shortPhrase,
  submissionName,
  preferredEmailInvitationId,
}) => {
  const {
    ethicsReviews,
    ethicsReviewers,
    note,
    numReviewsDone,
    numReviewersAssigned,
    replyCount,
  } = rowData

  const ethicsReviewersId = `${venueId}/${ethicsReviewersName}`
  const editAssigmentUrl = `/edges/browse?start=staticList,type:head,ids:${note.id}
&traverse=${ethicsReviewersId}/-/Assignment
&edit=${ethicsReviewersId}/-/Assignment
&browse=${ethicsReviewersId}/-/Affinity_Score;${ethicsReviewersId}/-/Conflict&version=2`

  return (
    <div className="console-reviewer-progress">
      <h4>
        {numReviewsDone} of {numReviewersAssigned} Reviews Submitted
      </h4>
      {ethicsReviewers.length > 0 && (
        <Collapse
          showLabel="Show reviewers"
          hideLabel="Hide reviewers"
          className="assigned-reviewers"
        >
          <div>
            {ethicsReviewers.map((ethicsReviewer) => (
              <AcPcConsoleReviewerStatusRow
                key={ethicsReviewer.anonymousId}
                officialReviews={ethicsReviews}
                reviewer={ethicsReviewer}
                note={note}
                venueId={venueId}
                officialReviewName={ethicsReviewName}
                reviewerName={ethicsReviewersName}
                referrerUrl={referrerUrl}
                shortPhrase={shortPhrase}
                submissionName={submissionName}
                showRatingConfidence={false}
                showActivity={false}
                preferredEmailInvitationId={preferredEmailInvitationId}
              />
            ))}
          </div>
        </Collapse>
      )}

      <span>
        <strong>Number of Forum replies:</strong> {replyCount}
      </span>
      <div className="mt-3">
        <a
          href={`${editAssigmentUrl}&referrer=${referrerUrl}`}
          target="_blank"
          rel="noreferrer"
        >
          Edit Assignments
        </a>
      </div>
    </div>
  )
}

export const LatestReplies = ({ rowData, referrerUrl }) => {
  const { note, displayReplies } = rowData
  return displayReplies?.map((reply) => {
    if (!reply.id) return null
    const { id, invitationId, date, values, signature } = reply
    return (
      <div key={id}>
        <strong>
          <a
            href={`/forum?id=${note.id}&noteId=${id}&referrer=${referrerUrl}`}
            target="_blank"
            rel="noreferrer"
          >
            {prettyInvitationId(invitationId)}
          </a>
        </strong>{' '}
        {signature && `by ${prettyId(signature, true)}`} {date && ` ${dayjs(date).fromNow()}`}
        {values.map((value) => {
          if (!value.value) return null
          return (
            <div key={value.field} className="mb-2 note-content">
              <strong className="mr-1">{prettyField(value.field)}:</strong>
              <span>{value.value}</span>
            </div>
          )
        })}
      </div>
    )
  })
}
