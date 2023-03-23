import { maxBy } from 'lodash'
import { useContext, useState, useEffect, useCallback } from 'react'
import useUser from '../../hooks/useUser'
import { getProfileName, isValidEmail } from '../../lib/utils'
import api from '../../lib/api-client'
import IconButton from '../IconButton'

import styles from '../../styles/components/ProfileSearchWidget.module.scss'
import EditorComponentContext from '../EditorComponentContext'
import LoadingSpinner from '../LoadingSpinner'
import PaginationLinks from '../PaginationLinks'

const getTitle = (profile) => {
  if (!profile.content) return null
  const latestHistory =
    profile.content.history?.find((p) => !p.end) || maxBy(profile.content.history, 'end')
  const title = latestHistory
    ? `${latestHistory.position ? `${latestHistory.position} at ` : ''}${
        latestHistory.institution?.name
      }${latestHistory.institution?.domain ? ` (${latestHistory.institution?.domain})` : ''}`
    : ''
  return title
}

const Author = ({
  fieldName,
  authorId,
  profile,
  showArrowButton,
  displayAuthors,
  setDisplayAuthors,
}) => {
  const { onChange } = useContext(EditorComponentContext)

  const increaseAuthorIndex = () => {
    const authorIndex = displayAuthors.findIndex((p) => p.authorId === authorId)
    const updatedValue = [...displayAuthors]
    updatedValue.splice(authorIndex, 1)
    updatedValue.splice(authorIndex + 1, 0, displayAuthors[authorIndex])
    onChange({ fieldName, value: updatedValue })
    setDisplayAuthors(updatedValue)
  }

  const tooltip = profile.noProfile
    ? profile.authorId
    : profile.content.preferredEmail ?? profile.content.emails[0]

  if (!profile) return null

  return (
    <div className={styles.selectedAuthor}>
      <div className={styles.authorName}>
        {profile.noProfile ? (
          <span
            className={styles.authorNameLink}
            title={tooltip}
            data-toggle="tooltip"
            data-placement="top"
          >
            {profile.authorName}
          </span>
        ) : (
          <a
            href={`/profile?id=${profile.id}`}
            title={tooltip}
            data-toggle="tooltip"
            data-placement="top"
            target="_blank"
            rel="noreferrer"
            className={styles.authorNameLink}
          >
            {getProfileName(profile)}
          </a>
        )}
      </div>
      <div className={styles.actionButtons}>
        <IconButton
          name="remove"
          onClick={() => {
            const updatedAuthors = displayAuthors.filter((p) => p.authorId !== authorId)
            setDisplayAuthors(updatedAuthors)
            onChange({ fieldName, value: updatedAuthors })
          }}
          extraClasses="action-button"
        />
        {showArrowButton && <IconButton name="arrow-right" onClick={increaseAuthorIndex} />}
      </div>
    </div>
  )
}

const ProfileSearchResultRow = ({
  profile,
  setProfileSearchResults,
  setSearchTerm,
  setSelectedAuthorProfiles,
  displayAuthors,
  setDisplayAuthors,
}) => {
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const isInAuthorList = value.find((p) => p.authorId === profile?.id)
  if (!profile) return null

  return (
    <div className={styles.searchResultRow}>
      <div className={styles.basicInfo}>
        <div className={styles.authorFullName}>
          <a href={`/profile?id=${profile.id}`} target="_blank" rel="noreferrer">
            {profile.id
              .split(new RegExp(`([^~_0-9]+|[~_0-9]+)`, 'g'))
              .map((segment, index) => {
                if (/[^~_0-9]+/.test(segment)) {
                  return (
                    <span className={styles.nameSegment} key={index}>
                      {segment}
                    </span>
                  )
                } else {
                  return (
                    <span className={styles.idSegment} key={index}>
                      {segment}
                    </span>
                  )
                }
              })}
          </a>
        </div>
        <div className={styles.authorTitle}>{getTitle(profile)}</div>
      </div>
      <div className={styles.authorEmails}>
        {profile.content?.emailsConfirmed?.map((email, index) => (
          <span key={index}>{email}</span>
        ))}
      </div>
      <div className={styles.addButton}>
        <IconButton
          name="plus"
          disableButton={isInAuthorList}
          disableReason="This author is already in author list"
          onClick={() => {
            const updatedAuthors = displayAuthors.concat({
              authorId: profile.id,
              authorName: getProfileName(profile),
            })
            setDisplayAuthors(updatedAuthors)
            onChange({
              fieldName,
              value: updatedAuthors,
            })
            setProfileSearchResults(null)
            setSearchTerm('')
            setSelectedAuthorProfiles((existingProfiles) => [...existingProfiles, profile])
          }}
        />
      </div>
    </div>
  )
}

const ProfileSearchResults = ({
  isLoading,
  searchTerm,
  setSearchTerm,
  profileSearchResults,
  setProfileSearchResults,
  setSelectedAuthorProfiles,
  displayAuthors,
  setDisplayAuthors,
}) => {
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(profileSearchResults?.length ?? 0)
  const [profilesDisplayed, setProfilesDisplayed] = useState([])
  const pageSize = 15

  useEffect(() => {
    if (!profileSearchResults?.length) return
    setProfilesDisplayed(
      profileSearchResults.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      )
    )
    setTotalCount(profileSearchResults.length)
  }, [profileSearchResults, pageNumber])

  useEffect(() => {
    return () => {
      setPageNumber(1)
    }
  }, [searchTerm])

  if (isLoading) return <LoadingSpinner inline={true} text={null} />
  if (!profileSearchResults) return null
  if (!profileSearchResults.length)
    return (
      <div className={styles.noMatchingProfile}>
        <span>
          No matching profiles found. <br />
          Please enter the author's full name and email below, then click Add button to add the
          author.
        </span>
        <CustomAuthorForm
          searchTerm={searchTerm}
          setProfileSearchResults={setProfileSearchResults}
          setSearchTerm={setSearchTerm}
          displayAuthors={displayAuthors}
          setDisplayAuthors={setDisplayAuthors}
        />
      </div>
    )
  return (
    <div className={styles.searchResults}>
      {profilesDisplayed.map((profile, index) => (
        <ProfileSearchResultRow
          key={index}
          profile={profile}
          setProfileSearchResults={setProfileSearchResults}
          setSearchTerm={setSearchTerm}
          setSelectedAuthorProfiles={setSelectedAuthorProfiles}
          displayAuthors={displayAuthors}
          setDisplayAuthors={setDisplayAuthors}
        />
      ))}
      <PaginationLinks
        currentPage={pageNumber}
        itemsPerPage={pageSize}
        totalCount={totalCount}
        setCurrentPage={setPageNumber}
        options={{ noScroll: true, showCount: true }}
      />
    </div>
  )
}

const CustomAuthorForm = ({
  searchTerm,
  setProfileSearchResults,
  setSearchTerm,
  displayAuthors,
  setDisplayAuthors,
}) => {
  const [customAuthorName, setCustomAuthorName] = useState('')
  const [customAuthorEmail, setCustomAuthorEmail] = useState('')
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]

  const disableAddButton = !(customAuthorName.trim() && isValidEmail(customAuthorEmail))

  const handleAddCustomAuthor = () => {
    const cleanAuthorName = customAuthorName.trim()
    const cleanAuthorEmail = customAuthorEmail.trim().toLowerCase()
    const updatedAuthors = displayAuthors.concat({
      authorId: cleanAuthorEmail,
      authorName: cleanAuthorName,
    })
    setDisplayAuthors(updatedAuthors)
    onChange({
      fieldName,
      value: updatedAuthors,
    })
    setProfileSearchResults(null)
    setSearchTerm('')
  }

  useEffect(() => {
    const cleanSearchTerm = searchTerm.trim()
    if (isValidEmail(cleanSearchTerm)) {
      setCustomAuthorEmail(cleanSearchTerm.toLowerCase())
    } else {
      setCustomAuthorName(cleanSearchTerm)
    }
  }, [searchTerm])

  return (
    <form
      className={styles.customAuthorForm}
      onSubmit={(e) => {
        e.preventDefault()
        handleAddCustomAuthor()
      }}
    >
      <label htmlFor="fullName">Full Name:</label>
      <input
        type="text"
        name="fullName"
        className="form-control"
        value={customAuthorName}
        placeholder="full name of the author to add"
        onChange={(e) => setCustomAuthorName(e.target.value)}
      />
      <label htmlFor="email">Email:</label>
      <input
        type="email"
        name="email"
        className="form-control"
        value={customAuthorEmail}
        placeholder="email of the author to add"
        onChange={(e) => setCustomAuthorEmail(e.target.value)}
      />
      <button className="btn btn-sm" disabled={disableAddButton} type="submit">
        Add
      </button>
    </form>
  )
}

const ProfileSearchWidget = () => {
  const { user, accessToken } = useUser()
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const [selectedAuthorProfiles, setSelectedAuthorProfiles] = useState([])
  const [profileSearchResults, setProfileSearchResults] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [displayAuthors, setDisplayAuthors] = useState(value) // id+email

  const getProfiles = async (authorIds) => {
    try {
      const ids = authorIds.filter((p) => p.startsWith('~'))
      const emails = authorIds.filter((p) => p.match(/.+@.+/))
      const getProfilesByIdsP = ids.length
        ? api.post(
            '/profiles/search',
            {
              ids,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const getProfilesByEmailsP = emails.length
        ? api.post(
            '/profiles/search',
            {
              emails,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const profileResults = await Promise.all([getProfilesByIdsP, getProfilesByEmailsP])
      const allProfiles = (profileResults[0].profiles ?? []).concat(
        profileResults[1].profiles ?? []
      )
      setSelectedAuthorProfiles(allProfiles)
      if (!value) {
        // existing note already have name and email info
        const currentAuthorProfile = allProfiles.find((p) =>
          p.content.names.find((q) => q.username === user.profile.id)
        )

        setDisplayAuthors([
          { authorId: user.profile.id, authorName: getProfileName(currentAuthorProfile) },
        ])
        onChange({
          fieldName,
          value: [
            { authorId: user.profile.id, authorName: getProfileName(currentAuthorProfile) },
          ],
        })
      }
    } catch (error) {
      promptError(error.message)
    }
  }

  const searchProfile = async (searchTerm) => {
    setIsLoading(true)
    const cleanSearchTerm = searchTerm.trim().toLowerCase()
    const isEmail = isValidEmail(cleanSearchTerm)
    try {
      const result = await api.get(
        '/profiles/search',
        {
          ...(isEmail ? { email: cleanSearchTerm } : { fullname: cleanSearchTerm }),
        },
        { accessToken }
      )
      setProfileSearchResults(result.profiles)
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (!value) {
      getProfiles([user.profile.id])
      return
    }
  }, [])

  useEffect(() => {
    if (!value?.length) return
    $('[data-toggle="tooltip"]').tooltip()
  }, [value, selectedAuthorProfiles])

  return (
    <div className={styles.profileSearch}>
      <div className={styles.selectedAuthors}>
        {displayAuthors?.map(({ authorId, authorName }, index) => {
          let authorProfile = selectedAuthorProfiles.find(
            (p) =>
              p.content.names.find((q) => q.username === authorId) ||
              p.content.emails.find((r) => r === authorId)
          ) ?? {
            noProfile: true,
            authorId,
            authorName,
          }
          const showArrowButton =
            displayAuthors.length !== 1 && index !== displayAuthors.length - 1
          return (
            <Author
              key={index}
              fieldName={fieldName}
              authorId={authorId}
              profile={authorProfile}
              showArrowButton={showArrowButton}
              displayAuthors={displayAuthors}
              setDisplayAuthors={setDisplayAuthors}
            />
          )
        })}
      </div>
      <form
        className={styles.searchForm}
        onSubmit={(e) => {
          e.preventDefault()
          searchProfile(searchTerm.trim())
        }}
      >
        <input
          type="text"
          className="form-control"
          value={searchTerm}
          placeholder="search profiles by email or name"
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setProfileSearchResults(null)
          }}
        />
        <button className="btn btn-sm" disabled={!searchTerm.trim()} type="submit">
          Search
        </button>
      </form>
      {/* <div className={styles.searchResults}>
        {isLoading ? (
          <LoadingSpinner inline={true} text={null} />
        ) : (
          renderProfileSearchResults()
        )}
      </div> */}
      <ProfileSearchResults
        isLoading={isLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        profileSearchResults={profileSearchResults}
        setProfileSearchResults={setProfileSearchResults}
        setSelectedAuthorProfiles={setSelectedAuthorProfiles}
        displayAuthors={displayAuthors}
        setDisplayAuthors={setDisplayAuthors}
      />
    </div>
  )
}

export default ProfileSearchWidget