'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import ErrorAlert from '../../components/ErrorAlert'
import Accordion from '../../components/Accordion'
import Icon from '../../components/Icon'
import { prettyId, forumDate } from '../../lib/utils'
import styles from './Reviews.module.scss'

export default function Page() {
  const { user, accessToken, isRefreshing } = useUser()
  const router = useRouter()
  const [reviews, setReviews] = useState(null)
  const [error, setError] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState('')

  // Cache for domain to review invitation suffix mapping
  const domainToReviewInvitation = useMemo(
    () => ({
      TMLR: '/-/Review',
    }),
    []
  )

  const loadReviews = async () => {
    try {
      const allReviews = []

      // Get v1 reviews
      setLoadingStatus('Loading v1 reviews...')
      const v1Notes = await api.getAll(
        '/notes',
        { tauthor: true, details: 'forumContent' },
        { accessToken, version: 1 }
      )

      // Filter v1 Official Reviews that are public
      for (const note of v1Notes) {
        if (!note.invitation?.includes('Official_Review')) continue

        const forumContent = note.details?.forumContent
        if (!forumContent) continue

        // Extract venue from invitation (e.g., "ICLR.cc/2020/Conference")
        const invitationParts = note.invitation.split('/')
        const venue = invitationParts.slice(0, -2).join('/') || invitationParts[0]

        allReviews.push({
          id: note.id,
          forumId: note.forum,
          submissionTitle: forumContent.title || 'Untitled',
          venue,
          venuePretty: prettyId(venue),
          cdate: note.cdate,
          tcdate: note.tcdate,
          apiVersion: 1,
        })
      }

      // Get v2 reviews
      setLoadingStatus('Loading v2 reviews...')
      if (user?.profile?.id) {
        const v2Notes = await api.getAll(
          '/notes',
          {
            signature: user.profile.id,
            transitiveMembers: true,
          },
          { accessToken, version: 2 }
        )

        // Process v2 reviews
        const domainsToFetch = new Set()
        for (const note of v2Notes) {
          if (note.domain && !domainToReviewInvitation[note.domain]) {
            domainsToFetch.add(note.domain)
          }
        }

        // Fetch domain groups to get review invitation names
        setLoadingStatus('Fetching venue configurations...')
        const domainGroups = await Promise.all(
          Array.from(domainsToFetch).map(async (domain) => {
            try {
              const group = await api.get(
                '/groups',
                { id: domain },
                { accessToken, version: 2 }
              )
              return { domain, group: group.groups?.[0] }
            } catch {
              return { domain, group: null }
            }
          })
        )

        // Build domain to review invitation mapping
        for (const { domain, group } of domainGroups) {
          if (group?.content?.review_name?.value) {
            domainToReviewInvitation[domain] = `/-/${group.content.review_name.value}`
          }
        }

        // Filter v2 reviews and collect forum IDs
        const v2ReviewCandidates = []
        const forumIdsToFetch = new Set()

        for (const note of v2Notes) {
          const reviewInvitationSuffix = domainToReviewInvitation[note.domain]
          if (!reviewInvitationSuffix) continue

          // Check if this note is a review
          const isReview = note.invitations?.some((inv) =>
            inv.includes(reviewInvitationSuffix)
          )
          if (!isReview) continue

          v2ReviewCandidates.push(note)
          forumIdsToFetch.add(note.forum)
        }

        // Batch fetch all forum notes for titles
        setLoadingStatus('Loading submission details...')
        const forumTitles = new Map()
        const forumIdArray = Array.from(forumIdsToFetch)

        // Fetch in batches of 50 to avoid too large requests
        const batchSize = 50
        for (let i = 0; i < forumIdArray.length; i += batchSize) {
          const batch = forumIdArray.slice(i, i + batchSize)
          const batchResults = await Promise.all(
            batch.map(async (forumId) => {
              try {
                const result = await api.get(
                  '/notes',
                  { id: forumId },
                  { accessToken, version: 2 }
                )
                return {
                  forumId,
                  title: result.notes?.[0]?.content?.title?.value || 'Untitled',
                }
              } catch {
                return { forumId, title: 'Untitled' }
              }
            })
          )
          batchResults.forEach(({ forumId, title }) => forumTitles.set(forumId, title))
        }

        // Build review entries
        for (const note of v2ReviewCandidates) {
          allReviews.push({
            id: note.id,
            forumId: note.forum,
            submissionTitle: forumTitles.get(note.forum) || 'Untitled',
            venue: note.domain,
            venuePretty: prettyId(note.domain),
            cdate: note.cdate,
            tcdate: note.tcdate,
            apiVersion: 2,
          })
        }
      }

      // Sort by date (newest first)
      allReviews.sort((a, b) => (b.tcdate || b.cdate) - (a.tcdate || a.cdate))
      setReviews(allReviews)
      setLoadingStatus('')
    } catch (apiError) {
      setError(apiError)
      setLoadingStatus('')
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!accessToken) {
      router.push('/login?redirect=/reviews')
      return
    }
    loadReviews()
  }, [isRefreshing, accessToken])

  // Group reviews by venue
  const reviewsByVenue = useMemo(() => {
    if (!reviews) return new Map()
    const grouped = new Map()
    for (const review of reviews) {
      const venue = review.venue
      if (!grouped.has(venue)) {
        grouped.set(venue, {
          venuePretty: review.venuePretty,
          reviews: [],
        })
      }
      grouped.get(venue).reviews.push(review)
    }
    return grouped
  }, [reviews])

  if (!reviews && !error) {
    return (
      <div className={styles.reviews}>
        <LoadingSpinner text={loadingStatus || 'Loading reviews...'} />
      </div>
    )
  }

  if (error) return <ErrorAlert error={error} />

  if (reviews.length === 0) {
    return (
      <div className={styles.reviews}>
        <p className="empty-message">No reviews found.</p>
      </div>
    )
  }

  const userName = user?.profile?.fullname

  return (
    <div className={styles.reviews}>
      {userName && <p className="reviews-user">Reviews by {userName}</p>}
      <p className="reviews-summary">
        <strong>{reviews.length}</strong> {reviews.length === 1 ? 'review' : 'reviews'} found
        across <strong>{reviewsByVenue.size}</strong>{' '}
        {reviewsByVenue.size === 1 ? 'venue' : 'venues'}
      </p>

      <Accordion
        sections={Array.from(reviewsByVenue.entries()).map(([venue, data]) => ({
          id: venue.replace(/[^a-zA-Z0-9]/g, '-'),
          heading: (
            <span className="venue-heading">
              <Link href={`/group?id=${encodeURIComponent(venue)}`} className="venue-link">
                {data.venuePretty}
              </Link>
              <span className="badge">{data.reviews.length}</span>
            </span>
          ),
          body: (
            <ul className="reviews-list list-unstyled">
              {data.reviews.map((review) => (
                <li key={review.id} className="review-item">
                  <div className="review-content">
                    <h5 className="submission-title">
                      <Link href={`/forum?id=${review.forumId}`}>
                        {review.submissionTitle}
                      </Link>
                    </h5>
                    <ul className="review-meta list-inline">
                      <li>
                        <Icon name="time" />
                        {forumDate(review.cdate, review.tcdate)}
                      </li>
                      <li>
                        <Link
                          href={`/forum?id=${review.forumId}&noteId=${review.id}`}
                          className="review-link"
                        >
                          <Icon name="comment" />
                          View Review
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          ),
        }))}
        options={{
          id: 'reviews-accordion',
          collapsed: false,
          html: false,
          bodyContainer: '',
        }}
      />
    </div>
  )
}
