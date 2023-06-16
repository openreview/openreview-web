/* globals promptError, $: false */

import { maxBy } from 'lodash'
import React, { useContext, useState, useEffect } from 'react'
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

const checkIsInAuthorList = (selectedAuthors, idToCheck, isAuthoridsField, multiple) => {
  if (isAuthoridsField) return selectedAuthors?.find((p) => p.authorId === idToCheck)
  return multiple ? selectedAuthors?.includes(idToCheck) : selectedAuthors === idToCheck
}

const getUpdatedValue = (updatedDisplayAuthors, isAuthoridsField, multiple) => {
  if (!updatedDisplayAuthors.length) return undefined
  if (isAuthoridsField) return updatedDisplayAuthors
  return multiple
    ? updatedDisplayAuthors.map((p) => p.authorId)
    : updatedDisplayAuthors[0].authorId
}

const Author = ({
  fieldName,
  authorId,
  profile,
  showArrowButton,
  displayAuthors,
  setDisplayAuthors,
  allowAddRemove,
  isAuthoridsField,
  multiple,
}) => {
  const { onChange } = useContext(EditorComponentContext)

  const increaseAuthorIndex = () => {
    const authorIndex = displayAuthors.findIndex((p) => p.authorId === authorId)

    const updatedValue = [...displayAuthors]
    updatedValue.splice(authorIndex, 1)
    updatedValue.splice(authorIndex + 1, 0, displayAuthors[authorIndex])
    onChange({
      fieldName,
      value: isAuthoridsField ? updatedValue : updatedValue.map((p) => p.authorId),
    })
    setDisplayAuthors(updatedValue)
  }

  if (!profile) return null

  return (
    <div className={styles.selectedAuthor}>
      <div className={styles.authorName}>
        {profile.noProfile ? (
          <span
            className={styles.authorNameLink}
            data-original-title={authorId}
            data-toggle="tooltip"
            data-placement="top"
          >
            {profile.authorName}
          </span>
        ) : (
          <a
            href={`/profile?id=${profile.id}`}
            data-original-title={authorId}
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
        {allowAddRemove && (
          <IconButton
            name="remove"
            onClick={() => {
              const updatedAuthors = displayAuthors.filter((p) => p.authorId !== authorId)

              setDisplayAuthors(updatedAuthors)
              onChange({
                fieldName,
                value: getUpdatedValue(updatedAuthors, isAuthoridsField, multiple),
              })
            }}
            extraClasses="remove-button"
          />
        )}
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
  isAuthoridsField,
  multiple,
}) => {
  const { field, onChange, value, clearError } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]

  if (!profile) return null

  return (
    <div className={styles.searchResultRow}>
      <div className={styles.basicInfo}>
        <div className={styles.authorFullName}>
          <a href={`/profile?id=${profile.id}`} target="_blank" rel="noreferrer">
            {profile.id.split(/([^~_0-9]+|[~_0-9]+)/g).map((segment, index) => {
              if (/[^~_0-9]+/.test(segment)) {
                return (
                  <span className={styles.nameSegment} key={index}>
                    {segment}
                  </span>
                )
              }
              return (
                <span className={styles.idSegment} key={index}>
                  {segment}
                </span>
              )
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
          disableButton={checkIsInAuthorList(value, profile?.id, isAuthoridsField, multiple)}
          disableReason="This author is already in author list"
          onClick={() => {
            const updatedAuthors = displayAuthors.concat({
              authorId: profile.id,
              authorName: getProfileName(profile),
            })
            setDisplayAuthors(updatedAuthors)
            onChange({
              fieldName,
              value: getUpdatedValue(updatedAuthors, isAuthoridsField, multiple),
            })

            clearError?.()
            setProfileSearchResults(null)
            setSearchTerm('')
            setSelectedAuthorProfiles((existingProfiles) => [...existingProfiles, profile])
          }}
        />
      </div>
    </div>
  )
}

const ProfileSearchFormAndResults = ({
  setSelectedAuthorProfiles,
  displayAuthors,
  setDisplayAuthors,
  allowUserDefined,
  error,
  isAuthoridsField,
  multiple,
}) => {
  const [searchTerm, setSearchTerm] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pageNumber, setPageNumber] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [profileSearchResults, setProfileSearchResults] = useState(null)
  const [showCustomAuthorForm, setShowCustomAuthorForm] = useState(false)
  const { accessToken } = useUser()
  const pageSize = 15

  // eslint-disable-next-line no-shadow
  const searchProfiles = async (searchTerm, pageNumber, showLoadingSpinner = true) => {
    const cleanSearchTerm = searchTerm.trim()
    let paramKey = 'fullname'
    let paramValue = cleanSearchTerm.toLowerCase()
    if (isValidEmail(cleanSearchTerm)) {
      paramKey = 'email'
    } else if (cleanSearchTerm.startsWith('~')) {
      paramKey = 'id'
      paramValue = cleanSearchTerm
    }

    if (showLoadingSpinner) setIsLoading(true)
    try {
      const results = await api.get(
        '/profiles/search',
        {
          [paramKey]: paramValue,
          es: true,
          limit: pageSize,
          offset: pageSize * (pageNumber - 1),
        },
        { accessToken }
      )
      setTotalCount(results.count)
      setProfileSearchResults(results.profiles)
    } catch (apiError) {
      promptError(apiError.message)
    }
    if (showLoadingSpinner) setIsLoading(false)
  }

  const displayCustomAuthorForm = (isEmptyResult) => {
    if (!allowUserDefined && isEmptyResult)
      return (
        <div className={styles.noMatchingProfile}>
          <div className={styles.noMatchingProfileMessage}>
            No results found for your search query.
          </div>
        </div>
      )
    if (!allowUserDefined) return null
    return (
      <div className={styles.noMatchingProfile}>
        {showCustomAuthorForm ? (
          <CustomAuthorForm
            searchTerm={searchTerm}
            setProfileSearchResults={setProfileSearchResults}
            setSearchTerm={setSearchTerm}
            displayAuthors={displayAuthors}
            setDisplayAuthors={setDisplayAuthors}
          />
        ) : (
          <>
            <div className={styles.noMatchingProfileMessage}>
              {isEmptyResult
                ? 'No results found for your search query.'
                : 'Coauthor not found? Provide their information by clicking button below.'}
            </div>

            <button
              className={`btn btn-xs ${styles.enterAuthorButton}`}
              onClick={() => setShowCustomAuthorForm(true)}
            >
              Manually Enter Author Info
            </button>
          </>
        )}
      </div>
    )
  }

  const displayResults = () => {
    if (!profileSearchResults) return null
    if (!profileSearchResults.length) return displayCustomAuthorForm(true)
    return (
      <div className={styles.searchResults}>
        {!showCustomAuthorForm && (
          <>
            {profileSearchResults.map((profile, index) => (
              <ProfileSearchResultRow
                key={index}
                profile={profile}
                setProfileSearchResults={setProfileSearchResults}
                setSearchTerm={setSearchTerm}
                setSelectedAuthorProfiles={setSelectedAuthorProfiles}
                displayAuthors={displayAuthors}
                setDisplayAuthors={setDisplayAuthors}
                isAuthoridsField={isAuthoridsField}
                multiple={multiple}
              />
            ))}
            <PaginationLinks
              currentPage={pageNumber ?? 1}
              itemsPerPage={pageSize}
              totalCount={totalCount}
              setCurrentPage={setPageNumber}
              options={{ noScroll: true, showCount: true }}
            />
          </>
        )}
        {(pageNumber ?? 1) * pageSize >= totalCount && displayCustomAuthorForm(false)}
      </div>
    )
  }

  useEffect(() => {
    if (!searchTerm || !pageNumber) return
    searchProfiles(searchTerm, pageNumber, false)
  }, [pageNumber])

  if (isLoading) return <LoadingSpinner inline={true} text={null} />

  return (
    <>
      <form
        className={styles.searchForm}
        onSubmit={(e) => {
          e.preventDefault()
          setShowCustomAuthorForm(false)
          searchProfiles(searchTerm, 1)
          setPageNumber(null)
        }}
      >
        <input
          type="text"
          className={`form-control ${error ? styles.invalidValue : ''}`}
          value={searchTerm ?? ''}
          placeholder="search profiles by email or name"
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setProfileSearchResults(null)
          }}
        />
        <button
          className={`btn btn-sm ${error ? styles.invalidValue : ''}`}
          disabled={!searchTerm?.trim()}
          type="submit"
        >
          Search
        </button>
      </form>
      {displayResults()}
    </>
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
    if (!searchTerm) return
    const cleanSearchTerm = searchTerm.trim()
    if (isValidEmail(cleanSearchTerm)) {
      setCustomAuthorEmail(cleanSearchTerm.toLowerCase())
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

const ProfileSearchWidget = ({ multiple = false }) => {
  const { user, accessToken } = useUser()
  const { field, onChange, value, error } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const isAuthoridsField = fieldName === 'authorids'
  const allowUserDefined =
    field[fieldName].value?.param?.regex?.includes('|') && isAuthoridsField
  const allowAddRemove = field[fieldName].value?.param?.regex
  const [selectedAuthorProfiles, setSelectedAuthorProfiles] = useState([])
  const [displayAuthors, setDisplayAuthors] = useState(!multiple && value ? [value] : value) // id+email

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
      if (!isAuthoridsField) {
        setDisplayAuthors(
          authorIds.map((p) => {
            const profile = allProfiles.find((q) =>
              q.content.names.find((r) => r.username === p)
            )
            return {
              authorId: p,
              authorName: profile ? getProfileName(profile) : p,
            }
          })
        )
      }
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  useEffect(() => {
    if (!isAuthoridsField) {
      // eslint-disable-next-line no-unused-expressions
      value ? getProfiles(multiple ? value : [value]) : setDisplayAuthors([])
      return
    }
    if (!value) {
      getProfiles([user.profile.id])
      return
    }
    onChange({ fieldName, value: displayAuthors }) // update the value in the editor context to contain both id and name
  }, [])

  useEffect(() => {
    if (!value?.length) return
    $('[data-toggle="tooltip"]').tooltip()
  }, [value, displayAuthors])

  return (
    <div className={styles.profileSearch}>
      <div className={styles.selectedAuthors}>
        {displayAuthors?.map(({ authorId, authorName }, index) => {
          const authorProfile = selectedAuthorProfiles.find(
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
            <React.Fragment key={index}>
              {index > 0 && <span className={styles.authorSeparator}>,</span>}
              <Author
                fieldName={fieldName}
                authorId={authorId}
                profile={authorProfile}
                showArrowButton={showArrowButton}
                displayAuthors={displayAuthors}
                setDisplayAuthors={setDisplayAuthors}
                allowAddRemove={allowAddRemove}
                isAuthoridsField={isAuthoridsField}
                multiple={multiple}
              />
            </React.Fragment>
          )
        })}
      </div>

      {allowAddRemove && (multiple || !displayAuthors?.length) && (
        <ProfileSearchFormAndResults
          setSelectedAuthorProfiles={setSelectedAuthorProfiles}
          displayAuthors={displayAuthors}
          setDisplayAuthors={setDisplayAuthors}
          allowUserDefined={allowUserDefined}
          error={error}
          isAuthoridsField={isAuthoridsField}
          multiple={multiple}
        />
      )}
    </div>
  )
}

export default ProfileSearchWidget
