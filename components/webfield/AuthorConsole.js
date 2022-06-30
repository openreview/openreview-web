import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import useQuery from '../../hooks/useQuery'
import useUser from '../../hooks/useUser'
import BasicHeader from './BasicHeader'
import WebFieldContext from '../WebFieldContext'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import Table from '../Table'
import { formatTasksData, getNotePdfUrl, prettyId } from '../../lib/utils'
import { NoteContentCollapsible, NoteContentCollapsibleV2 } from './NoteContentCollapsible'
import { AuthorConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'
import TaskList from '../TaskList'

const NoteSummary = ({ note, referrerUrl }) => (
  <div className="note">
    <h4>
      <a
        href={`/forum?id=${note.forum}&referrer=${referrerUrl}`}
        target="_blank"
        rel="noreferrer"
      >
        {note.content?.title}
      </a>
    </h4>
    {note.content?.pdf && (
      <div className="download-pdf-link">
        <a
          href={getNotePdfUrl(note, false)}
          className="attachment-download-link"
          title="Download PDF"
          target="_blank"
          download={`${note.number}.pdf`}
          rel="noreferrer"
        >
          <span className="glyphicon glyphicon-download-alt" aria-hidden="true"></span>{' '}
          Download PDF
        </a>
      </div>
    )}
    {note.content?.authors && (
      <div className="note-authors">{note.content.authors.join(', ')}</div>
    )}
    {note.content?.authorDomains && (
      <div className="note-authors">{`Conflict Domains: ${note.content.authorDomains.join(
        ', '
      )}`}</div>
    )}

    <NoteContentCollapsible id={note.id} content={note.content} invitation={note.invitation} />
  </div>
)

const NoteSummaryV2 = ({ note, referrerUrl }) => (
  <div className="note">
    <h4>
      <a
        href={`/forum?id=${note.forum}&referrer=${referrerUrl}`}
        target="_blank"
        rel="noreferrer"
      >
        {note.content?.title?.value}
      </a>
    </h4>
    {note.content?.pdf?.value && (
      <div className="download-pdf-link">
        <a
          href={getNotePdfUrl(note, false)}
          className="attachment-download-link"
          title="Download PDF"
          target="_blank"
          download={`${note.number}.pdf`}
          rel="noreferrer"
        >
          <span className="glyphicon glyphicon-download-alt" aria-hidden="true"></span>{' '}
          Download PDF
        </a>
      </div>
    )}
    {note.content?.authors?.value && (
      <div className="note-authors">{note.content.authors.value.join(', ')}</div>
    )}
    {note.content?.authorDomains?.value && (
      <div className="note-authors">{`Conflict Domains: ${note.content.authorDomains.value.join(
        ', '
      )}`}</div>
    )}

    <NoteContentCollapsibleV2
      id={note.id}
      content={note.content}
      invitation={note.invitation}
    />
  </div>
)

const ReviewSummary = ({
  note,
  venueId,
  referrerUrl,
  officialReviewName,
  reviewRatingName,
  reviewConfidenceName,
  submissionName,
}) => {
  const noteCompletedReviews =
    note.details.directReplies?.filter(
      (p) =>
        p.invitation === `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
    ) ?? []
  const ratings = []
  const confidences = []
  noteCompletedReviews.forEach((p) => {
    const ratingEx = /^(\d+): .*$/
    const ratingMatch = p.content[reviewRatingName]?.match(ratingEx)
    ratings.push(ratingMatch ? parseInt(ratingMatch[1], 10) : null)
    const confidenceMatch = p.content[reviewConfidenceName]?.match(ratingEx)
    confidences.push(confidenceMatch ? parseInt(confidenceMatch[1], 10) : null)
  })

  let [averageRating, minRating, maxRating, averageConfidence, minConfidence, maxConfidence] =
    Array(6).fill('N/A')
  if (ratings.some((p) => p)) {
    const validRatings = ratings.filter((p) => p)
    minRating = Math.min(...validRatings)
    maxRating = Math.max(...validRatings)
    averageRating =
      Math.round(
        (validRatings.reduce((prev, curr) => prev + curr, 0) * 100) / validRatings.length
      ) / 100
  }
  if (confidences.some((p) => p)) {
    const validConfidences = confidences.filter((p) => p)
    minConfidence = Math.min(...validConfidences)
    maxConfidence = Math.max(...validConfidences)
    averageConfidence =
      Math.round(
        (validConfidences.reduce((prev, curr) => prev + curr, 0) * 100) /
          validConfidences.length
      ) / 100
  }

  return (
    <div className="author-console-reviewer-progress">
      <h4>{`${noteCompletedReviews.length} Reviews Submitted`}</h4>
      <ul className="list-unstyled">
        {noteCompletedReviews.map((review) => (
          <li key={review.id}>
            <strong>{prettyId(review.signatures[0].split('/')?.pop())}:</strong> Rating:{' '}
            {review.content?.[reviewRatingName] ?? 'N/A'}{' '}
            {review.content?.[reviewConfidenceName]
              ? `/ Confidence: ${review.content[reviewConfidenceName]}`
              : ''}
            <br />
            <Link
              href={`/forum?id=${review.forum}&noteId=${review.id}&referrer=${referrerUrl}`}
            >
              <a>Read Review</a>
            </Link>
          </li>
        ))}
      </ul>
      <div>
        <strong>Average Rating:</strong>
        {`${averageRating} (Min: ${minRating}, Max: ${maxRating})`}
        <br />
        <strong>Average Confidence:</strong>
        {`${averageConfidence} (Min: ${minConfidence}, Max: ${maxConfidence})`}
      </div>
    </div>
  )
}

const ReviewSummaryV2 = ({ note, venueId, referrerUrl, submissionName }) => {
  const reviews = note.details.replies.filter((reply) =>
    reply.invitations.includes(`${venueId}/${submissionName}${note.number}/-/Review`)
  )
  const recommendations = note.details.replies.filter((reply) =>
    reply.invitations.includes(
      `${venueId}/${submissionName}${note.number}/-/Official_Recommendation`
    )
  )
  const recommendationByReviewer = {}
  recommendations.forEach((recommendation) => {
    recommendationByReviewer[recommendation.signatures[0]] = recommendation
  })
  return (
    <div className="reviewer-progress">
      <h4>{`${reviews.length} Reviews Submitted / ${
        //-- no recommendation it's for TMLR only
        Object.keys(recommendationByReviewer).length
      } Recommendations`}</h4>
      <ul className="list-unstyled">
        {reviews.map((review) => {
          const reviewerRecommendation = recommendationByReviewer[review.signatures[0]]
          return (
            <li key={review.id}>
              <strong>{prettyId(review.signatures[0].split('/')?.pop())}</strong>{' '}
              <Link
                href={`/forum?id=${review.forum}&noteId=${review.id}&referrer=${referrerUrl}`}
              >
                <a>Review</a>
              </Link>
              {reviewerRecommendation && (
                <>
                  {'/ Recommendation:'}
                  <Link
                    href={`/forum?id=${reviewerRecommendation.forum}&noteId=${reviewerRecommendation.id}&referrer=${referrerUrl}`}
                  >
                    <a>Recommendation</a>
                  </Link>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const AuthorSubmissionRow = ({
  note,
  venueId,
  officialReviewName,
  decisionName,
  reviewRatingName,
  reviewConfidenceName,
  submissionName,
  authorName,
}) => {
  const isV2Note = note.version === 2
  const referrerUrl = encodeURIComponent(
    `[Author Console](/group?id=${venueId}/${authorName}#your-submissions)`
  )
  return (
    <tr>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        {isV2Note ? (
          <NoteSummaryV2 note={note} referrerUrl={referrerUrl} />
        ) : (
          <NoteSummary note={note} referrerUrl={referrerUrl} />
        )}
      </td>
      <td>
        {isV2Note ? (
          <ReviewSummaryV2
            note={note}
            venueId={venueId}
            referrerUrl={referrerUrl}
            submissionName={submissionName}
          />
        ) : (
          <ReviewSummary
            note={note}
            venueId={venueId}
            referrerUrl={referrerUrl}
            officialReviewName={officialReviewName}
            reviewRatingName={reviewRatingName}
            reviewConfidenceName={reviewConfidenceName}
            submissionName={submissionName}
          />
        )}
      </td>
      <td>
        <AuthorConsoleNoteMetaReviewStatus
          note={note}
          venueId={venueId}
          decisionName={decisionName}
        />
      </td>
    </tr>
  )
}

const AuthorConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    isV2Group,
    submissionId,
    authorSubmissionField,
    blindSubmissionId,
    officialReviewName,
    decisionName,
    reviewRatingName,
    reviewConfidenceName,
    authorName,
    submissionName,
    wildcardInvitation,
  } = useContext(WebFieldContext)
  const { user, accessToken } = useUser()
  const router = useRouter()
  const query = useQuery()
  const [authorNotes, setAuthorNotes] = useState([])
  const [invitations, setInvitations] = useState([])
  const { setBannerContent } = appContext

  const formatInvitations = (allInvitations) => formatTasksData([allInvitations, [], []], true)

  const loadData = async () => {
    const notesP = api
      .get(
        '/notes',
        {
          invitation: submissionId,
          details: 'invitation,overwriting,directReplies',
          sort: 'number:asc',
          [authorSubmissionField]: user.profile.id,
        },
        { accessToken }
      )
      .then((result) => {
        const originalNotes = result.notes
        const blindNoteIds = []
        originalNotes.forEach((note) => {
          if (note.details.overwriting?.length) {
            blindNoteIds.push(note.details.overwriting[0])
          }
        })
        if (blindNoteIds.length) {
          return api
            .get(
              '/notes',
              {
                ids: blindNoteIds,
                details: 'directReplies',
                sort: 'number:asc',
              },
              { accessToken }
            )
            .then((blindNotesResult) =>
              (blindNotesResult.notes || [])
                .filter((note) => note.invitation === blindSubmissionId)
                .map((blindNote) => {
                  const originalNote = originalNotes.find((p) => p.id === blindNote.original)
                  blindNote.content.authors = originalNote.content.authors // eslint-disable-line no-param-reassign
                  blindNote.content.authorids = originalNote.content.authorids // eslint-disable-line no-param-reassign
                  return blindNote
                })
            )
        }
        return originalNotes
      })
    const invitationsP = Promise.all([
      api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          replyto: true,
          type: 'notes',
          details: 'replytoNote,repliedNotes',
        },
        { accessToken, version: 1 }
      ),
      api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          type: 'edges',
          details: 'repliedEdges',
        },
        { accessToken, version: 1 }
      ),
      api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          type: 'tags',
          details: 'repliedTags',
        },
        { accessToken, version: 1 }
      ),
    ]).then(([noteInvitations, edgeInvitations, tagInvitations]) =>
      noteInvitations
        .map((inv) => ({ ...inv, noteInvitation: true }))
        .concat(edgeInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
        .concat(tagInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
        .filter((p) => p.invitees?.some((q) => q.includes(authorName)))
    )

    const result = await Promise.all([notesP, invitationsP])
    setAuthorNotes(result[0])
    setInvitations(formatInvitations(result[1]))
  }

  const loadDataV2 = async () => {
    const notesP = api.getAll(
      '/notes',
      {
        [authorSubmissionField]: user.profile.id,
        invitation: submissionId,
        details: 'replies',
        sort: 'number:asc',
      },
      { accessToken, version: 2 }
    )
    const invitationsP = Promise.all([
      api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          replyto: true,
          type: 'notes',
          details: 'replytoNote,repliedNotes',
        },
        { accessToken, version: 2 }
      ),
      api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          type: 'edges',
          details: 'repliedEdges',
        },
        { accessToken, version: 2 }
      ),
      api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          type: 'tags',
          details: 'repliedTags',
        },
        { accessToken, version: 2 }
      ),
    ]).then(
      ([noteInvitations, edgeInvitations, tagInvitations]) =>
        noteInvitations
          .map((inv) => ({ ...inv, noteInvitation: true }))
          .concat(edgeInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
          .concat(tagInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
          .filter(
            (p) => p.id.includes(authorName) || p.invitees?.some((q) => q.includes(authorName))
          ) // TODO: number filtering logic
    )
    const groupedEdgesP = api
      .get(
        '/edges',
        {
          invitation: `${venueId}/Action_Editors/-/Recommendation`,
          groupBy: 'head',
        },
        { accessToken, version: 2 }
      )
      .then((result) => result.groupedEdges)

    const result = await Promise.all([notesP, invitationsP, groupedEdgesP])
    const allInvitations = result[1] //-- TODO REMOVE paperRecommendation
    // Add the assignment edges to each paper assignmnt invitation
    result[0].forEach((note) => {
      const paperRecommendationInvitation = allInvitations.find(
        (p) =>
          p.id === `${venueId}/${submissionName}${note.number}/Action_Editors/-/Recommendation`
      )
      if (paperRecommendationInvitation) {
        const foundEdges = result[2].find((p) => p.id.head == note.id) // eslint-disable-line eqeqeq
        if (foundEdges) {
          paperRecommendationInvitation.details.repliedEdges = foundEdges.values
        }
      }
    })
    setAuthorNotes(result[0])
    setInvitations(formatInvitations(allInvitations))
  }

  useEffect(() => {
    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(venueId))
    }
  }, [group])

  useEffect(() => {
    if (!group) return
    isV2Group ? loadDataV2() : loadData() // eslint-disable-line no-unused-expressions
  }, [group])

  if (!user || !user.profile || user.profile.id === 'guest') {
    router.replace(
      `/login?redirect=${encodeURIComponent(
        `${window.location.pathname}${window.location.search}${window.location.hash}`
      )}`
    )
  }

  return (
    <>
      <BasicHeader title={header?.title} instructions={header.instructions} />
      <Tabs>
        <TabList>
          <Tab id="your-submissions" active>
            Your Submissions
          </Tab>
          <Tab id="author-tasks">Author Tasks</Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="your-submissions">
            {authorNotes?.length === 0 ? (
              <p className="empty-message">No papers to display at this time</p>
            ) : (
              <div className="table-container">
                <Table
                  className="console-table table-striped"
                  headings={[
                    { id: 'number', content: '#', width: '5%' },
                    { id: 'summary', content: 'Paper Summary', width: '35%' },
                    { id: 'reviews', content: 'Reviews', width: '30%' },
                    { id: 'decision', content: 'Decision', width: '30%' },
                  ]}
                >
                  {authorNotes.map((note) => (
                    <AuthorSubmissionRow
                      key={note.id}
                      note={note}
                      venueId={venueId}
                      officialReviewName={officialReviewName}
                      decisionName={decisionName}
                      reviewRatingName={reviewRatingName}
                      reviewConfidenceName={reviewConfidenceName}
                      submissionName={submissionName}
                      authorName={authorName}
                    />
                  ))}
                </Table>
              </div>
            )}
          </TabPanel>
          <TabPanel id="author-tasks">
            <TaskList
              invitations={invitations}
              emptyMessage="No outstanding tasks for this conference"
              referrer={`${encodeURIComponent(
                `[Author Console](/group?id=${venueId}/${authorName}'#author-tasks)`
              )}&t=${Date.now()}`}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default AuthorConsole
