// modified from noteMetaReviewStatus.hbs handlebar template

import { useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'

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

// modified from noteMetaReviewStatus.hbs handlebar template
// eslint-disable-next-line import/prefer-default-export
export const AreaChairConsoleNoteMetaReviewStatus = ({
  note,
  venueId,
  submissionName,
  officialMetaReviewName,
  metaReviewContentField,
  referrerUrl,
}) => {
  const metaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`
  const metaReview = note.details.directReplies.find(
    (p) => p.invitation === metaReviewInvitationId
  )
  const recommendation = metaReview.content[metaReviewContentField]
  const [metaReviewInvitation, setMetaReviewInvitation] = useState(null)
  const { accessToken } = useUser()

  const editUrl = `/forum?id=${note.forum}&noteId=${metaReview.id}&referrer=${referrerUrl}`

  const loadMetaReviewInvitation = async () => {
    try {
      const result = await api.get(
        '/invitations',
        {
          id: metaReviewInvitationId,
          invitee: true,
          duedate: true,
          replyto: true,
          type: 'notes',
        },
        { accessToken }
      )
      if (result.invitations.length) setMetaReviewInvitation(metaReviewInvitationId)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadMetaReviewInvitation()
  }, [])
  return (
    <>
      {recommendation ? (
        <>
          {
            <>
              <h4>AC Recommendation:</h4>
              <p>
                <strong>{metaReview.content[metaReviewContentField]}</strong>
              </p>
              <p>
                <a href={editUrl} target="_blank">{`Read${
                  metaReviewInvitation ? '/Edit' : ''
                }`}</a>
              </p>
            </>
          }
        </>
      ) : (
        <h4>
          {metaReviewInvitation ? (
            <a
              href={`/forum?id=${note.forum}&noteId=${note.id}&invitationId=${metaReviewInvitation}&referrer=${referrerUrl}`}
              target="_blank"
            >
              Submit
            </a>
          ) : (
            <strong>No Recommendation</strong>
          )}
        </h4>
      )}
    </>
  )
}
