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

const mapDisplayAuthorsToEditorValue = (displayAuthors, hasInstitutionProperty) =>
  displayAuthors.map((p) => ({
    username: p.username,
    fullname: p.fullname,
    ...(hasInstitutionProperty && {
      institutions: p.selectedInstitutions.map((institution) => ({
        name: institution.name,
        domain: institution.domain,
        country: institution.country,
      })),
    }),
  }))

const getTitle = (profile) => {
  if (!profile.content) return null
  const latestHistory =
    profile.content.history?.find((p) => !p.end) || maxBy(profile.content.history, 'end')

  const title = latestHistory
    ? `${latestHistory.position ? `${latestHistory.position}` : ''}${
        latestHistory.institution?.name ? ` at ${latestHistory.institution?.name}` : ''
      }${latestHistory.institution?.domain ? ` (${latestHistory.institution?.domain})` : ''}`
    : ''
  return title
}

const getCurrentInstitutionOptionsFromProfile = (profile) => {
  const institutionOptions = []
  const currentYear = new Date().getFullYear()
  profile?.content?.history?.forEach((history) => {
    const { institution } = history
    if (institutionOptions.find((p) => p.value === institution.domain)) return
    if (history.end && history.end < currentYear) return
    institutionOptions.push({
      label: `${institution.name} (${institution.domain})`,
      value: institution.domain,
      name: institution.name,
      domain: institution.domain,
      country: institution.country,
    })
  })
  return institutionOptions
}

const checkIsInAuthorList = (selectedAuthors, profileToCheck) => {
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
  allowInstitutionChange,
  hasInstitutionProperty,
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

    setDisplayAuthors(updatedValue)
    onChange({
      fieldName,
      value: mapDisplayAuthorsToEditorValue(updatedValue, hasInstitutionProperty),
    })
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
      value: mapDisplayAuthorsToEditorValue(updatedAuthors, true),
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
                  value: mapDisplayAuthorsToEditorValue(
                    updatedAuthors,
                    hasInstitutionProperty
                  ),
                })
              }}
              extraClasses="remove-button"
            />
          )}
          {showArrowButton && <IconButton name="arrow-right" onClick={increaseAuthorIndex} />}
        </div>
      </div>

      {hasInstitutionProperty && (
        <div className={styles.authorInstitution}>
          <MultiSelectorDropdown
            key={profile.username}
            disabled={
              !profile.institutionOptions.length ||
              (!allowInstitutionChange && !profile.selectedInstitutions.length)
            }
            extraClass={styles.authorInstitutionDropdown}
            options={profile.institutionOptions}
            selectedValues={profile.selectedInstitutions?.map((p) => p.domain)}
            setSelectedValues={handleInstitutionChange}
            displayTextFn={(selectedValues) => {
              if (!profile.institutionOptions.length) return 'No Active Institution'
              return selectedValues.length === 0
                ? `${allowInstitutionChange ? 'Add' : 'No'} Institution`
                : `${inflect(selectedValues.length, 'Institution', 'Institutions', true)} added`
            }}
            optionsDisabled={!allowInstitutionChange}
          />
        </div>
      )}
    </div>
  )
}

const ProfileSearchResultRow = ({
  profile,
  setProfileSearchResults,
  setSearchTerm,
  displayAuthors,
  setDisplayAuthors,
  field,
  onChange,
  clearError,
  hasInstitutionProperty,
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
          disableButton={checkIsInAuthorList(displayAuthors, profile)}
          disableReason="This author is already in author list"
          onClick={() => {
            const institutionOptions = getCurrentInstitutionOptionsFromProfile(profile)
            const updatedAuthors = displayAuthors.concat({
              username: preferredId,
              fullname: getProfileName(profile),
              institutionOptions,
              selectedInstitutions: institutionOptions.length ? [institutionOptions[0]] : [],
            })
            setDisplayAuthors(updatedAuthors)
            onChange({
              fieldName,
              value: mapDisplayAuthorsToEditorValue(updatedAuthors, hasInstitutionProperty),
            })

            clearError?.()
            setProfileSearchResults(null)
            setSearchTerm('')
          }}
        />
      </div>
    </div>
  )
}

const ProfileSearchFormAndResults = ({
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
  const pageSize = 20

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

  const displayResults = () => {
    if (!profileSearchResults) return null
    if (!profileSearchResults.length)
      return (
        <div className={styles.noMatchingProfile}>
          <div className={styles.noMatchingProfileMessage}>
            No results found for your search query.
          </div>
        </div>
      )

    return (
      <div className={styles.searchResults}>
        <>
          {profileSearchResults.map((profile, index) => (
            <ProfileSearchResultRow
              key={index}
              profile={profile}
              setProfileSearchResults={setProfileSearchResults}
              setSearchTerm={setSearchTerm}
              displayAuthors={displayAuthors}
              setDisplayAuthors={setDisplayAuthors}
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

const ProfileSearchWithInstitutionWidget = () => {
  const { user, accessToken, isRefreshing } = useUser()
  const { field, onChange, value, error, clearError } = useContext(EditorComponentContext)

  const reorderOnly = Array.isArray(field?.authors?.value)
  const allowAddRemove = !reorderOnly && !field.authors?.value.param.elements // reorder with institution change
  const allowInstitutionChange = !reorderOnly

  const hasInstitutionProperty =
    field?.authors?.value?.param?.properties?.institutions || // add institution
    field?.authors?.value?.param?.elements || // reorder with institution change
    (reorderOnly && field.authors.value?.[0]?.institutions) // reorder only institution exists

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))
  const [displayAuthors, setDisplayAuthors] = useState(null)
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
      value: mapDisplayAuthorsToEditorValue(displayAuthors, hasInstitutionProperty),
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
      return profiles
    } catch (apiError) {
      promptError(apiError.message)
      return []
    }
  }

  const setDisplayAuthorNewEditor = async () => {
    const profileResults = await getProfiles([user.profile.id])
    const currentUserProfile = profileResults?.[0]
    const institutionOptions = getCurrentInstitutionOptionsFromProfile(currentUserProfile)
    const username = user.profile.id
    const fullname = getProfileName(currentUserProfile)
    const selectedInstitutions = institutionOptions.length ? [institutionOptions[0]] : []
    const authors = [
      {
        username,
        fullname,
        selectedInstitutions,
        institutionOptions,
      },
    ]
    setDisplayAuthors(authors)
    onChange({
      fieldName: 'authors',
      value: mapDisplayAuthorsToEditorValue(authors, hasInstitutionProperty),
    })
  }

  const setDisplayAuthorExistingValue = async () => {
    const authorIds = value.map((p) => p.username)
    const profileResults = await getProfiles(authorIds)
    if (!hasInstitutionProperty) {
      setDisplayAuthors(value)
      return
    }
    const authors = value.map((author) => {
      const profile = profileResults.find((p) =>
        p.content.names.find((q) => q.username === author.username)
      )
      const institutionOptionsFromProfile = getCurrentInstitutionOptionsFromProfile(profile)
      const institutionOptionsFromValue = author.institutions.flatMap((institution) => {
        if (institutionOptionsFromProfile.find((p) => p.domain === institution.domain))
          // institution selected before still exist in profile
          return []
        return {
          label: `${institution.name} (${institution.domain})`,
          value: institution.domain,
          name: institution.name,
          domain: institution.domain,
          country: institution.country,
        }
      })

      return {
        username: author.username,
        fullname: author.fullname,
        selectedInstitutions: author.institutions,
        institutionOptions: [...institutionOptionsFromValue, ...institutionOptionsFromProfile],
      }
    })
    setDisplayAuthors(authors)
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!value) {
      setDisplayAuthorNewEditor()
      return
    }
    setDisplayAuthorExistingValue()
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
                  allowAddRemove={allowAddRemove}
                  allowInstitutionChange={allowInstitutionChange}
                  hasInstitutionProperty={hasInstitutionProperty}
                  onChange={onChange}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </div>

      {allowAddRemove && (
        <ProfileSearchFormAndResults
          displayAuthors={displayAuthors}
          setDisplayAuthors={setDisplayAuthors}
          error={error}
          field={field}
          onChange={onChange}
          clearError={clearError}
          hasInstitutionProperty={hasInstitutionProperty}
        />
      )}
    </div>
  )
}

export default ProfileSearchWithInstitutionWidget
