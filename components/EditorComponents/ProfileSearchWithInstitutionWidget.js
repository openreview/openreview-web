/* globals promptError, $: false */

import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { throttle, maxBy } from 'lodash'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import useUser from '../../hooks/useUser'
import EditorComponentContext from '../EditorComponentContext'
import styles from '../../styles/components/ProfileSearchWidget.module.scss'
import api from '../../lib/api-client'
import { getProfileName, inflect, isValidEmail } from '../../lib/utils'
import Icon from '../Icon'
import IconButton from '../IconButton'
import MultiSelectorDropdown from '../MultiSelectorDropdown'
import LoadingSpinner from '../LoadingSpinner'
import PaginationLinks from '../PaginationLinks'

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

const getInstitutionOptionsFromProfile = (profile) => {
  const institutionOptions = []
  profile?.content?.history?.forEach((history) => {
    const { institution } = history
    if (institutionOptions.find((p) => p.value === institution.domain)) return
    institutionOptions.push({
      label: `${institution.name} (${institution.domain})`,
      value: institution.domain,
      name: institution.name,
      domain: institution.domain,
      countryRegigon: institution.country,
    })
  })
  return institutionOptions
}

const checkIsInAuthorList = (selectedAuthors, profileToCheck) => {
  console.log('selectedAuthors', selectedAuthors)
  console.log('profileToCheck', profileToCheck)
  const profileIds = profileToCheck.content?.names?.map((p) => p.username) ?? []
  return selectedAuthors?.find((p) => profileIds.includes(p.username))
}

const Author = ({
  fieldName,
  username,
  profile,
  showArrowButton,
  showDragSort,
  displayAuthors,
  setDisplayAuthors,
  allowAddRemove,
  onChange,
}) => {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: username,
  })

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : 'none',
    transition,
  }

  const increaseAuthorIndex = () => {
    const authorIndex = displayAuthors.findIndex((p) => p.username === username)
    const updatedValue = [...displayAuthors]
    updatedValue.splice(authorIndex, 1)
    updatedValue.splice(authorIndex + 1, 0, displayAuthors[authorIndex])
    onChange({
      fieldName,
      value: updatedValue,
    })
    setDisplayAuthors(updatedValue)
  }

  const handleInstitutionChange = (newValues) => {
    const updatedAuthors = displayAuthors.map((p) => {
      if (p.username !== username) return p
      const selectedInstitutions = p.institutionOptions.filter((option) =>
        newValues.includes(option.value)
      )
      return {
        ...p,
        selectedInstitutions,
      }
    })
    setDisplayAuthors(updatedAuthors)
    onChange({
      fieldName,
      value: updatedAuthors,
    })
  }

  if (!profile) return null

  return (
    <div className={styles.selectedAuthor} ref={setNodeRef} style={style}>
      <div className={styles.authorHeader}>
        {showDragSort && (
          <div className={styles.dragHandle} {...listeners}>
            <Icon name="menu-hamburger" />
          </div>
        )}
        <div className={styles.authorName}>
          <a
            href={`/profile?id=${profile.username}`}
            data-original-title={isDragging ? null : username}
            data-toggle="tooltip"
            data-placement="top"
            target="_blank"
            rel="noreferrer"
            className={styles.authorNameLink}
          >
            {profile.fullname}
          </a>
        </div>
        <div className={styles.actionButtons}>
          {allowAddRemove && (
            <IconButton
              name="remove"
              onClick={() => {
                const updatedAuthors = displayAuthors.filter((p) => p.username !== username)

                setDisplayAuthors(updatedAuthors)
                onChange({
                  fieldName,
                  value: updatedAuthors,
                })
              }}
              extraClasses="remove-button"
            />
          )}
          {showArrowButton && <IconButton name="arrow-right" onClick={increaseAuthorIndex} />}
        </div>
      </div>

      <div className={styles.authorInstitution}>
        <MultiSelectorDropdown
          key={profile.username}
          disabled={!profile.institutionOptions.length}
          extraClass={styles.authorInstitutionDropdown}
          options={profile.institutionOptions}
          selectedValues={profile.selectedInstitutions?.map((p) => p.domain)}
          setSelectedValues={handleInstitutionChange}
          displayTextFn={(selectedValues) => {
            if (!profile.institutionOptions.length) return 'No Active Institution'
            return selectedValues.length === 0
              ? 'Add Institution'
              : `${inflect(selectedValues.length, 'Institution', 'Institutions', true)} added`
          }}
        />
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
          disableButton={checkIsInAuthorList(displayAuthors, profile)}
          disableReason="This author is already in author list"
          onClick={() => {
            const institutionOptions = getInstitutionOptionsFromProfile(profile)
            const updatedAuthors = displayAuthors.concat({
              username: preferredId,
              fullname: getProfileName(profile),
              institutionOptions,
              selectedInstitutions: institutionOptions.length ? [institutionOptions[0]] : [],
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
                value: updatedAuthors,
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
  error,
  field,
  onChange,
  clearError,
}) => {
  const [searchTerm, setSearchTerm] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pageNumber, setPageNumber] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [profileSearchResults, setProfileSearchResults] = useState(null)
  const { accessToken } = useUser()
  const pageSize = 5

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
      setTotalCount(results.count > 200 ? 200 : results.count)
      setProfileSearchResults(results.profiles.filter((p) => p.content.emails?.length))
    } catch (apiError) {
      promptError(apiError.message)
    }
    if (showLoadingSpinner) setIsLoading(false)
  }

  const displayCustomAuthorForm = (isEmptyResult) => {
    if (isEmptyResult)
      return (
        <div className={styles.noMatchingProfile}>
          <div className={styles.noMatchingProfileMessage}>
            No results found for your search query.
          </div>
        </div>
      )
    return null
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
              isAuthoridsField={true}
              multiple={true}
              field={field}
              onChange={onChange}
              clearError={clearError}
              isEditor={true}
            />
          ))}
          <PaginationLinks
            currentPage={pageNumber ?? 1}
            itemsPerPage={pageSize}
            totalCount={totalCount}
            setCurrentPage={setPageNumber}
            options={{ noScroll: true, showCount: false }}
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

  if (isLoading) return <LoadingSpinner inline={true} text={null} />
  return (
    <>
      <form
        className={styles.searchForm}
        onSubmit={(e) => {
          e.preventDefault()
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

const ProfileSearchWithInstitutionWidget = ({ multiple = false }) => {
  const { user, accessToken, isRefreshing } = useUser()
  const { field, onChange, value, error, clearError } = useContext(EditorComponentContext)
  // const allowAddRemove = field?.authors?.value?.param?.regex // only work with authors field
  const reorderOnly = !field?.authors?.value?.param
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))
  const [displayAuthors, setDisplayAuthors] = useState(null)
  const [selectedAuthorProfiles, setSelectedAuthorProfiles] = useState([])
  const displayAuthorsRef = useRef(displayAuthors)

  const handleDragOver = useCallback(
    throttle((event) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const currentAuthors = displayAuthorsRef.current
        const oldIndex = currentAuthors.findIndex((p) => p.username === active.id)
        const newIndex = currentAuthors.findIndex((p) => p.username === over.id)
        const updatedValue = arrayMove(currentAuthors, oldIndex, newIndex)
        setDisplayAuthors(updatedValue)
      }
    }, 250),
    []
  )

  const handleDragEnd = () => {
    onChange({
      fieldName: 'authors',
      value: displayAuthors,
    })
  }

  const getProfiles = async (authorIds) => {
    try {
      const { profiles } = await api.post(
        '/profiles/search',
        {
          ids: authorIds,
        },
        { accessToken }
      )

      setSelectedAuthorProfiles(profiles)
      if (!value) {
        const currentAuthorProfile = profiles.find((p) =>
          p.content.names.find((q) => q.username === user.profile.id)
        )
        const institutionOptions = getInstitutionOptionsFromProfile(currentAuthorProfile)
        const username = user.profile.id
        const fullname = getProfileName(currentAuthorProfile)
        const selectedInstitutions = institutionOptions.length ? [institutionOptions[0]] : []
        setDisplayAuthors([
          {
            username,
            fullname,
            selectedInstitutions,
            institutionOptions,
          },
        ])
        onChange({
          fieldName: 'authors',
          value: [
            {
              username,
              fullname,
              institutions: selectedInstitutions.map((p) => ({
                name: p.name,
                domain: p.domain,
                country: p.countryRegigon,
              })),
            },
          ],
        })
      }
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!value) {
      getProfiles([user.profile.id])
      return
    }
    onChange({ fieldName: 'authors', value: displayAuthors })
    if (!reorderOnly) getProfiles(multiple ? value.map((p) => p.authorId) : [value.authorId])
  }, [isRefreshing])

  useEffect(() => {
    if (!value?.length) return
    $('[data-toggle="tooltip"]').tooltip()
    displayAuthorsRef.current = displayAuthors
  }, [value, displayAuthors])

  return (
    <div className={styles.profileSearchWithInstitution}>
      <div className={styles.selectedAuthors}>
        <DndContext
          sensors={sensors}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          collisionDetection={pointerWithin}
        >
          <SortableContext
            items={displayAuthors?.map((p) => p.username) ?? []}
            strategy={() => null}
          >
            {displayAuthors?.map((profile, index) => {
              const showArrowButton =
                displayAuthors.length !== 1 && index !== displayAuthors.length - 1
              return (
                <Author
                  key={index}
                  fieldName="authors"
                  username={profile.username}
                  profile={profile}
                  showArrowButton={showArrowButton}
                  showDragSort={displayAuthors.length > 5}
                  displayAuthors={displayAuthors}
                  setDisplayAuthors={setDisplayAuthors}
                  allowAddRemove={!reorderOnly}
                  isAuthoridsField={true}
                  multiple={multiple}
                  onChange={onChange}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </div>

      {!reorderOnly && (true || !displayAuthors?.length) && (
        <ProfileSearchFormAndResults
          setSelectedAuthorProfiles={setSelectedAuthorProfiles}
          displayAuthors={displayAuthors}
          setDisplayAuthors={setDisplayAuthors}
          error={error}
          field={field}
          onChange={onChange}
          clearError={clearError}
        />
      )}
    </div>
  )
}

export default ProfileSearchWithInstitutionWidget
