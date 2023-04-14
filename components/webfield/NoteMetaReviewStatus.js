/* globals promptError: false */

// modified from noteMetaReviewStatus.hbs handlebar template
import { useContext, useEffect, useState } from 'react'
import { inflect } from '../../lib/utils'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import WebFieldContext from '../WebFieldContext'
import { getNoteContent } from '../../lib/webfield-utils'

const IEEECopyrightForm = ({ note, isV2Note }) => {
  const { showIEEECopyright, IEEEPublicationTitle, IEEEArtSourceCode } =
    useContext(WebFieldContext)
  const { user } = useUser()
  const noteContent = getNoteContent(note, isV2Note)

  if (showIEEECopyright && IEEEPublicationTitle && IEEEArtSourceCode) {
    return (
      <form action="https://ecopyright.ieee.org/ECTT/IntroPage.jsp" method="post">
        <input type="hidden" name="PubTitle" value={IEEEPublicationTitle} />
        <input type="hidden" name="ArtTitle" value={noteContent.title} />
        <input type="hidden" name="AuthName" value={noteContent.authors.join(' and ')} />
        <input type="hidden" name="ArtId" value={note.id} />
        <input type="hidden" name="ArtSource" value={IEEEArtSourceCode} />
        <input type="hidden" name="AuthEmail" value={user.profile.preferredEmail} />
        <input type="hidden" name="rtrnurl" value={window.location.href} />
        <input
          name="Submit"
          type="submit"
          value="Copyright Submission"
          className="btn btn-sm"
        />
      </form>
    )
  }
  return null
}

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
  const isAcceptedPaper = isV2Note
    ? note.content?.venue?.value?.toLowerCase()?.includes('accept')
    : decisionContent?.toLowerCase()?.includes('accept')

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
        {isAcceptedPaper && <IEEECopyrightForm note={note} isV2Note={isV2Note} />}
      </>
    )

  return (
    <>
      {decisionContent ? (
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
      ) : null}
      {isAcceptedPaper && <IEEECopyrightForm note={note} isV2Note={isV2Note} />}
    </>
  )
}

// modified from noteMetaReviewStatus.hbs handlebar template
// eslint-disable-next-line import/prefer-default-export
export const AreaChairConsoleNoteMetaReviewStatus = ({
  note,
  metaReviewData,
  metaReviewContentField,
  referrerUrl,
}) => {
  const [metaReviewInvitation, setMetaReviewInvitation] = useState(null)
  const { accessToken } = useUser()

  const editUrl = `/forum?id=${note.forum}&noteId=${metaReviewData.metaReview?.id}&referrer=${referrerUrl}`

  const loadMetaReviewInvitation = async () => {
    try {
      const result = await api.get(
        '/invitations',
        {
          id: metaReviewData.metaReviewInvitationId,
          invitee: true,
          duedate: true,
          replyto: true,
          type: 'notes',
        },
        { accessToken }
      )
      if (result.invitations.length)
        setMetaReviewInvitation(metaReviewData.metaReviewInvitationId)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadMetaReviewInvitation()
  }, [])
  return (
    <div className="areachair-console-meta-review">
      {metaReviewData[metaReviewContentField] ? (
        <>
          <h4 className="title">AC Recommendation:</h4>
          <p>
            <strong>{metaReviewData[metaReviewContentField]}</strong>
          </p>
          <p>
            <a href={editUrl} target="_blank" rel="nofollow noreferrer">{`Read${
              metaReviewInvitation ? '/Edit' : ''
            }`}</a>
          </p>
        </>
      ) : (
        <h4>
          {metaReviewInvitation ? (
            <a
              href={`/forum?id=${note.forum}&noteId=${note.id}&invitationId=${metaReviewData.metaReviewInvitation}&referrer=${referrerUrl}`}
              target="_blank"
              rel="nofollow noreferrer"
            >
              Submit
            </a>
          ) : (
            <strong>{`No ${metaReviewContentField}`}</strong>
          )}
        </h4>
      )}
    </div>
  )
}

// modified from noteAreaChairs.hbs handlebar template pc console->paper status tab->status column
export const ProgramChairConsolePaperAreaChairProgress = ({
  metaReviewData,
  referrerUrl,
  isV2Console,
  manualAreaChairAssignmentUrl,
}) => {
  const { numMetaReviewsDone, areaChairs, metaReviews, seniorAreaChairs } = metaReviewData
  const paperManualAreaChairAssignmentUrl = manualAreaChairAssignmentUrl?.replace(
    'edges/browse?',
    `edges/browse?start=staticList,type:head,ids:${note.id}&`
  )
  return (
    <div className="areachair-progress">
      <h4 className="title">{`${numMetaReviewsDone} of ${areaChairs.length} ${inflect(
        areaChairs.length,
        'Meta Review',
        'Meta Reviews'
      )} Submitted`}</h4>

      <strong>Area Chair:</strong>
      <div>
        {areaChairs.length !== 0 &&
          areaChairs.map((areaChair) => {
            const metaReview = metaReviews.find((p) => p.anonId === areaChair.anonymousId)
            const recommendation = isV2Console
              ? metaReview?.content?.recommendation?.value
              : metaReview?.content?.recommendation
            const { metaReviewAgreement } = metaReview ?? {}

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
                    <span className="recommendation">Recommendation: {recommendation}</span>
                    <div>
                      <a
                        href={`/forum?id=${metaReview.forum}&noteId=${metaReview.id}&referrer=${referrerUrl}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Read Meta Review
                      </a>
                    </div>
                  </div>
                )}
                {metaReviewAgreement?.value && (
                  <div>
                    <span className="recommendation">
                      {metaReviewAgreement.name}: {metaReviewAgreement.value}
                    </span>
                    <div>
                      <a
                        href={`/forum?id=${metaReviewAgreement.forum}&noteId=${metaReviewAgreement.id}&referrer=${referrerUrl}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {`Read ${metaReviewAgreement.name}`}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {seniorAreaChairs?.length > 0 && (
        <div className="senior-areachair">
          <strong>Senior Area Chair:</strong>
          {seniorAreaChairs.map((seniorAreaChair, index) => (
            <div key={index} className="meta-review-info">
              <div className="seniorareachair-contact">
                <span>
                  {seniorAreaChair.preferredName}{' '}
                  <span className="text-muted">&lt;{seniorAreaChair.preferredEmail}&gt;</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {paperManualAreaChairAssignmentUrl && (
        <div>
          <br />
          <a href={paperManualAreaChairAssignmentUrl} target="_blank" rel="noreferrer">
            Edit Area Chair Assignments
          </a>
        </div>
      )}
    </div>
  )
}
