/* eslint-disable max-len */
/* globals $, typesetMathJax, promptError: false */

import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import sum from 'lodash/sum'
import upperFirst from 'lodash/upperFirst'
import { useSearchParams } from 'next/navigation'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import Table from '../Table'
import { AuthorConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'
import ErrorDisplay from '../ErrorDisplay'
import NoteSummary from './NoteSummary'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import {
  parseNumberField,
  prettyField,
  prettyId,
  inflect,
  pluralizeString,
  getNoteAuthorIds,
} from '../../lib/utils'
import useBreakpoint from '../../hooks/useBreakPoint'
import ConsoleTaskList from './ConsoleTaskList'

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
  const confidences = []

  noteCompletedReviews.forEach((p) => {
    confidences.push(
      parseNumberField(
        isV2Note ? p.content?.[reviewConfidenceName]?.value : p.content?.[reviewConfidenceName]
      )
    )
  })

  const ratings = Object.fromEntries(
    (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
      (ratingName) => {
        const ratingDisplayName =
          typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
        const ratingValues = noteCompletedReviews.map((p) => {
          if (!isV2Note) return parseNumberField(p.content?.[ratingName])
          if (typeof ratingName === 'object') {
            const ratingValue = Object.values(ratingName)[0]
              .map((q) => p.content?.[q]?.value)
              .find((r) => r !== undefined)
            return parseNumberField(ratingValue)
          }
          return parseNumberField(p.content?.[ratingName]?.value)
        })
        const validRatingValues = ratingValues.filter((p) => p !== null)
        const ratingAvg = validRatingValues.length
          ? (
              validRatingValues.reduce((total, curr) => total + curr, 0) /
              validRatingValues.length
            ).toFixed(2)
          : 'N/A'
        const ratingMin = validRatingValues.length ? Math.min(...validRatingValues) : 'N/A'
        const ratingMax = validRatingValues.length ? Math.max(...validRatingValues) : 'N/A'
        return [ratingDisplayName, { ratingAvg, ratingMin, ratingMax }]
      }
    )
  )

  let [averageConfidence, minConfidence, maxConfidence] = new Array(3).fill('N/A')

  if (confidences.some((p) => p)) {
    const validConfidences = confidences.filter((p) => p)
    minConfidence = Math.min(...validConfidences)
    maxConfidence = Math.max(...validConfidences)
    averageConfidence =
      Math.round((sum(validConfidences) / validConfidences.length) * 100) / 100
  }

  return (
    <div className="author-console-reviewer-progress">
      <h4>{`${inflect(
        noteCompletedReviews.length,
        prettyField(officialReviewName),
        prettyField(pluralizeString(officialReviewName)),
        true
      )} Submitted`}</h4>

      <ul className="list-unstyled">
        {noteCompletedReviews.map((review) => {
          const reviewRatingValues = (
            Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]
          ).flatMap((ratingName) => {
            let ratingDisplayName = ratingName
            let ratingValue = null
            if (isV2Note) {
              if (typeof ratingName === 'object') {
                const ratingFieldValue = Object.values(ratingName)[0]
                  .map((p) => review.content?.[p]?.value)
                  .find((q) => q !== undefined)
                ratingDisplayName = Object.keys(ratingName)[0]
                ratingValue = parseNumberField(ratingFieldValue)
              } else {
                ratingValue = parseNumberField(review.content?.[ratingName]?.value)
              }
            } else {
              ratingValue = parseNumberField(review.content?.[ratingName])
            }
            return ratingValue ? { [ratingDisplayName]: ratingValue } : []
          })

          const reviewConfidenceValue = parseNumberField(
            isV2Note
              ? review.content?.[reviewConfidenceName]?.value
              : review.content?.[reviewConfidenceName]
          )
          return (
            <li key={review.id}>
              <strong>{prettyId(review.signatures[0].split('/')?.pop())}:</strong>
              {reviewRatingValues.map((rating, index) => {
                const ratingName = Object.keys(rating)[0]
                const ratingValue = rating[ratingName]
                return (
                  <span key={index}>
                    {`${index === 0 ? ' ' : ' / '}${upperFirst(ratingName)}: ${ratingValue}`}{' '}
                  </span>
                )
              })}
              {reviewConfidenceValue !== null ? `/ Confidence: ${reviewConfidenceValue}` : ''}
              <br />
              <Link
                href={`/forum?id=${review.forum}&noteId=${review.id}&referrer=${referrerUrl}`}
              >
                Read {prettyField(officialReviewName)}
              </Link>
            </li>
          )
        })}
      </ul>

      <div>
        {(Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
          (ratingName, index) => {
            const ratingDisplayName =
              typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
            const { ratingAvg, ratingMin, ratingMax } = ratings[ratingDisplayName]
            return (
              <span key={index}>
                <strong>Average {prettyField(ratingDisplayName)}:</strong> {ratingAvg} (Min:{' '}
                {ratingMin}, Max: {ratingMax})<br />
              </span>
            )
          }
        )}
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
}) => {
  const isV2Note = note.version === 2
  const referrerUrl = encodeURIComponent(
    `[Author Console](/group?id=${venueId}/${authorName}#your-${pluralizeString(
      submissionName
    ).toLowerCase()})`
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

const AuthorSubmissionRowMobile = ({
  note,
  venueId,
  officialReviewName,
  decisionName = 'Decision',
  reviewRatingName,
  reviewConfidenceName,
  submissionName,
  authorName,
  profileMap,
}) => {
  const isV2Note = note.version === 2
  const referrerUrl = encodeURIComponent(
    `[Author Console](/group?id=${venueId}/${authorName}#your-${pluralizeString(
      submissionName
    ).toLowerCase()})`
  )
  return (
    <div className="mobile-paper-container">
      <span className="mobile-header">
        {submissionName} #{note.number}
      </span>
      <NoteSummary
        note={note}
        profileMap={profileMap}
        referrerUrl={referrerUrl}
        isV2Note={isV2Note}
      />
      <span className="mobile-header">Reviews:</span>
      <div className="mobile-review-summary">
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
      </div>
      <span className="mobile-header">Decision:</span>
      <AuthorConsoleNoteMetaReviewStatus
        note={note}
        venueId={venueId}
        decisionName={decisionName}
        submissionName={submissionName}
      />
    </div>
  )
}

const AuthorConsoleTasks = () => {
  const { venueId, authorName, submissionName, apiVersion } = useContext(WebFieldContext)
  const referrer = encodeURIComponent(
    `[Author Console](/group?id=${venueId}/${authorName}#author-tasks)`
  )

  return (
    <ConsoleTaskList
      venueId={venueId}
      roleName={authorName}
      referrer={referrer}
      filterAssignedInvitation={true}
      submissionName={submissionName}
      apiVersion={apiVersion}
    />
  )
}

// #region config docs
/** AuthorConsole config doc
 *
 * @typedef {Object} AuthorConsoleConfig
 *
 // eslint-disable-next-line max-len
 * @property {Object} header mandatory but can be empty object
 * @property {1|2} apiVersion mandatory
 * @property {string} venueId mandatory
 * @property {string} submissionId mandatory
 * @property {string} authorSubmissionField mandatory
 * @property {string} officialReviewName mandatory
 * @property {string} decisionName=Decision optional
 * @property {string|string[]|object[]} reviewRatingName mandatory
 * @property {string} reviewConfidenceName mandatory
 * @property {string} authorName mandatory
 * @property {string} submissionName mandatory
 * @property {boolean} showAuthorProfileStatus optional
 * @property {string} blindSubmissionId optional
 * @property {boolean} showIEEECopyright optional
 * @property {string} IEEEPublicationTitle optional
 * @property {number} IEEEArtSourceCode optional
 */

/**
 * @name AuthorConsoleConfig.header
 * @description Page header. Contains two string fields: "title" and "instructions" (markdown supported).
 * @type {Object}
 * @default no default value
 * @example
 * {
 *   "header": {
 *     "title": "Some conference",
 *     "instructions": "some **instructions**"
 *   }
 * }
 */

/**
 * @name AuthorConsoleConfig.apiVersion
 * @description API version to request. use 2 for new venues.
 * @type {1|2}
 * @default no default value
 * @example
 * { "apiVersion": 2 }
 */

/**
 * @name AuthorConsoleConfig.venueId
 * @description The id of the venue group, usually should be value of domain.id
 * @type {string}
 * @default no default value
 * @example
 * { "venueId": "ICLR.cc/202X/Conference" }
 */

/**
 * @name AuthorConsoleConfig.submissionId
 * @description The invitation id of submissions, used to get the notes for display in console.
 * @type {string}
 * @default no default value
 * @example
 * { "submissionId": "ICLR.cc/20XX/Conference/-/Submission" }
 */

/**
 * @name AuthorConsoleConfig.authorSubmissionField
 * @description field name in the submission note that represents the id of author. used to filter notes that current user is an author of.
 * @type {string}
 * @default no default value
 * @example
 * { "authorSubmissionField": "content.authorids" }
 */

/**
 * @name AuthorConsoleConfig.officialReviewName
 * @description name of the offical review in official review invitation, used for header display and for composing the official review invitation id for filtering
 * @type {string}
 * @default no default value
 * @example
 * { "officialReviewName": "Official_Review" }
 */

/**
 * @name AuthorConsoleConfig.decisionName
 * @description name of the decision field in decision note and name of decision invitation. used to construct decision invitation id to find the decision note and to display the paper decision.
 * @type {string}
 * @default 'Decision'
 * @example
 * { "decisionName": "Decision" }
 */

/**
 * @name AuthorConsoleConfig.reviewRatingName
 * @description denotes the rating field in review. which is parsed and used for min/max/avg calculation and display.
 * @type {string|string[]|object[]}
 * @default no default value
 * @example <caption>string shows single rating</caption>
 * { "reviewRatingName": "rating" }
 * @example <caption>string array shows multiple ratings</caption>
 * { "reviewRatingName": ["soundness","excitement","reproducibility"] }
 * @example <caption>object array/mixed shows multiple ratings with fallback options the following config would show 2 ratings: "overall_rating" and "overall_recommendation" for "overall_rating", it's value will be final_rating field, when final_rating field is not available, it will take the next available value defined in the array, in this example it will take "preliminary_rating"</caption>
 * {
 *  "reviewRatingName": [
 *    {
 *      "overall_rating": [
 *        "final_rating",
 *        "preliminary_rating"
 *      ]
 *    },
 *    "overall_recommendation",
 *  ]
 */

/**
 * @name AuthorConsoleConfig.reviewConfidenceName
 * @description name of the decision note. used to construct decision invitation id to find the decision note and to display the paper decision.
 * @type {string}
 * @default no default value
 * @example
 * { "decisionName": "Decision" }
 */

/**
 * @name AuthorConsoleConfig.authorName
 * @description used to construct referrer link back to author console and to filtering invitations for author in tasks tab
 * @type {string}
 * @default no default value
 * @example
 * { "authorName": "Authors" }
 */

/**
 * @name AuthorConsoleConfig.submissionName
 * @description use to construct referrer link/review invitation id/decision invitation id and text display
 * @type {string}
 * @default no default value
 * @example
 * { "submissionName": "Submission" }
 */

/**
 * @name AuthorConsoleConfig.showAuthorProfileStatus
 * @description use to control whether to load author profiles. the info is used to display author activation status
 * @type {boolean}
 * @default no default value but is compared against false so equivalent to true if not provided
 * @example
 * { "showAuthorProfileStatus": undefined }
 */

/**
 * @name AuthorConsoleConfig.blindSubmissionId
 * @deprecated only for v1. used to tell whether the note is a bline submission so that author name can be retrieved from original submission
 * @type {string}
 * @default no default value
 */

/**
 * @name AuthorConsoleConfig.showIEEECopyright
 * @description used to control whether to show link to IEEE copyright form. used together with IEEEPublicationTitle and IEEEArtSourceCode
 * @type {boolean}
 * @default no default value, by default the link to IEEE copyright form is hidden
 * @example
 * { "showIEEECopyright": true }
 */

/**
 * @name AuthorConsoleConfig.IEEEPublicationTitle
 * @description a string assigned by IEEE copyright system. must be exact match with the value assigned. used together with showIEEECopyright and IEEEArtSourceCode
 * @type {string}
 * @default no default value
 * @example
 * { "IEEEPublicationTitle": "20XX The International Conference on Learning Representations (ICLR)" }
 */

/**
 * @name AuthorConsoleConfig.IEEEArtSourceCode
 * @description a number assigned by IEEE copyright system. must be exact match with the value assigned. used together with showIEEECopyright and IEEEPublicationTitle
 * @type {number}
 * @default no default value
 * @example
 * { "IEEEArtSourceCode": 12345 }
 */

// #endregion

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

  const { user, isRefreshing } = useUser()
  const query = useSearchParams()
  const { setBannerContent } = appContext
  const [showTasks, setShowTasks] = useState(false)
  const [authorNotes, setAuthorNotes] = useState(null)
  const [profileMap, setProfileMap] = useState(null)
  const isMobile = !useBreakpoint('md')

  const loadProfiles = async (notes, version) => {
    const authorIds = new Set()
    notes.forEach((note) => {
      const ids = getNoteAuthorIds(note, version === 2)
      if (!Array.isArray(ids)) return
      ids.forEach((id) => {
        if (!id.includes('@')) {
          authorIds.add(id)
        }
      })
    })

    const getProfiles = (apiRes) => apiRes.profiles ?? []
    const profiles =
      authorIds.size > 0
        ? await api
            .get('/profiles', { ids: Array.from(authorIds).join(',') })
            .then(getProfiles)
        : []

    const profilesByUsernames = {}
    profiles.forEach((profile) => {
      profile.content.names.forEach((name) => {
        if (name.username) {
          profilesByUsernames[name.username] = profile
        }
      })
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
          { version: 1 }
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
                { version: 1 }
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
      const notesResult = await api.getAll('/notes', {
        [authorSubmissionField]: user.profile.id,
        invitation: submissionId,
        domain: group.domain,
        details: 'directReplies',
        sort: 'number:asc',
      })

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

    if (query.get('referrer')) {
      setBannerContent({ type: 'referrerLink', value: query.get('referrer') })
    } else {
      setBannerContent({ type: 'venueHomepageLink', value: venueId })
    }
  }, [query, venueId])

  useEffect(() => {
    if (isRefreshing || !user || !group || !authorSubmissionField || !submissionId) return

    if (apiVersion === 2) {
      loadDataV2()
    } else {
      loadDataV1()
    }
  }, [user, isRefreshing, group])

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
    return <ErrorDisplay statusCode="" message={errorMessage} withLayout={false} />
  }

  return (
    <>
      <BasicHeader title={header?.title} instructions={header.instructions} />

      <Tabs>
        <TabList>
          <Tab id={`your-${pluralizeString(submissionName).toLowerCase()}`} active>
            Your {`${pluralizeString(submissionName)}`}
          </Tab>
          <Tab id="author-tasks" onClick={() => setShowTasks(true)}>
            Author Tasks
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id={`your-${pluralizeString(submissionName).toLowerCase()}`}>
            {authorNotes?.length > 0 ? (
              <>
                {!isMobile ? (
                  <div className="table-container">
                    <Table
                      className="console-table table-striped"
                      headings={[
                        { id: 'number', content: '#', width: '55px' },
                        {
                          id: 'summary',
                          content: `${prettyField(submissionName)} Summary`,
                          width: '35%',
                        },
                        {
                          id: 'reviews',
                          content: `${prettyField(officialReviewName)}`,
                          width: 'auto',
                        },
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
                  <div className="author-console-mobile">
                    {authorNotes.map((note) => (
                      <AuthorSubmissionRowMobile
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
                  </div>
                )}
              </>
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
