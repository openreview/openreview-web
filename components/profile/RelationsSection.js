import { CheckOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Input, Tooltip } from 'antd'
import { uniqBy } from 'lodash'
import { nanoid } from 'nanoid'
import dynamic from 'next/dynamic'
import { useEffect, useReducer, useState } from 'react'
import useBreakpoint from '../../hooks/useBreakPoint'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { colors } from '../../lib/legacy-bootstrap-styles'
import { getStartEndYear } from '../../lib/utils'
import ProfileSearchWidget from '../EditorComponents/ProfileSearchWidget'
import Icon from '../Icon'
import { EditButton, SearchButton } from '../IconButton'

const CreatableDropdown = dynamic(
  () => import('../Dropdown').then((mod) => mod.CreatableDropdown),
  {
    ssr: false,
    loading: () => (
      <input className="form-control relation__placeholder" value="loading..." readOnly />
    ),
  }
)
const MultiSelectorDropdown = dynamic(() => import('../MultiSelectorDropdown'), { ssr: false })
// #region action type constants
const relationType = 'updateRelation'
const readersType = 'updateReaders'
const startType = 'updateStart'
const endType = 'updateEnd'
const nameType = 'updateName'
const profileType = 'updateProfile'
const customProfileType = 'updateCustomProfile'
const addRelationType = 'addRelation'
const removeRelationType = 'removeRelation'
// #endregion

const CustomProfileSearchForm = ({
  error,
  styles,
  searchTerm,
  setSearchTerm,
  setProfileSearchResults,
  setShowCustomAuthorForm,
  searchProfiles,
  setPageNumber,
}) => (
  <div className={`relation-name-container${error ? ' invalid-value' : ''}`}>
    <input
      type="text"
      className={`search-input ${error ? styles.invalidValue : ''}`}
      value={searchTerm ?? ''}
      placeholder="Search relation by name or OpenReview profile ID"
      onChange={(e) => {
        setSearchTerm(e.target.value)
        setProfileSearchResults(null)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          setShowCustomAuthorForm(false)
          searchProfiles(searchTerm, 1)
          setPageNumber(null)
        }
      }}
      aria-label="Search relation by name or OpenReview profile ID"
    />

    <SearchButton
      disableButton={!searchTerm?.trim()}
      onClick={(e) => {
        e.preventDefault()
        setShowCustomAuthorForm(false)
        searchProfiles(searchTerm, 1)
        setPageNumber(null)
      }}
    />
  </div>
)

const RelationRow = ({
  relation,
  setRelation,
  profileRelation,
  relationOptions,
  relationReaderOptions,
  isMobile,
  voucherId,
}) => {
  const relationPlaceholder = 'Choose or type a relation'
  const [relationClicked, setRelationClicked] = useState(false)
  const [isVouching, setIsVouching] = useState(false)
  const [hasVouched, setHasVouched] = useState(false)
  const relationReadersOptionWithExistingRelation = uniqBy(
    relationReaderOptions.concat(
      (relation.readers ?? []).map((r) => ({ value: r, label: r }))
    ),
    (p) => p.value
  )
  const isPublicRelation = !relation.readers?.length || relation.readers.includes('everyone')
  const relationInvalid =
    profileRelation?.find((q) => q.key === relation.key)?.valid === false
  // Keep the error border the legacy OR red so it matches the relation dropdown
  // and the rest of the form, instead of antd's default error red.
  const invalidInputStyle = relationInvalid ? { borderColor: colors.orRed } : undefined

  const handleVouch = async () => {
    if (!voucherId || !relation.username) return
    setIsVouching(true)
    try {
      await api.post('/tags', {
        profile: relation.username,
        signature: voucherId,
        invitation: `${process.env.SUPER_USER}/Support/-/Vouch`,
      })
      setHasVouched(true)
      promptMessage(`You have vouched for ${relation.name}.`)
    } catch (error) {
      promptError(error.message)
    } finally {
      setIsVouching(false)
    }
  }

  let vouchTooltip = "Vouch to help verify this user's OpenReview account"
  if (!isPublicRelation) {
    vouchTooltip = "Set 'Visible to' to everyone to vouch for this user"
  }

  const getReaderText = (selectedValues) => {
    if (!selectedValues || !selectedValues.length || selectedValues.includes('everyone'))
      return 'everyone'
    return selectedValues.join(',')
  }

  const renderRelationName = (relation) => {
    if (relation.name) {
      if (relation.username) {
        // existing with id show profile search
        return (
          <div className="col-md-6 relation__value">
            <div className="relation-name-container">
              <a
                href={`/profile?id=${relation.username}`}
                target="_blank"
                rel="nofollow noreferrer"
              >
                {relation.name}
              </a>
              <span className="relation-name-container__actions">
                <EditButton
                  onClick={() =>
                    setRelation({
                      type: nameType,
                      data: { value: undefined, key: relation.key },
                    })
                  }
                />
                {hasVouched ? (
                  <Tooltip title="You've vouched for this user">
                    <span className="relation__vouched" role="img" aria-label="vouched">
                      <CheckOutlined />
                    </span>
                  </Tooltip>
                ) : (
                  <Tooltip title={vouchTooltip}>
                    <span className="relation__vouch">
                      <Button
                        type="primary"
                        size="small"
                        icon={<SafetyCertificateOutlined />}
                        loading={isVouching}
                        disabled={!isPublicRelation || !voucherId}
                        onClick={handleVouch}
                        style={{ height: '100%', borderRadius: 0 }}
                      >
                        Vouch
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </span>
            </div>
          </div>
        )
      }
      // existing without id show name and email
      return (
        <>
          <div className="col-md-6 relation__value">
            {isMobile && <div className="small-heading col-md-3">Name</div>}
            <div className="relation-name-container">
              <div>
                <span>{relation.name}</span>
                {relation.email && <span>{` <${relation.email}>`}</span>}
              </div>

              <EditButton
                onClick={() =>
                  setRelation({
                    type: nameType,
                    data: { value: undefined, key: relation.key },
                  })
                }
              />
            </div>
          </div>
        </>
      )
    }
    // empty relation show profile search
    return (
      <div className="col-md-6 relation__value">
        {isMobile && <div className="small-heading col-md-3">Name</div>}
        <ProfileSearchWidget
          multiple={false}
          isEditor={false}
          pageSize={10}
          pageListLength={12}
          field={{ relation: '' }}
          error={profileRelation?.find((q) => q.key === relation.key)?.valid === false}
          onChange={(username, name, email, profile) => {
            if (username) {
              setRelation({
                type: profileType,
                data: {
                  value: { username, name },
                  key: relation.key,
                },
              })
            } else {
              // custom relation
              setRelation({
                type: customProfileType,
                data: {
                  value: { name, email },
                  key: relation.key,
                },
              })
            }
          }}
          className="relation-search"
          CustomProfileSearchForm={CustomProfileSearchForm}
        />
      </div>
    )
  }

  return (
    <div className="row">
      <div className="col-md-2 relation__value">
        {isMobile && <div className="small-heading col-md-2">Relation</div>}
        {relationClicked ? (
          <CreatableDropdown
            autofocus
            clientOnly
            defaultMenuIsOpen
            hideArrow
            disableMouseMove
            isClearable
            classNamePrefix="relation-dropdown"
            placeholder={relationPlaceholder}
            defaultValue={
              relation.relation ? { value: relation.relation, label: relation.relation } : null
            }
            onChange={(e) => {
              setRelation({
                type: relationType,
                data: { value: e ? e.value : '', key: relation.key },
              })
              if (e) setRelationClicked(false)
            }}
            options={relationOptions}
            styles={{
              control: (provided, state) => ({
                ...provided,
                borderColor: state.selectProps.isInvalid
                  ? '#8c1b13!important'
                  : provided.borderColor,
              }),
            }}
            isInvalid={profileRelation?.find((q) => q.key === relation.key)?.valid === false}
          />
        ) : (
          <input
            className="form-control relation__placeholder"
            placeholder={relationPlaceholder}
            value={relation.relation}
            onClick={() => setRelationClicked(true)}
            onFocus={() => setRelationClicked(true)}
            onChange={() => {}}
            aria-label="Relation"
          />
        )}
      </div>

      {renderRelationName(relation)}

      <div className="col-md-1 relation__value">
        {isMobile && <div className="small-heading col-md-1">Start</div>}
        <Input
          style={invalidInputStyle}
          value={relation.start ?? ''}
          placeholder="year"
          onChange={(e) =>
            setRelation({
              type: startType,
              data: { value: e.target.value, key: relation.key },
            })
          }
          aria-label="Start Year"
        />
      </div>
      <div className="col-md-1 relation__value">
        {isMobile && <div className="small-heading col-md-1">End</div>}
        <Input
          style={invalidInputStyle}
          value={relation.end ?? ''}
          placeholder="year"
          onChange={(e) =>
            setRelation({ type: endType, data: { value: e.target.value, key: relation.key } })
          }
          aria-label="End Year"
        />
      </div>
      <div className="col-md-1 relation__value additional-width-col">
        {isMobile && <div className="small-heading col-md-1">Visible to</div>}
        <MultiSelectorDropdown
          extraClass={`relation__multiple-select${
            isMobile ? ' relation__multiple-select-mobile' : ''
          }`}
          options={relationReadersOptionWithExistingRelation}
          selectedValues={relation.readers ?? []}
          setSelectedValues={(values) =>
            setRelation({ type: readersType, data: { value: values, key: relation.key } })
          }
          displayTextFn={getReaderText}
        />
      </div>
      <div className="col-md-1 relation__value fixed-width-col">
        <div
          role="button"
          aria-label="remove relation"
          tabIndex={0}
          onClick={() =>
            setRelation({ type: removeRelationType, data: { key: relation.key } })
          }
        >
          <Icon name="minus-sign" tooltip="remove relation" />
        </div>
      </div>
    </div>
  )
}

const RelationsSection = ({
  profileRelation,
  prefixedRelations,
  relationReaders,
  updateRelations,
}) => {
  const isMobile = !useBreakpoint('lg')
  const { user } = useUser()
  const relationOptions = prefixedRelations?.map((p) => ({ value: p, label: p })) ?? []
  const relationReaderOptions = relationReaders?.map((p) => ({ value: p, label: p })) ?? []

  const relationReducer = (state, action) => {
    switch (action.type) {
      case relationType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.relation = action.data.value
          return recordCopy
        })
      case readersType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.readers = action.data.value?.length ? action.data.value : ['everyone']
          }
          return recordCopy
        })
      case startType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            const cleanStart = action.data.value?.trim()
            const parsedStart = Number(cleanStart)
            recordCopy.start = Number.isNaN(parsedStart) || !cleanStart ? null : parsedStart
          }
          return recordCopy
        })
      case endType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            const cleanEnd = action.data.value?.trim()
            const parsedEnd = Number(cleanEnd)
            recordCopy.end = Number.isNaN(parsedEnd) || !cleanEnd ? null : parsedEnd
          }
          return recordCopy
        })
      case nameType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.name = action.data.value
          return recordCopy
        })
      case profileType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.username = action.data.value.username
            recordCopy.name = action.data.value.name
            recordCopy.email = undefined
          }
          return recordCopy
        })
      case customProfileType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.username = undefined
            recordCopy.name = action.data.value.name
            recordCopy.email = action.data.value.email
          }
          return recordCopy
        })
      case addRelationType:
        return [
          ...state,
          {
            key: nanoid(),
            relation: '',
            name: '',
            email: '',
            start: null,
            end: null,
            readers: ['everyone'],
          },
        ]
      case removeRelationType:
        return state.length > 1
          ? state.filter((p) => p.key !== action.data.key)
          : [
              {
                key: nanoid(),
                relation: '',
                name: '',
                email: '',
                start: null,
                end: null,
                readers: ['everyone'],
              },
            ]
      default:
        return state
    }
  }

  const [relations, setRelation] = useReducer(
    relationReducer,
    profileRelation?.length > 0
      ? profileRelation?.map((p) => ({
          ...p,
          start: getStartEndYear(p.start),
          end: getStartEndYear(p.end),
          key: p.key ?? nanoid(),
        }))
      : [...Array(3).keys()].map(() => ({
          key: nanoid(),
          relation: '',
          name: '',
          email: '',
          start: null,
          end: null,
          readers: ['everyone'],
        }))
  )

  useEffect(() => {
    updateRelations(relations)
  }, [relations])

  return (
    <div className="container relation relation-new">
      {!isMobile && (
        <div className="row">
          <div className="small-heading col-md-2">Relation</div>
          <div className="small-heading col-md-6">Name</div>
          <div className="small-heading col-md-1">Start</div>
          <div className="small-heading col-md-1">End</div>
          <div className="small-heading col-md-1">Visible to</div>
        </div>
      )}
      {relations.map((relation) => (
        <RelationRow
          key={relation.key}
          relation={relation}
          setRelation={setRelation}
          profileRelation={profileRelation}
          relationOptions={relationOptions}
          relationReaderOptions={relationReaderOptions}
          isMobile={isMobile}
          voucherId={user?.profile?.id}
        />
      ))}
      <div className="row">
        <div
          role="button"
          aria-label="add another relation"
          tabIndex={0}
          onClick={() => setRelation({ type: addRelationType })}
        >
          <Icon name="plus-sign" tooltip="add another relation" />
        </div>
      </div>
    </div>
  )
}

export default RelationsSection
