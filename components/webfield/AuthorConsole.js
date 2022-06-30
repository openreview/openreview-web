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
import NoteContentCollapsible from './NoteContentCollapsible'
import { AuthorConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'
import TaskList from '../TaskList'
import ErrorDisplay from '../ErrorDisplay'

const NoteSummary = ({ note, referrerUrl, isV2Note }) => {
  const titleValue = isV2Note ? note.content?.title?.value : note.content?.title
  const pdfValue = isV2Note ? note.content?.pdf?.value : note.content?.pdf
  const authorsValue = isV2Note ? note.content?.authors?.value : note.content?.authors
  const authorDomainsValue = isV2Note
    ? note.content?.authorDomains?.value
    : note.content?.authorDomains
  return (
    <div className="note">
      <h4>
        <a
          href={`/forum?id=${note.forum}&referrer=${referrerUrl}`}
          target="_blank"
          rel="noreferrer"
        >
          {titleValue}
        </a>
      </h4>
      {pdfValue && (
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
      {authorsValue && <div className="note-authors">{authorsValue.join(', ')}</div>}
      {authorDomainsValue && (
        <div className="note-authors">{`Conflict Domains: ${authorDomainsValue.join(
          ', '
        )}`}</div>
      )}

      <NoteContentCollapsible
        id={note.id}
        content={note.content}
        invitation={note.invitation}
      />
    </div>
  )
}

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

const ReviewSummaryV2 = ({ note, venueId, referrerUrl, submissionName, reviewName }) => {
  const reviews = note.details.replies.filter((reply) =>
    reply.invitations.includes(`${venueId}/${submissionName}${note.number}/-/${reviewName}`)
  )
  return (
    <div className="reviewer-progress">
      <h4>{`${reviews.length} Reviews Submitted`}</h4>
      <ul className="list-unstyled">
        {reviews.map((review) => (
          <li key={review.id}>
            <strong>{prettyId(review.signatures[0].split('/')?.pop())}</strong>{' '}
            <Link
              href={`/forum?id=${review.forum}&noteId=${review.id}&referrer=${referrerUrl}`}
            >
              <a>Review</a>
            </Link>
          </li>
        ))}
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
  reviewName,
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
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={isV2Note} />
      </td>
      <td>
        {isV2Note ? (
          <ReviewSummaryV2
            note={note}
            venueId={venueId}
            referrerUrl={referrerUrl}
            submissionName={submissionName}
            reviewName={reviewName}
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
          submissionName={submissionName}
        />
      </td>
    </tr>
  )
}

const AuthorConsole = ({ appContext }) => {
  let header, // eslint-disable-line one-var
    group,
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
    reviewName
  const webFieldContext = useContext(WebFieldContext)
  if (webFieldContext.isV2Group) {
    ;({
      header,
      entity: group,
      isV2Group,
      venueId,
      submissionId,
      authorSubmissionField,
      submissionName,
      authorName,
      reviewName,
      decisionName,
      wildcardInvitation,
    } = webFieldContext)
    if (
      ![
        header,
        group,
        isV2Group,
        venueId,
        submissionId,
        authorSubmissionField,
        submissionName,
        authorName,
        reviewName,
        decisionName,
        wildcardInvitation,
      ].every((p) => p !== undefined)
    ) {
      return <ErrorDisplay statusCode="" message="web has missing config" />
    }
  } else {
    ;({
      header,
      entity: group,
      isV2Group,
      venueId,
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
    } = webFieldContext)
    if (
      ![
        header,
        group,
        isV2Group,
        venueId,
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
      ].every((p) => p !== undefined)
    ) {
      return <ErrorDisplay statusCode="" message="web has missing config" />
    }
  }
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

    const result = await Promise.all([notesP, invitationsP])

    setAuthorNotes(result[0])
    setInvitations(formatInvitations(result[1]))
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
                      reviewName={reviewName}
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
