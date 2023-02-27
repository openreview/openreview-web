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

const Author = ({ fieldName, authorId, profile, showArrowButton }) => {
  const { onChange, value } = useContext(EditorComponentContext)

  const increaseAuthorIndex = () => {
    const authorIndex = value.findIndex((p) => p === authorId)
    const updatedValue = [...value]
    updatedValue.splice(authorIndex, 1)
    updatedValue.splice(authorIndex + 1, 0, authorId)
    onChange({ fieldName, value: updatedValue })
  }

  if (!profile) return null
  return (
    <div className={styles.selectedAuthor}>
      <div className={styles.authorName} title={''} data-toggle="tooltip" data-placement="top">
        <a href={`/profile?id=${profile.id}`} target="_blank" rel="noreferrer">
          {profile.id}
        </a>
      </div>
      <div className={styles.actionButtons}>
        <IconButton
          name="remove"
          onClick={() => {
            onChange({ fieldName, value: value.filter((p) => p !== authorId) })
          }}
          extraClasses="action-button"
        />
        {showArrowButton && <IconButton name="arrow-right" onClick={increaseAuthorIndex} />}
      </div>
    </div>
  )
}

const ProfileSearchResultRow = ({
  fieldName,
  profile,
  setProfileSearchResults,
  setSearchTerm,
}) => {
  const { onChange, value } = useContext(EditorComponentContext)
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
        <div className={styles.authorTitle}>{getTitle(profile)}</div>
      </div>
      <div className={styles.authorEmails}>
        {profile.content?.emailsConfirmed?.map((email) => (
          <span key={email}>{email}</span>
        ))}
      </div>
      <div className={styles.addButton}>
        <IconButton
          name="plus"
          onClick={() => {
            onChange({ fieldName, value: value.concat(profile.id) })
            setProfileSearchResults(null)
            setSearchTerm('')
          }}
        />
      </div>
    </div>
  )
}

const CustomAuthorForm = ({ searchTerm }) => {
  const [customAuthorName, ame] = useState('')
  const [customAuthorEmail, setCustomAuthorEmail] = useState('')

  const disableAddButton = !(customAuthorName.trim() && isValidEmail(customAuthorEmail))

  useEffect(() => {
    const cleanSearchTerm = searchTerm.trim()
    if (isValidEmail(cleanSearchTerm)) {
      setCustomAuthorEmail(cleanSearchTerm)
    } else {
      ame(cleanSearchTerm)
    }
  }, [searchTerm])

  return (
    <form
      className={styles.customAuthorForm}
      onSubmit={(e) => {
        e.preventDefault()
      }}
    >
      <label htmlFor="fullName">Full Name:</label>
      <input
        type="text"
        name="fullName"
        className="form-control"
        value={customAuthorName}
        placeholder="full name of the author to add"
        onChange={(e) => ame(e.target.value)}
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
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const [selectedAuthorProfiles, setSelectedAuthorProfiles] = useState([])
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
    // setCustomAuthorEmail('')
    // ame('')
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
      // if (!result.profiles?.length) {
      //   isEmail ? setCustomAuthorEmail(cleanSearchTerm) : ame(cleanSearchTerm)
      // }
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
          <CustomAuthorForm searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
      )
    return profileSearchResults.map((profile) => (
      <ProfileSearchResultRow
        key={profile.id}
        fieldName={fieldName}
        profile={profile}
        setProfileSearchResults={setProfileSearchResults}
        setSearchTerm={setSearchTerm}
      />
    ))
  }

  useEffect(() => {
    onChange({ fieldName, value: [user.profile.id] })
  }, [])

  useEffect(() => {
    if (!value?.length) return
    getProfiles(value)
    $('[data-toggle="tooltip"]').tooltip()
  }, [value])

  return (
    <div className={styles.profileSearch}>
      <div className={styles.selectedAuthors}>
        {value?.map((authorId, index) => {
          const authorProfile = selectedAuthorProfiles.find((p) => p.id === authorId)
          const showArrowButton = value.length !== 1 && index !== value.length - 1
          return (
            <Author
              key={authorId}
              fieldName={fieldName}
              authorId={authorId}
              profile={authorProfile}
              showArrowButton={showArrowButton}
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
