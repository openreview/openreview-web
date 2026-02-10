/* globals promptError, $: false */

import { useContext, useState, useEffect, useCallback, useRef } from 'react'
import { maxBy, throttle, upperFirst } from 'lodash'
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  pointerWithin,
} from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable'
import EditorComponentContext from '../EditorComponentContext'
import IconButton from '../IconButton'
import LoadingSpinner from '../LoadingSpinner'
import PaginationLinks from '../PaginationLinks'
import SpinnerButton from '../SpinnerButton'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { getProfileName, isValidEmail } from '../../lib/utils'

import styles from '../../styles/components/ProfileSearchWidget.module.scss'
import Icon from '../Icon'

const getTitle = (profile, isEditor) => {
  if (!profile.content) return null
  const latestHistory =
    profile.content.history?.find((p) => !p.end) || maxBy(profile.content.history, 'end')

  const title = latestHistory
    ? `${latestHistory.position ? `${latestHistory.position}` : ''}${
        latestHistory.institution?.name ? ` at ${latestHistory.institution?.name}` : ''
      }${
        latestHistory.institution?.domain && isEditor
          ? ` (${latestHistory.institution?.domain})`
          : ''
      }`
    : ''
  return title
}

const checkIsInAuthorList = (selectedAuthors, profileToCheck, isAuthoridsField, multiple) => {
  const profileIds = profileToCheck.content?.names?.map((p) => p.username) ?? []
  if (isAuthoridsField) return selectedAuthors?.find((p) => profileIds.includes(p.authorId))
  return multiple && selectedAuthors?.find((p) => profileIds.includes(p.authorId))
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
  showDragSort,
  displayAuthors,
  setDisplayAuthors,
  allowAddRemove,
  isAuthoridsField,
  multiple,
  onChange,
}) => {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: authorId,
  })
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : 'none',
    transition,
  }
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
    <div className={styles.selectedAuthor} ref={setNodeRef} style={style}>
      {showDragSort && (
        <div className={styles.dragHandle} {...listeners}>
          <Icon name="menu-hamburger" />
        </div>
      )}
      <div className={styles.authorName}>
        {profile.noProfile ? (
          <span
            className={styles.authorNameLink}
            data-original-title={isDragging ? null : authorId}
            data-toggle="tooltip"
            data-placement="top"
          >
            {profile.authorName}
          </span>
        ) : (
          <a
            href={`/profile?id=${profile.id}`}
            data-original-title={isDragging ? null : authorId}
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
  field,
  onChange,
  clearError,
  isEditor,
}) => {
  const fieldName = Object.keys(field ?? {})[0]

  if (!profile) return null
  const preferredId = profile.content.names?.find((p) => p.preferred)?.username ?? profile.id

  return (
    <div className={styles.searchResultRow}>
      <div className={styles.basicInfo}>
        <div className={styles.authorFullName}>
          <a href={`/profile?id=${preferredId}`} target="_blank" rel="noreferrer">
            {preferredId.split(/([^~_0-9]+|[~_0-9]+)/g).map((segment, index) => {
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
          {profile?.active ? (
            <Icon
              name="ok-sign"
              tooltip="Profile is active"
              extraClasses="pl-1 text-success"
            />
          ) : (
            <Icon
              name="remove-sign"
              tooltip="Profile is not active"
              extraClasses="pl-1 text-danger"
            />
          )}
        </div>
        <div className={styles.authorTitle}>{getTitle(profile, isEditor)}</div>
      </div>
      <div className={styles.authorEmails}>
        {isEditor ? (
          profile.content?.emailsConfirmed?.map((email, index) => (
            <span key={index}>{email}</span>
          ))
        ) : (
          <span>{profile.content?.preferredEmail}</span>
        )}
      </div>
      <div className={styles.addButton}>
        <IconButton
          name="plus"
          disableButton={checkIsInAuthorList(
            displayAuthors,
            profile,
            isAuthoridsField,
            multiple
          )}
          disableReason="This author is already in author list"
          onClick={() => {
            const updatedAuthors = displayAuthors.concat({
              authorId: preferredId,
              authorName: getProfileName(profile),
            })
            setDisplayAuthors(updatedAuthors)
            if (isEditor === false) {
              onChange(
                preferredId,
                getProfileName(profile),
                profile?.content?.preferredEmail,
                profile
              )
            } else {
              onChange({
                fieldName,
                value: getUpdatedValue(updatedAuthors, isAuthoridsField, multiple),
              })
            }

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
  field,
  onChange,
  clearError,
  pageSize,
  pageListLength,
  isEditor,
  searchInputPlaceHolder,
  CustomProfileSearchForm,
}) => {
  const [searchTerm, setSearchTerm] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pageNumber, setPageNumber] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [profileSearchResults, setProfileSearchResults] = useState(null)
  const [showCustomAuthorForm, setShowCustomAuthorForm] = useState(false)

  // eslint-disable-next-line no-use-before-define
  const placeHolderName = getPlaceHolderName()

  function getPlaceHolderName() {
    if (!field) return null
    return Object.keys(field)[0] === 'authorids' ? 'author' : Object.keys(field)[0]
  }

  // eslint-disable-next-line no-shadow
  const searchProfiles = async (searchTerm, pageNumber, showLoadingSpinner = true) => {
    const cleanSearchTerm = searchTerm.trim()
    let paramKey = 'fullname'
    let paramValue = cleanSearchTerm.toLowerCase()
    if (isValidEmail(cleanSearchTerm)) {
      promptError('Searching by email is not supported.')
      return
    }
    if (cleanSearchTerm.startsWith('~')) {
      paramKey = 'id'
      paramValue = cleanSearchTerm
    }

    if (showLoadingSpinner) setIsLoading(true)
    try {
      const results = await api.get('/profiles/search', {
        [paramKey]: paramValue,
        es: true,
        limit: pageSize,
        offset: pageSize * (pageNumber - 1),
      })
      setTotalCount(results.count > 200 ? 200 : results.count)
      setProfileSearchResults(
        isEditor === false
          ? results.profiles
          : results.profiles.filter((p) => p.content.emails?.length)
      )
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
            setTotalCount={setTotalCount}
            setProfileSearchResults={setProfileSearchResults}
            setSearchTerm={setSearchTerm}
            displayAuthors={displayAuthors}
            setDisplayAuthors={setDisplayAuthors}
            fieldName={Object.keys(field ?? {})[0]}
            onChange={onChange}
            clearError={clearError}
            placeHolderName={placeHolderName}
            isEditor={isEditor}
          />
        ) : (
          <>
            <div className={styles.noMatchingProfileMessage}>
              {isEmptyResult
                ? 'No results found for your search query.'
                : 'Profile not found? Provide their information by clicking button below.'}
            </div>

            <button
              className={`btn btn-xs ${styles.enterAuthorButton}`}
              onClick={() => setShowCustomAuthorForm(true)}
            >
              {`Manually Enter${
                placeHolderName ? ` ${upperFirst(placeHolderName)}` : ''
              } Info`}
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
              field={field}
              onChange={onChange}
              clearError={clearError}
              isEditor={isEditor}
            />
          ))}
          <PaginationLinks
            currentPage={pageNumber ?? 1}
            itemsPerPage={pageSize}
            totalCount={totalCount}
            setCurrentPage={setPageNumber}
            options={{ noScroll: true, showCount: false, pageListLength }}
          />
        </>

        {(pageNumber ?? 1) * pageSize >= totalCount && displayCustomAuthorForm(false)}
      </div>
    )
  }

  useEffect(() => {
    if (!searchTerm || !pageNumber) return
    searchProfiles(searchTerm, pageNumber, false)
  }, [pageNumber])

  useEffect(() => {
    if (!profileSearchResults?.length) return
    $('[data-toggle="tooltip"]').tooltip()
  }, [profileSearchResults])

  if (isLoading)
    return (
      <LoadingSpinner
        inline={true}
        text={null}
        extraClass={isEditor === false ? styles.spinnerSmall : ''}
      />
    )
  return (
    <>
      {CustomProfileSearchForm ? (
        <CustomProfileSearchForm
          error={error}
          styles={styles}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setProfileSearchResults={setProfileSearchResults}
          setShowCustomAuthorForm={setShowCustomAuthorForm}
          searchProfiles={searchProfiles}
          setPageNumber={setPageNumber}
        />
      ) : (
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
            placeholder={searchInputPlaceHolder}
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
      )}

      {displayResults()}
    </>
  )
}

const CustomAuthorForm = ({
  setTotalCount,
  setProfileSearchResults,
  setSearchTerm,
  displayAuthors,
  setDisplayAuthors,
  fieldName,
  onChange,
  clearError,
  placeHolderName,
  isEditor,
}) => {
  const [customAuthorName, setCustomAuthorName] = useState('')
  const [customAuthorEmail, setCustomAuthorEmail] = useState('')

  const disableAddButton =
    !(customAuthorName.trim() && isValidEmail(customAuthorEmail)) ||
    displayAuthors.find((p) => p.authorId === customAuthorEmail.trim().toLowerCase())

  const handleAddCustomAuthor = async () => {
    const cleanAuthorName = customAuthorName.trim()
    const cleanAuthorEmail = customAuthorEmail.trim().toLowerCase()

    // add the author using email
    clearError?.()
    const updatedAuthors = displayAuthors.concat({
      authorId: cleanAuthorEmail,
      authorName: cleanAuthorName,
    })
    setDisplayAuthors(updatedAuthors)
    if (isEditor === false) {
      onChange(undefined, cleanAuthorName, cleanAuthorEmail, undefined)
    } else {
      onChange({
        fieldName,
        value: updatedAuthors,
      })
    }

    setTotalCount(0)
    setProfileSearchResults(null)
    setSearchTerm('')
  }

  return (
    <form className={styles.customAuthorForm}>
      <label htmlFor="fullName">Full Name:</label>
      <input
        type="text"
        name="fullName"
        className="form-control"
        value={customAuthorName}
        placeholder={`Full name${placeHolderName ? ` of the ${placeHolderName}` : ''} to add`}
        onChange={(e) => setCustomAuthorName(e.target.value)}
      />
      <label htmlFor="email">Email:</label>
      <input
        type="email"
        name="email"
        className="form-control"
        value={customAuthorEmail}
        placeholder={`Email${placeHolderName ? ` of the ${placeHolderName}` : ''} to add`}
        onChange={(e) => setCustomAuthorEmail(e.target.value)}
      />
      <SpinnerButton
        className="btn btn-sm"
        disabled={disableAddButton}
        onClick={handleAddCustomAuthor}
      >
        Add
      </SpinnerButton>
    </form>
  )
}

const ProfileSearchWidget = ({
  multiple = false,
  isEditor = true,
  field: propsField,
  pageSize = 20,
  pageListLength,
  searchInputPlaceHolder = 'search profiles by name or OpenReview tilde id',
  onChange: propsOnChange,
  value: propsValue,
  error: propsError,
  className,
  CustomProfileSearchForm,
}) => {
  const { user, isRefreshing } = useUser()
  const editorComponentContext = useContext(EditorComponentContext) ?? {}
  const { field, onChange, value, error, clearError } = isEditor
    ? editorComponentContext
    : { field: propsField, onChange: propsOnChange, value: propsValue, error: propsError }
  const fieldName = Object.keys(field ?? {})[0]
  const isAuthoridsField = fieldName === 'authorids'
  const allowUserDefined =
    !isEditor || (field?.[fieldName].value?.param?.regex?.includes('|') && isAuthoridsField)
  const allowAddRemove = isEditor ? field?.[fieldName].value?.param?.regex : true
  const [selectedAuthorProfiles, setSelectedAuthorProfiles] = useState([])
  const [displayAuthors, setDisplayAuthors] = useState(!multiple && value ? [value] : value) // id+email
  const displayAuthorsRef = useRef(displayAuthors)

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))

  const handleDragOver = useCallback(
    throttle((event) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const currentAuthors = displayAuthorsRef.current
        const oldIndex = currentAuthors.findIndex((p) => p.authorId === active.id)
        const newIndex = currentAuthors.findIndex((p) => p.authorId === over.id)
        const updatedValue = arrayMove(currentAuthors, oldIndex, newIndex)
        setDisplayAuthors(updatedValue)
      }
    }, 250),
    []
  )

  const handleDragEnd = () => {
    onChange({
      fieldName,
      value: isAuthoridsField ? displayAuthors : displayAuthors.map((p) => p.authorId),
    })
  }

  const getProfiles = async (authorIds) => {
    try {
      const ids = authorIds.filter((p) => p.startsWith('~'))
      const allProfiles = ids.length
        ? await api
            .post('/profiles/search', {
              ids,
            })
            .then((result) => result.profiles)
        : []
      setSelectedAuthorProfiles(allProfiles)
      if (!value) {
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

      const authorsWithPreferredNames = authorIds.map((authorId) => {
        const profile = allProfiles.find((q) =>
          q.content.names.find((r) => r.username === authorId)
        )
        if (!profile) {
          return {
            authorId,
            authorName: value?.find((p) => p.authorId === authorId)?.authorName ?? authorId,
          }
        }
        const preferredId =
          profile?.content?.names?.find((name) => name.preferred)?.username ??
          profile?.id ??
          authorId
        return {
          authorId: preferredId,
          authorName: profile ? getProfileName(profile) : preferredId,
        }
      })
      setDisplayAuthors(authorsWithPreferredNames)
      if (isAuthoridsField) {
        // none-authorids field has only id which does not change
        onChange({
          fieldName,
          value: authorsWithPreferredNames,
        })
      }
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!isAuthoridsField) {
      if (!isEditor) {
        setDisplayAuthors([])
        return
      }
      // eslint-disable-next-line no-unused-expressions
      value ? getProfiles(multiple ? value : [value]) : setDisplayAuthors([])
      return
    }
    if (!value) {
      getProfiles([user.profile.id])
      return
    }
    onChange({ fieldName, value: displayAuthors }) // update the value in the editor context to contain both id and name
    if (allowAddRemove) getProfiles(multiple ? value.map((p) => p.authorId) : [value.authorId])
  }, [isRefreshing])

  useEffect(() => {
    if (!value?.length) return
    $('[data-toggle="tooltip"]').tooltip()
    displayAuthorsRef.current = displayAuthors
  }, [value, displayAuthors])

  return (
    <div className={`${styles.profileSearch} ${className}`}>
      <div className={styles.selectedAuthors}>
        <DndContext
          sensors={sensors}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          collisionDetection={pointerWithin}
        >
          <SortableContext
            items={displayAuthors?.map((p) => p.authorId) ?? []}
            strategy={() => null}
          >
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
                <Author
                  key={index}
                  fieldName={fieldName}
                  authorId={authorId}
                  profile={authorProfile}
                  showArrowButton={showArrowButton}
                  showDragSort={displayAuthors.length > 5}
                  displayAuthors={displayAuthors}
                  setDisplayAuthors={setDisplayAuthors}
                  allowAddRemove={allowAddRemove}
                  isAuthoridsField={isAuthoridsField}
                  multiple={multiple}
                  onChange={onChange}
                />
              )
            })}
          </SortableContext>
        </DndContext>
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
          field={field}
          onChange={onChange}
          clearError={clearError}
          pageSize={pageSize}
          pageListLength={pageListLength}
          isEditor={isEditor}
          searchInputPlaceHolder={searchInputPlaceHolder}
          CustomProfileSearchForm={CustomProfileSearchForm}
        />
      )}
    </div>
  )
}

export default ProfileSearchWidget
