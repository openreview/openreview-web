import { useContext, useEffect, useState } from 'react'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import useUser from '../../hooks/useUser'
import { useRouter } from 'next/router'
import useQuery from '../../hooks/useQuery'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import Table from '../Table'
import { getNotePdfUrl, prettyId } from '../../lib/utils'
import NoteContentCollapsible from './NoteContentCollapsible'
import Link from 'next/link'
import { AuthorConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'

const NoteSummary = ({ note, referrerUrl }) => {
  return (
    <div id={`note-summary-${note.number}`} className="note">
      <h4>
        <a href={`/forum?id=${note.forum}&referrer=${referrerUrl}`} target="_blank">
          {note.content?.title}
        </a>
      </h4>
      {note.content?.pdf && (
        <div>
          <a
            href={getNotePdfUrl(note, false)}
            className="attachment-download-link"
            title="Download PDF"
            target="_blank"
            download={`${note.number}.pdf`}
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

      <NoteContentCollapsible
        id={note.id}
        content={note.content}
        invitation={note.invitation}
      />
    </div>
  )
}

const ReviewSummary = ({ note, conferenceId, referrerUrl, officialReviewName }) => {
  const noteCompletedReviews =
    note.details.directReplies?.filter(
      (p) => p.invitation === `${conferenceId}/Paper${note.number}/-/${officialReviewName}`
    ) ?? []
  const ratings = []
  const confidences = []
  noteCompletedReviews.forEach((p) => {
    const ratingEx = /^(\d+): .*$/
    const ratingMatch = p.content.rating?.match(ratingEx)
    ratings.push(ratingMatch ? parseInt(ratingMatch[1], 10) : null)
    const confidenceMatch = p.content.confidence?.match(ratingEx)
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
    <div className="reviewer-progress">
      <h4>{`${noteCompletedReviews.length} Reviews Submitted`}</h4>
      <ul className="list-unstyled">
        {noteCompletedReviews.map((review, index) => (
          <li>
            <strong>{prettyId(review.signatures[0].split('/')?.pop())}:</strong> Rating:{' '}
            {ratings[index]} {confidences[index] ? `/ Confidence: ${confidences[index]}` : ''}
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

const AuthorSubmissionRow = ({ note, conferenceId, officialReviewName }) => {
  const referrerUrl = encodeURIComponent(
    `[Author Console](/group?id=${conferenceId}/Authors#your-submissions)`
  )
  return (
    <tr>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} />
      </td>
      <td>
        <ReviewSummary
          note={note}
          conferenceId={conferenceId}
          referrerUrl={referrerUrl}
          officialReviewName={officialReviewName}
        />
      </td>
      <td>
        <AuthorConsoleNoteMetaReviewStatus note={note} />
      </td>
    </tr>
  )
}

const AuthorConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    conferenceId,
    submissionId,
    authorSubmissionField,
    blindSubmissionId,
    officialReviewName,
  } = useContext(WebFieldContext)
  const { user, accessToken } = useUser()
  const router = useRouter()
  const query = useQuery()
  const [authorNotes, setAuthorNotes] = useState([])
  const [invitations, setInvitations] = useState(null)
  const { setBannerContent } = appContext
  const wildcardInvitation = `${conferenceId}.*`

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
            .get('/notes', {
              ids: blindNoteIds,
              details: 'directReplies',
              sort: 'number:asc',
            })
            .then((result) => {
              return (result.notes || [])
                .filter((note) => note.invitation === blindSubmissionId)
                .map((blindNote) => {
                  var originalNote = originalNotes.find((p) => {
                    return p.id == blindNote.original
                  })
                  blindNote.content.authors = originalNote.content.authors
                  blindNote.content.authorids = originalNote.content.authorids
                  return blindNote
                })
            })
        } else {
          return originalNotes
        }
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
        { accessToken }
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
        { accessToken }
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
        { accessToken }
      ),
    ]).then(([noteInvitations, edgeInvitations, tagInvitations]) => {
      return noteInvitations
        .concat(edgeInvitations)
        .concat(tagInvitations)
        .filter((p) => p.invitees?.indexOf('Authors') !== -1)
    })

    const result = await Promise.all([notesP, invitationsP])
    setAuthorNotes(result[0])
    setInvitations(result[1])
  }

  useEffect(() => {
    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(conferenceId))
    }
  }, [group])

  useEffect(() => {
    if (!group) return
    loadData()
  }, [group])

  if (!user || !user.profile || user.profile.id === 'guest') {
    router.replace(
      `/login?redirect=${encodeURIComponent(
        `${window.location.pathname}${location.search}${location.hash}`
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
              <Table
                className="console-table"
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
                    conferenceId={conferenceId}
                    officialReviewName={officialReviewName}
                  />
                ))}
              </Table>
            )}
          </TabPanel>
          <TabPanel id="author-tasks">456</TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default AuthorConsole
