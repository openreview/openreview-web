/* globals typesetMathJax,promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import Table from '../Table'
import { AuthorConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'
import TaskList from '../TaskList'
import ErrorDisplay from '../ErrorDisplay'
import NoteSummary from './NoteSummary'
import useQuery from '../../hooks/useQuery'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { formatTasksData, prettyId } from '../../lib/utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

const ReviewSummary = ({
  note,
  venueId,
  referrerUrl,
  officialReviewName,
  reviewRatingName,
  reviewConfidenceName,
  submissionName,
  isV2Note,
}) => {
  const officialReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
  const directlyReplyFilterFn = isV2Note
    ? (p) => p.invitations.includes(officialReviewInvitationId)
    : (p) => p.invitation === officialReviewInvitationId
  const noteCompletedReviews = note.details.directReplies?.filter(directlyReplyFilterFn) ?? []
  const ratings = []
  const confidences = []
  noteCompletedReviews.forEach((p) => {
    const ratingEx = /^(\d+): .*$/
    const ratingValue = isV2Note
      ? p.content[reviewRatingName]?.value
      : p.content[reviewRatingName]
    const ratingMatch = ratingValue?.match(ratingEx)
    ratings.push(ratingMatch ? parseInt(ratingMatch[1], 10) : null)
    const confidenceValue = isV2Note
      ? p.content[reviewConfidenceName]?.value
      : p.content[reviewConfidenceName]
    const confidenceMatch = confidenceValue?.match(ratingEx)
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
        {noteCompletedReviews.map((review) => {
          const reviewRatingValue = isV2Note
            ? review.content?.[reviewRatingName]?.value
            : review.content?.[reviewRatingName]
          const reviewConfidenceValue = isV2Note
            ? review.content?.[reviewConfidenceName]?.value
            : review.content?.[reviewConfidenceName]
          return (
            <li key={review.id}>
              <strong>{prettyId(review.signatures[0].split('/')?.pop())}:</strong> Rating:{' '}
              {reviewRatingValue ?? 'N/A'}{' '}
              {reviewConfidenceValue ? `/ Confidence: ${reviewConfidenceValue}` : ''}
              <br />
              <Link
                href={`/forum?id=${review.forum}&noteId=${review.id}&referrer=${referrerUrl}`}
              >
                <a>Read Review</a>
              </Link>
            </li>
          )
        })}
      </ul>
      <div>
        <strong>Average Rating:</strong> {averageRating} (Min: {minRating}, Max: {maxRating})
        <br />
        <strong>Average Confidence:</strong> {averageConfidence} (Min: {minConfidence}, Max:{' '}
        {maxConfidence})
      </div>
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
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={isV2Note} />
      </td>
      <td>
        <ReviewSummary
          note={note}
          venueId={venueId}
          referrerUrl={referrerUrl}
          officialReviewName={officialReviewName}
          reviewRatingName={reviewRatingName}
          reviewConfidenceName={reviewConfidenceName}
          submissionName={submissionName}
          isV2Note={isV2Note}
        />
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
  const {
    header,
    entity: group,
    apiVersion,
    venueId,
    submissionId,
    authorSubmissionField,
    officialReviewName,
    decisionName,
    reviewRatingName,
    reviewConfidenceName,
    authorName,
    submissionName,
    blindSubmissionId, // for v1 only
  } = useContext(WebFieldContext)

  const { user, userLoading, accessToken } = useUser()
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent } = appContext
  const [authorNotes, setAuthorNotes] = useState([])
  const [invitations, setInvitations] = useState([])

  const wildcardInvitation = `${venueId}/.*`

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
        .map((inv) => ({ ...inv, noteInvitation: true, apiVersion: 1 }))
        .concat(edgeInvitations.map((inv) => ({ ...inv, tagInvitation: true, apiVersion: 1 })))
        .concat(tagInvitations.map((inv) => ({ ...inv, tagInvitation: true, apiVersion: 1 })))
        .filter((p) => p.invitees?.some((q) => q.includes(authorName)))
    )

    try {
      const result = await Promise.all([notesP, invitationsP])

      setAuthorNotes(result[0])
      setInvitations(formatInvitations(result[1]))
    } catch (error) {
      promptError(error.message)
    }
  }

  const loadDataV2 = async () => {
    const notesP = api.getAll(
      '/notes',
      {
        [authorSubmissionField]: user.profile.id,
        invitation: submissionId,
        details: 'directReplies',
        sort: 'number:asc',
      },
      { accessToken, version: 2 }
    )
    const invitationsP = Promise.all([
      api.getAll(
        '/invitations',
        {
          prefix: wildcardInvitation,
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
          prefix: wildcardInvitation,
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
          prefix: wildcardInvitation,
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
          .map((inv) => ({ ...inv, noteInvitation: true, apiVersion: 2 }))
          .concat(
            edgeInvitations.map((inv) => ({ ...inv, tagInvitation: true, apiVersion: 2 }))
          )
          .concat(
            tagInvitations.map((inv) => ({ ...inv, tagInvitation: true, apiVersion: 2 }))
          )
          .filter(
            (p) => p.id.includes(authorName) || p.invitees?.some((q) => q.includes(authorName))
          ) // TODO: number filtering logic
    )
    try {
      const result = await Promise.all([notesP, invitationsP])

      setAuthorNotes(result[0])
      setInvitations(formatInvitations(result[1]))
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!query) return

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(venueId))
    }
  }, [query, venueId])

  useEffect(() => {
    if (!userLoading && (!user || !user.profile || user.profile.id === 'guest')) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )}`
      )
    }
  }, [user, userLoading])

  useEffect(() => {
    if (userLoading || !user || !group || !authorSubmissionField || !submissionId) return

    if (apiVersion === 2) {
      loadDataV2()
    } else {
      loadData()
    }
  }, [user, userLoading, group])

  useEffect(() => {
    if (authorNotes) {
      typesetMathJax()
    }
  }, [authorNotes])

  const missingConfig = Object.entries({
    header,
    group,
    apiVersion,
    venueId,
    submissionId,
    authorSubmissionField,
    officialReviewName,
    decisionName,
    reviewRatingName,
    reviewConfidenceName,
    authorName,
    submissionName,
  }).filter(([key, value]) => value === undefined)
  if (missingConfig?.length || (apiVersion === 1 && blindSubmissionId === undefined)) {
    const errorMessage = `Author Console is missing required properties: ${
      missingConfig.length ? missingConfig.map((p) => p[0]).join(', ') : 'blindSubmissionId'
    }`
    return <ErrorDisplay statusCode="" message={errorMessage} />
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
                `[Author Console](/group?id=${venueId}/${authorName}#author-tasks)`
              )}&t=${Date.now()}`}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default AuthorConsole
