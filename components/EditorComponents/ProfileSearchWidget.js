import { debounce, maxBy } from 'lodash'
import { useContext, useState, useEffect, useCallback } from 'react'
import useUser from '../../hooks/useUser'
import { isValidEmail } from '../../lib/utils'
import api from '../../lib/api-client'
import IconButton from '../IconButton'

import styles from '../../styles/components/ProfileSearchWidget.module.scss'
import EditorComponentContext from '../EditorComponentContext'
import LoadingSpinner from '../LoadingSpinner'

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

const AuthorRow = ({ profile }) => {
  if (!profile) return null
  return (
    <div className={styles.selectedAuthor}>
      <div className={styles.authorName}>
        <a href={`/profile?id=${profile.id}`} target="_blank" rel="noreferrer">
          {profile.id}
        </a>
      </div>
      <div className={styles.removeButton}>
        <IconButton name="remove" onClick={() => {}} />
      </div>
    </div>
  )
}

const ProfileSearchResultRow = ({ profile }) => {
  if (!profile) return null
  return (
    <div className={styles.searchResultRow}>
      <div className={styles.basicInfo}>
        <div className={styles.authorFullName}>
          <a href={`/profile?id=${profile.id}`} target="_blank" rel="noreferrer">
            {profile.id.split(new RegExp(`([^~_0-9]+|[~_0-9]+)`, 'g')).map((segment) => {
              if (/[^~_0-9]+/.test(segment)) {
                return <span className={styles.nameSegment}>{segment}</span>
              } else {
                return <span className={styles.idSegment}>{segment}</span>
              }
            })}
          </a>
        </div>
        <div className={styles.authorTitle}>{getTitle()}</div>
      </div>
      <div className={styles.authorEmails}>
        {profile.content?.emailsConfirmed?.map((email) => (
          <span key={email}>{email}</span>
        ))}
      </div>
      <div className={styles.addButton}>
        <IconButton name="plus" onClick={() => {}} />
      </div>
    </div>
  )
}

const ProfileSearchWidget = () => {
  const { user, accessToken } = useUser()
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const [selectedAuthorProfiles, setSelectedAuthorProfiles] = useState([])
  const [selectedAuthorIds, setSelectedAuthorIds] = useState([])
  const [profileSearchResults, setProfileSearchResults] = useState(null)
  // const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      setSelectedAuthorProfiles(
        (profileResults[0].profiles ?? []).concat(profileResults[1].profiles ?? [])
      )
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

  const renderProfileSearchResults = () => {
    if (!profileSearchResults) return null
    if (!profileSearchResults.length)
      return (
        <div className={styles.noMatchingProfile}>
          <span>
            No matching profiles found. <br />
            Please enter the author's full name and email below, then click Add button to add
            the author.
          </span>
          <form
            className={styles.customAuthorForm}
            onSubmit={(e) => {
              e.preventDefault()
              searchProfile(searchTerm.trim())
            }}
          >
            <label htmlFor="fullName">Full Name:</label>
            <input
              type="text"
              name="fullName"
              className="form-control"
              value={searchTerm}
              placeholder="full name of the author you wat to add"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={searchTerm}
              placeholder="full name of the author you wat to add"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-sm" disabled={!searchTerm.trim()} type="submit">
              Add
            </button>
          </form>
        </div>
      )
    return profileSearchResults.map((profile) => (
      <ProfileSearchResultRow profile={profile} key={profile.id} />
    ))
  }

  useEffect(() => {
    setSelectedAuthorIds([user.profile.id])
  }, [])

  useEffect(() => {
    getProfiles(selectedAuthorIds)
  }, [selectedAuthorIds])

  return (
    <div className={styles.profileSearch}>
      {selectedAuthorIds.map((authorId) => {
        const authorProfile = selectedAuthorProfiles.find((p) => p.id === authorId)
        console.log('selectedAuthorProfiles', selectedAuthorProfiles)
        console.log('authorId', authorId)
        return <AuthorRow key={authorId} profile={authorProfile} />
      })}
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
          placeholder="search profiles by name or email"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-sm" disabled={!searchTerm.trim()} type="submit">
          Search
        </button>
      </form>
      <div className={styles.searchResults}>
        {isLoading ? (
          <LoadingSpinner inline={true} text={null} />
        ) : (
          renderProfileSearchResults()
        )}
      </div>
    </div>
  )
}

export default ProfileSearchWidget
