/* globals $, typesetMathJax, promptError: false */

import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import sum from 'lodash/sum'
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
import LoadingSpinner from '../LoadingSpinner'
import { filterAssignedInvitations, filterHasReplyTo } from '../../lib/webfield-utils'

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

  const getRatingValue = (reviewNote) => {
    const ratingName = Array.isArray(reviewRatingName)
      ? reviewRatingName.find((name) =>
          isV2Note ? reviewNote.content[name]?.value : reviewNote.content[name]
        )
      : reviewRatingName

    return isV2Note ? reviewNote.content[ratingName]?.value : reviewNote.content[ratingName]
  }

  noteCompletedReviews.forEach((p) => {
    const ratingEx = /^(\d+): .*$/
    const ratingValue = getRatingValue(p)
    const ratingMatch = ratingValue?.match(ratingEx)
    ratings.push(ratingMatch ? parseInt(ratingMatch[1], 10) : null)
    const confidenceValue = isV2Note
      ? p.content[reviewConfidenceName]?.value
      : p.content[reviewConfidenceName]
    const confidenceMatch = confidenceValue?.match(ratingEx)
    confidences.push(confidenceMatch ? parseInt(confidenceMatch[1], 10) : null)
  })

  let [averageRating, minRating, maxRating, averageConfidence, minConfidence, maxConfidence] =
    new Array(6).fill('N/A')
  if (ratings.some((p) => p)) {
    const validRatings = ratings.filter((p) => p)
    minRating = Math.min(...validRatings)
    maxRating = Math.max(...validRatings)
    averageRating = Math.round((sum(validRatings) / validRatings.length) * 100) / 100
  }
  if (confidences.some((p) => p)) {
    const validConfidences = confidences.filter((p) => p)
    minConfidence = Math.min(...validConfidences)
    maxConfidence = Math.max(...validConfidences)
    averageConfidence =
      Math.round((sum(validConfidences) / validConfidences.length) * 100) / 100
  }

  return (
    <div className="author-console-reviewer-progress">
      <h4>{`${noteCompletedReviews.length} Reviews Submitted`}</h4>

      <ul className="list-unstyled">
        {noteCompletedReviews.map((review) => {
          const reviewRatingValue = getRatingValue(review)

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
  decisionName = 'Decision',
  reviewRatingName,
  reviewConfidenceName,
  submissionName,
  authorName,
  profileMap,
  showIEEECopyright,
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
        <NoteSummary
          note={note}
          profileMap={profileMap}
          referrerUrl={referrerUrl}
          isV2Note={isV2Note}
        />
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

const AuthorConsoleTasks = () => {
  const { venueId, authorName, submissionName, apiVersion } = useContext(WebFieldContext)
  const { accessToken } = useUser()
  const [invitations, setInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const wildcardInvitation = `${venueId}/.*`

  const addInvitaitonTypeAndVersion = (invitation) => {
    let invitaitonType = 'tagInvitation'
    if (apiVersion === 2 && invitation.edit?.note) invitaitonType = 'noteInvitation'
    if (apiVersion === 1 && !invitation.reply.content?.tag && !invitation.reply.content?.head)
      invitaitonType = 'noteInvitation'
    return { ...invitation, [invitaitonType]: true, apiVersion }
  }

  const loadInvitations = async () => {
    setIsLoading(true)
    try {
      let allInvitations = await api.getAll(
        '/invitations',
        {
          ...(apiVersion !== 2 && { regex: wildcardInvitation }),
          ...(apiVersion === 2 && { domain: venueId }),
          invitee: true,
          duedate: true,
          type: 'all',
        },
        { accessToken, version: apiVersion }
      )

      allInvitations = allInvitations
        .map((p) => addInvitaitonTypeAndVersion(p))
        .filter((p) => filterHasReplyTo(p, apiVersion))
        .filter((p) => filterAssignedInvitations(p, authorName, submissionName))

      if (allInvitations.length) {
        // add details
        const validInvitationDetails = await api.getAll(
          '/invitations',
          {
            ids: allInvitations.map((p) => p.id),
            details: 'all',
            select: 'id,details',
          },
          { accessToken, version: apiVersion }
        )

        allInvitations.forEach((p) => {
          // eslint-disable-next-line no-param-reassign
          p.details = validInvitationDetails.find((q) => q.id === p.id)?.details
        })
      }

      setInvitations(formatTasksData([allInvitations, [], []], true))
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  if (isLoading) return <LoadingSpinner />
  return (
    <TaskList
      invitations={invitations}
      emptyMessage={'No outstanding tasks for this conference'}
      referrer={`${encodeURIComponent(
        `[Author Console](/group?id=${venueId}/${authorName}#author-tasks)`
      )}&t=${Date.now()}`}
    />
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
    decisionName = 'Decision',
    reviewRatingName,
    reviewConfidenceName,
    authorName,
    submissionName,
    showAuthorProfileStatus, // defaults to true
    blindSubmissionId, // for v1 only
    showIEEECopyright,
    IEEEPublicationTitle,
    IEEEArtSourceCode,
  } = useContext(WebFieldContext)

  const { user, userLoading, accessToken } = useUser()
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent } = appContext
  const [showTasks, setShowTasks] = useState(false)
  const [authorNotes, setAuthorNotes] = useState(null)
  const [profileMap, setProfileMap] = useState(null)

  const loadProfiles = async (notes, version) => {
    const authorIds = new Set()
    const authorEmails = new Set()
    notes.forEach((note) => {
      const ids = version === 2 ? note.content.authorids.value : note.content.authorids
      if (!Array.isArray(ids)) return

      ids.forEach((id) => {
        if (id.includes('@')) {
          authorEmails.add(id)
        } else {
          authorIds.add(id)
        }
      })
    })

    const getProfiles = (apiRes) => apiRes.profiles ?? []
    const idProfilesP =
      authorIds.size > 0
        ? api
            .get('/profiles', { ids: Array.from(authorIds).join(',') }, { accessToken })
            .then(getProfiles)
        : Promise.resolve([])
    const emailProfilesP =
      authorEmails.size > 0
        ? api
            .get(
              '/profiles',
              { confirmedEmails: Array.from(authorEmails).join(',') },
              { accessToken }
            )
            .then(getProfiles)
        : Promise.resolve([])
    const [idProfiles, emailProfiles] = await Promise.all([idProfilesP, emailProfilesP])

    const profilesByUsernames = {}
    idProfiles.concat(emailProfiles).forEach((profile) => {
      profile.content.names.forEach((name) => {
        if (name.username) {
          profilesByUsernames[name.username] = profile
        }
      })
      if (profile.email) {
        profilesByUsernames[profile.email] = profile
      }
    })
    return profilesByUsernames
  }

  const loadDataV1 = async () => {
    try {
      const notesResult = await api
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
                    if (originalNote) {
                      // eslint-disable-next-line no-param-reassign
                      blindNote.content.authors = originalNote.content.authors
                      // eslint-disable-next-line no-param-reassign
                      blindNote.content.authorids = originalNote.content.authorids
                    }
                    return blindNote
                  })
              )
          }
          return originalNotes
        })

      setAuthorNotes(notesResult)

      if (showAuthorProfileStatus !== false) {
        // Load profile of all co-authors to show active status next to their names
        const profiles = await loadProfiles(notesResult, 1)
        setProfileMap(profiles)
      }
    } catch (error) {
      promptError(error.message)
    }
  }

  const loadDataV2 = async () => {
    try {
      const notesResult = await api.getAll(
        '/notes',
        {
          [authorSubmissionField]: user.profile.id,
          invitation: submissionId,
          details: 'directReplies',
          sort: 'number:asc',
        },
        { accessToken, version: 2 }
      )

      setAuthorNotes(notesResult)

      if (showAuthorProfileStatus !== false) {
        // Load profile of all co-authors
        const profiles = await loadProfiles(notesResult, 2)
        setProfileMap(profiles)
      }
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
      loadDataV1()
    }
  }, [user, userLoading, group])

  useEffect(() => {
    if (!authorNotes) return

    setTimeout(() => {
      typesetMathJax()
      $('[data-toggle="tooltip"]').tooltip()
    }, 100)
  }, [authorNotes])

  const missingConfig = Object.entries({
    header,
    group,
    apiVersion,
    venueId,
    submissionId,
    authorSubmissionField,
    officialReviewName,
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
          <Tab id="author-tasks" onClick={() => setShowTasks(true)}>
            Author Tasks
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="your-submissions">
            {authorNotes?.length > 0 ? (
              <div className="table-container">
                <Table
                  className="console-table table-striped"
                  headings={[
                    { id: 'number', content: '#', width: '55px' },
                    { id: 'summary', content: 'Paper Summary', width: '35%' },
                    { id: 'reviews', content: 'Reviews', width: 'auto' },
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
                      profileMap={profileMap}
                    />
                  ))}
                </Table>
              </div>
            ) : (
              <p className="empty-message">No papers to display at this time</p>
            )}
          </TabPanel>
          <TabPanel id="author-tasks">{showTasks && <AuthorConsoleTasks />}</TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default AuthorConsole
