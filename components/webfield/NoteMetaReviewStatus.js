/* globals promptError,promptMessage: false */

// modified from noteMetaReviewStatus.hbs handlebar template
import { useContext, useEffect, useState } from 'react'
import copy from 'copy-to-clipboard'
import WebFieldContext from '../WebFieldContext'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { inflect, pluralizeString, prettyField } from '../../lib/utils'
import { getNoteContentValues } from '../../lib/forum-utils'
import { getProfileLink } from '../../lib/webfield-utils'

const IEEECopyrightForm = ({ note, isV2Note }) => {
  const { showIEEECopyright, IEEEPublicationTitle, IEEEArtSourceCode } =
    useContext(WebFieldContext)
  const { user, isRefreshing } = useUser()
  const noteContent = isV2Note ? getNoteContentValues(note.content) : note.content

  if (showIEEECopyright && IEEEPublicationTitle && IEEEArtSourceCode && !isRefreshing) {
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
    ? decision?.content?.decision?.value
    : decision?.content?.decision
  const isAcceptedPaper = isV2Note
    ? note.content?.venueid?.value === venueId
    : decisionContent?.toLowerCase()?.includes('accept')

  if (!decision) {
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
  }

  return (
    <>
      {decisionContent && (
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
      )}
      {isAcceptedPaper && <IEEECopyrightForm note={note} isV2Note={isV2Note} />}
    </>
  )
}

// modified from noteMetaReviewStatus.hbs handlebar template
// eslint-disable-next-line import/prefer-default-export
export const AreaChairConsoleNoteMetaReviewStatus = ({
  note,
  metaReviewData,
  metaReviewRecommendationName,
  referrerUrl,
  additionalMetaReviewFields,
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
          type: 'note',
        },
        { accessToken }
      )
      if (result.invitations.length) {
        setMetaReviewInvitation(metaReviewData.metaReviewInvitationId)
      }
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadMetaReviewInvitation()
  }, [])

  return (
    <div className="areachair-console-meta-review">
      {metaReviewData[metaReviewRecommendationName] !== 'N/A' ? (
        <>
          <h4 className="title">{prettyField(metaReviewRecommendationName)}:</h4>
          <p>
            <strong>{metaReviewData[metaReviewRecommendationName]}</strong>
          </p>
          {additionalMetaReviewFields.map((additionalMetaReviewField) => {
            const fieldValue = metaReviewData[additionalMetaReviewField]
            return (
              <p key={additionalMetaReviewField}>
                <strong>{prettyField(additionalMetaReviewField)}:</strong> {fieldValue}
              </p>
            )
          })}
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
              href={`/forum?id=${note.forum}&noteId=${note.id}&invitationId=${metaReviewData.metaReviewInvitationId}&referrer=${referrerUrl}`}
              target="_blank"
              rel="nofollow noreferrer"
            >
              Submit
            </a>
          ) : (
            <strong>{`No ${metaReviewRecommendationName}`}</strong>
          )}
        </h4>
      )}
    </div>
  )
}

// modified from noteAreaChairs.hbs handlebar template pc console->paper status tab->status column
export const ProgramChairConsolePaperAreaChairProgress = ({
  rowData,
  referrerUrl,
  areaChairAssignmentUrl,
  metaReviewRecommendationName,
  additionalMetaReviewFields,
  preferredEmailInvitationId,
}) => {
  const { note, metaReviewData, preliminaryDecision } = rowData
  const {
    numMetaReviewsDone,
    areaChairs,
    metaReviews,
    seniorAreaChairs,
    secondaryAreaChairs,
    customStageReviews,
  } = metaReviewData
  const paperManualAreaChairAssignmentUrl = areaChairAssignmentUrl?.replace(
    'edges/browse?',
    `edges/browse?start=staticList,type:head,ids:${note.id}&`
  )
  const {
    officialMetaReviewName = 'Meta_Review',
    areaChairName = 'Area_Chairs',
    secondaryAreaChairName,
    seniorAreaChairName = 'Senior_Area_Chairs',
  } = useContext(WebFieldContext)

  const getACSACEmail = async (preferredName, profileId) => {
    if (!preferredEmailInvitationId) {
      promptError('Email is not available.')
      return
    }
    try {
      const result = await api.get(`/edges`, {
        invitation: preferredEmailInvitationId,
        head: profileId,
      })
      const email = result.edges?.[0]?.tail
      if (!email) throw new Error('Email is not available.')
      copy(`${preferredName} <${email}>`)
      promptMessage(`${email} copied to clipboard`)
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <div className="areachair-progress">
      <h4 className="title">{`${numMetaReviewsDone} of ${areaChairs.length} ${inflect(
        areaChairs.length,
        prettyField(officialMetaReviewName),
        pluralizeString(prettyField(officialMetaReviewName))
      )} Submitted`}</h4>

      {areaChairs.length > 0 && (
        <div>
          <strong>{prettyField(areaChairName)}:</strong>
          {areaChairs.map((areaChair) => {
            const metaReview = metaReviews.find((p) => p.anonId === areaChair.anonymousId)
            const recommendation = metaReview?.[metaReviewRecommendationName]
            const { metaReviewAgreement } = metaReview ?? {}
            return (
              <div key={areaChair.anonymousId} className="meta-review-info">
                <div className="areachair-contact">
                  <span>
                    <a
                      href={getProfileLink(areaChair.areaChairProfileId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {areaChair.preferredName}
                    </a>
                    <div>{areaChair.title}</div>
                    {preferredEmailInvitationId && (
                      // eslint-disable-next-line jsx-a11y/anchor-is-valid
                      <a
                        href="#"
                        className="text-muted"
                        onClick={(e) => {
                          e.preventDefault()
                          getACSACEmail(areaChair.preferredName, areaChair.areaChairProfileId)
                        }}
                      >
                        Copy Email
                      </a>
                    )}
                  </span>
                </div>
                {metaReview && recommendation && (
                  <div>
                    <span className="recommendation">
                      {prettyField(metaReviewRecommendationName)}: {recommendation}
                    </span>
                  </div>
                )}
                {additionalMetaReviewFields &&
                  additionalMetaReviewFields.map((additionalMetaReviewField) => {
                    const fieldValue = metaReview?.[additionalMetaReviewField]?.value
                    if (!fieldValue) return null
                    return (
                      <div key={additionalMetaReviewField}>
                        <span className="recommendation">
                          {prettyField(additionalMetaReviewField)}: {fieldValue}
                        </span>
                      </div>
                    )
                  })}
                {metaReview && (
                  <div>
                    <a
                      href={`/forum?id=${metaReview.forum}&noteId=${metaReview.id}&referrer=${referrerUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read {prettyField(officialMetaReviewName)}
                    </a>
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
      )}

      {secondaryAreaChairs?.length > 0 && (
        <div>
          <strong>{prettyField(secondaryAreaChairName)}:</strong>
          <div>
            {secondaryAreaChairs.map((areaChair) => (
              <div key={areaChair.anonymousId} className="meta-review-info">
                <div className="areachair-contact">
                  <span>
                    <a
                      href={getProfileLink(areaChair.areaChairProfileId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {areaChair.preferredName}
                    </a>
                    <div>{areaChair.title}</div>
                    {preferredEmailInvitationId && (
                      // eslint-disable-next-line jsx-a11y/anchor-is-valid
                      <a
                        href="#"
                        className="text-muted"
                        onClick={(e) => {
                          e.preventDefault()
                          getACSACEmail(areaChair.preferredName, areaChair.areaChairProfileId)
                        }}
                      >
                        Copy Email
                      </a>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {seniorAreaChairs?.length > 0 && (
        <div className="senior-areachair">
          <strong>{prettyField(seniorAreaChairName)}:</strong>
          {seniorAreaChairs.map((seniorAreaChair, index) => (
            <div key={index} className="meta-review-info">
              <div className="seniorareachair-contact">
                <span>
                  <a
                    href={getProfileLink(seniorAreaChair.preferredId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {seniorAreaChair.preferredName}
                  </a>
                  <div>{seniorAreaChair.title}</div>
                  {preferredEmailInvitationId && (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <a
                      href="#"
                      className="text-muted"
                      onClick={(e) => {
                        e.preventDefault()
                        getACSACEmail(
                          seniorAreaChair.preferredName,
                          seniorAreaChair.preferredId
                        )
                      }}
                    >
                      Copy Email
                    </a>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {customStageReviews && (
        <div>
          {Object.values(customStageReviews).map((customStageReview, index) => {
            if (!customStageReview.value) return null

            return (
              <div key={`${customStageReview.id}-${index}`}>
                <strong className="custom-stage-name">{customStageReview.name}:</strong>
                <div className="meta-review-info">
                  <span>
                    {customStageReview.displayField}: {customStageReview.value}
                  </span>

                  {customStageReview.extraDisplayFields?.length > 0 &&
                    customStageReview.extraDisplayFields.map(({ field, value }, i) => {
                      if (!value) return null
                      return (
                        <div key={`${field}-${i}`} className="meta-review-info">
                          <span>
                            {field}: {value}
                          </span>
                        </div>
                      )
                    })}

                  <div>
                    <a
                      href={`/forum?id=${customStageReview.forum}&noteId=${customStageReview.id}&referrer=${referrerUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {`Read ${customStageReview.name}`}
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {paperManualAreaChairAssignmentUrl && (
        <div className="mt-3">
          <a
            href={`${paperManualAreaChairAssignmentUrl}&referrer=${referrerUrl}`}
            target="_blank"
            rel="noreferrer"
          >
            Edit {prettyField(areaChairName)} Assignments
          </a>
        </div>
      )}

      {preliminaryDecision && (
        <div className="mt-3">
          <strong>Preliminary Decision:</strong>
          <br />
          <span>Recommendation: {preliminaryDecision.recommendation}</span>
          <br />
          <span>Confidence: {preliminaryDecision.confidence}</span>
          <br />
          <span>Discussion Needed: {preliminaryDecision.discussionNeeded}</span>
          <br />
          <br />
          <a
            href={`/forum?id=${note.id}&noteId=${preliminaryDecision.id}&referrer=${referrerUrl}`}
            target="_blank"
            rel="noreferrer"
          >
            View Preliminary Decision
          </a>
        </div>
      )}
    </div>
  )
}
