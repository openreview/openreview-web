/* globals view2,promptError: false */
import { groupBy, uniq } from 'lodash'
import { useEffect, useState } from 'react'
import Accordion from './Accordion'
import Table from './Table'
import { inflect } from '../lib/utils'
import api from '../lib/api-client'
import ErrorAlert from './ErrorAlert'
import LoadingSpinner from './LoadingSpinner'
import useUser from '../hooks/useUser'

export default function DblpPublicationTable({
  dblpPublications,
  orPublications,
  selectedPublications,
  setSelectedPublications,
  orPublicationsImportedByOtherProfile,
  maxNumberofPublicationsToImport,
}) {
  const { accessToken } = useUser()
  const [profileIdsRequested, setProfileIdsRequested] = useState([])
  const pubsCouldNotImport = [] // either existing or associated with other profile
  const pubsCouldImport = []
  dblpPublications.forEach((dblpPub) => {
    const titleMatch = (orPub) =>
      orPub.title === dblpPub.formattedTitle &&
      orPub.authorCount === dblpPub.authorCount &&
      orPub.venue === dblpPub.venue
    const existing = orPublications.find(titleMatch)
    const existingWithOtherProfile = orPublicationsImportedByOtherProfile.find(titleMatch)
    if (existing || existingWithOtherProfile || dblpPub.authorIndex === -1) {
      pubsCouldNotImport.push(dblpPub.key)
    } else {
      pubsCouldImport.push(dblpPub.key)
    }
  })
  const allExistInOpenReview = dblpPublications.length === pubsCouldNotImport.length
  const allChecked =
    dblpPublications.length - pubsCouldNotImport.length === selectedPublications.length

  const dblpPublicationsGroupedByYear = groupBy(dblpPublications, (p) => p.year)

  const toggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedPublications([])
      return
    }
    setSelectedPublications(pubsCouldImport)
  }

  const toggleSelectYear = (e, year) => {
    const publicationKeysOfYear = dblpPublicationsGroupedByYear[year]
      ?.map((p) => p.key)
      .filter((q) => pubsCouldImport.includes(q))
    if (e.target.checked) {
      setSelectedPublications(
        [...selectedPublications, ...publicationKeysOfYear].slice(
          0,
          maxNumberofPublicationsToImport
        )
      )
    } else {
      setSelectedPublications(
        selectedPublications.filter((p) => !publicationKeysOfYear.includes(p))
      )
    }
    e.stopPropagation()
  }

  const selectPublication = (publicationKey) => (checked) => {
    if (checked) {
      setSelectedPublications(
        [...selectedPublications, publicationKey].slice(0, maxNumberofPublicationsToImport)
      )
    } else {
      setSelectedPublications(selectedPublications.filter((p) => p !== publicationKey))
    }
  }

  const getMergeRequests = async () => {
    if (!dblpPublications.length) return
    try {
      const profileMergeInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge`
      const result = await api.get(
        '/notes',
        { invitation: profileMergeInvitationId },
        { accessToken }
      )

      setProfileIdsRequested(uniq(result.notes.map((note) => note.content.right?.value)))
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    getMergeRequests()
  }, [])

  if (!dblpPublications.length) {
    return null
  }

  const headings = [
    {
      content: (
        <input
          type="checkbox"
          onChange={(e) => toggleSelectAll(e.target.checked)}
          checked={allChecked}
          disabled={allExistInOpenReview}
          aria-label="Select all"
        />
      ),
      width: '24px',
    },
    {
      content: 'Select All',
    },
  ]

  return (
    <>
      <Table
        headings={pubsCouldImport.length <= maxNumberofPublicationsToImport ? headings : []}
      />
      <div>
        <Accordion
          sections={Object.keys(dblpPublicationsGroupedByYear)
            .reverse()
            .map((p) => {
              const publicationsOfYear = dblpPublicationsGroupedByYear[p]
              const publicationsCouldImportOfYear = publicationsOfYear.filter((q) =>
                pubsCouldImport.includes(q.key)
              )
              return {
                id: p,
                heading: (
                  <>
                    <input
                      className="year-checkbox"
                      type="checkbox"
                      onChange={(e) => {
                        toggleSelectYear(e, p)
                      }}
                      checked={
                        publicationsCouldImportOfYear.length &&
                        publicationsCouldImportOfYear.every((r) =>
                          selectedPublications.includes(r.key)
                        )
                      }
                      disabled={publicationsCouldImportOfYear.length === 0}
                      aria-label="Select all publications of this year"
                    />
                    {`${p} – ${inflect(
                      publicationsOfYear.length,
                      'publication',
                      'publications',
                      true
                    )}`}
                  </>
                ),
                body: publicationsOfYear.map((publication) => {
                  const titleMatch = (orPub) =>
                    orPub.title === publication.formattedTitle &&
                    orPub.authorCount === publication.authorCount &&
                    orPub.venue === publication.venue
                  const existingPublication = orPublications.find(titleMatch)
                  const existingPublicationOfOtherProfile =
                    orPublicationsImportedByOtherProfile.find(titleMatch)
                  // eslint-disable-next-line no-nested-ternary
                  const category = existingPublication
                    ? 'existing-publication'
                    : existingPublicationOfOtherProfile
                      ? 'existing-different-profile'
                      : 'nonExisting'

                  return (
                    <DblpPublicationRow
                      // eslint-disable-next-line react/no-array-index-key
                      key={publication.key}
                      title={publication.title}
                      authors={publication.authorNames}
                      openReviewId={
                        existingPublication?.id || existingPublicationOfOtherProfile?.noteId
                      }
                      authorIsInvalid={publication.authorIndex === -1}
                      selected={selectedPublications.includes(publication.key)}
                      toggleSelected={selectPublication(publication.key)}
                      otherProfileId={existingPublicationOfOtherProfile?.existingProfileId}
                      category={category}
                      venue={publication.venue}
                      source={publication.source}
                      profileIdsRequested={profileIdsRequested}
                      setProfileIdsRequested={setProfileIdsRequested}
                    />
                  )
                }),
              }
            })}
          options={{
            id: 'dblp-papers',
            collapsed: false,
            html: false,
            bodyContainer: '',
            shouldCollapse: false,
          }}
        />
      </div>
    </>
  )
}

const DblpPublicationRow = ({
  title,
  authors,
  openReviewId,
  authorIsInvalid,
  selected,
  toggleSelected,
  otherProfileId,
  category,
  venue,
  source,
  profileIdsRequested,
  setProfileIdsRequested,
}) => {
  const { accessToken, user } = useUser()
  const [error, setError] = useState(null)
  const [profileMergeStatus, setProfileMergeStatus] = useState(null)
  const profileMergeInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge`

  const postProfileMergeRequest = async () => {
    setError(null)
    setProfileMergeStatus('loading')
    try {
      const profileMergeInvitation = await api.getInvitationById(
        profileMergeInvitationId,
        accessToken
      )
      const editToPost = view2.constructEdit({
        formData: {
          email: user.profile.preferredEmail,
          left: user.id,
          right: otherProfileId,
          comment: 'DBLP import',
          status: 'Pending',
          editSignatureInputValues: [user.profile.preferredId],
        },
        invitationObj: profileMergeInvitation,
      })
      await api.post('/notes/edits', editToPost, { accessToken })
      setProfileIdsRequested([...profileIdsRequested, otherProfileId])
    } catch (apiError) {
      setError(apiError)
      setProfileMergeStatus('error')
    }
  }

  const renderProfileMergeRequestLink = () => {
    switch (profileMergeStatus) {
      case 'loading':
        return <LoadingSpinner inline />
      case 'posted':
        return 'Profile merge request has been submitted'
      case 'error':
        return null
      default:
        return (
          <>
            <span type="button" className="request-merge" onClick={postProfileMergeRequest}>
              Request profile merge
            </span>{' '}
            if you think this profile might be yours
          </>
        )
    }
  }

  useEffect(() => {
    if (profileIdsRequested.includes(otherProfileId)) {
      setProfileMergeStatus('posted')
    }
  }, [profileIdsRequested])

  return (
    <>
      <div
        className={
          category === 'nonExisting' ? 'publication-info' : `publication-info ${category}-row`
        }
      >
        <input
          type="checkbox"
          onChange={(e) => {
            if (openReviewId || authorIsInvalid) return
            toggleSelected(e.target.checked)
          }}
          checked={selected}
          disabled={openReviewId || authorIsInvalid}
          title={authorIsInvalid ? 'Your name does not match the author list' : undefined}
          aria-label="Select this publication"
        />
        <div>
          <div className="publication-title">
            {category === 'existing-publication' ||
            category === 'existing-different-profile' ? (
              <a
                href={`/forum?id=${openReviewId}&referrer=[profile](/profile/edit)`}
                target="_blank"
                rel="noreferrer"
              >
                {title}
              </a>
            ) : (
              <span>{title}</span>
            )}
            <br />
            <span className="venue">
              {venue}
              {source && ` - ${source}`}
            </span>
          </div>
          <div className="publication-author-names">{authors.join(', ')}</div>
          {category === 'existing-different-profile' && (
            <>
              This paper is associated with the user{' '}
              <a
                className="different-profile-link"
                href={`/profile?id=${otherProfileId}`}
                target="_blank"
                rel="noreferrer"
              >
                {otherProfileId}
              </a>
              <div className="different-profile-link">{renderProfileMergeRequestLink()}</div>
            </>
          )}
          {authorIsInvalid && (
            <span className="name-not-match">
              Your name does not match any of the authors listed for this paper
            </span>
          )}
        </div>
      </div>
      {error && <ErrorAlert error={error} />}
    </>
  )
}
