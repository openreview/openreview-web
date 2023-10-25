import { useEffect, useReducer, useState } from 'react'
import { nanoid } from 'nanoid'
import dynamic from 'next/dynamic'
import Icon from '../Icon'
import useBreakpoint from '../../hooks/useBreakPoint'
import { getStartEndYear } from '../../lib/utils'
import ProfileSearchWidget from '../EditorComponents/ProfileSearchWidget'

const CreatableDropdown = dynamic(() =>
  import('../Dropdown').then((mod) => mod.CreatableDropdown)
)
const MultiSelectorDropdown = dynamic(() => import('../MultiSelectorDropdown'))
// #region action type constants
const relationType = 'updateRelation'
const readersType = 'updateReaders'
const startType = 'updateStart'
const endType = 'updateEnd'
const nameType = 'updateName'
const emailType = 'updateEmail'
const profileType = 'updateProfile'
const addRelationType = 'addRelation'
const removeRelationType = 'removeRelation'
// #endregion

const RelationRow = ({
  relation,
  setRelation,
  profileRelation,
  relationOptions,
  relationReaderOptions,
  isMobile,
}) => {
  const relationPlaceholder = 'Choose or type a relation'
  const [relationClicked, setRelationClicked] = useState(false)

  const getReaderText = (selectedValues) => {
    if (!selectedValues || !selectedValues.length || selectedValues.includes('everyone'))
      return 'everyone'
    return selectedValues.join(',')
  }

  // eslint-disable-next-line no-shadow
  const renderRelationName = (relation) => {
    if (relation.name && relation.email) {
      if (relation.id) {
        // existing with id show profile search
        return (
          <div className="col-md-6 relation__value">
            <input
              className="form-control"
              value={relation.name ?? ''}
              onChange={(e) =>
                setRelation({
                  type: nameType,
                  data: { value: e.target.value, key: relation.key },
                })
              }
            />
          </div>
        )
      }
      // existing without id show name and email
      return (
        <>
          <div className="col-md-3 relation__value">
            {isMobile && <div className="small-heading col-md-3">Name</div>}
            <input
              className={`form-control ${
                profileRelation?.find((q) => q.key === relation.key)?.valid === false
                  ? 'invalid-value'
                  : ''
              }`}
              value={relation.name ?? ''}
              onChange={(e) =>
                setRelation({
                  type: nameType,
                  data: { value: e.target.value, key: relation.key },
                })
              }
            />
          </div>
          <div className="col-md-3 relation__value">
            {isMobile && <div className="small-heading col-md-3">Email</div>}
            <input
              className={`form-control ${
                profileRelation?.find((q) => q.key === relation.key)?.valid === false
                  ? 'invalid-value'
                  : ''
              }`}
              value={relation.email ?? ''}
              onChange={(e) =>
                setRelation({
                  type: emailType,
                  data: { value: e.target.value, key: relation.key },
                })
              }
            />
          </div>
        </>
      )
    }
    // empty relation show profile search
    return (
      <div className="col-md-6 relation__value">
        <ProfileSearchWidget
          multiple={false}
          isEditor={false}
          pageSize={5}
          searchInputPlaceHolder="search relation with name or email"
          value={relation.id}
          onChange={(tildeId, preferredName, profile) => {
            setRelation({
              type: profileType,
              data: {
                value: { tildeId, preferredName, email: profile.content?.preferredEmail },
                key: relation.key,
              },
            })
          }}
          className="relation-search"
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
            defaultMenuIsOpen
            hideArrow
            disableMouseMove
            isClearable
            classNamePrefix="relation-dropdown"
            placeholder={relationPlaceholder}
            defaultValue={
              relation.relation ? { value: relation.relation, label: relation.relation } : null
            }
            // eslint-disable-next-line max-len
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
          />
        )}
      </div>

      {renderRelationName(relation)}

      <div className="col-md-1 relation__value">
        {isMobile && <div className="small-heading col-md-1">Start</div>}
        <input
          className={`form-control ${
            profileRelation?.find((q) => q.key === relation.key)?.valid === false
              ? 'invalid-value'
              : ''
          }`}
          value={relation.start ?? ''}
          placeholder="year"
          onChange={(e) =>
            setRelation({
              type: startType,
              data: { value: e.target.value, key: relation.key },
            })
          }
        />
      </div>
      <div className="col-md-1 relation__value">
        {isMobile && <div className="small-heading col-md-1">End</div>}
        <input
          className={`form-control ${
            profileRelation?.find((q) => q.key === relation.key)?.valid === false
              ? 'invalid-value'
              : ''
          }`}
          value={relation.end ?? ''}
          placeholder="year"
          onChange={(e) =>
            setRelation({ type: endType, data: { value: e.target.value, key: relation.key } })
          }
        />
      </div>
      <div className="col-md-1 relation__value additional-width-col">
        {isMobile && <div className="small-heading col-md-1">Visible to</div>}
        <MultiSelectorDropdown
          extraClass={`relation__multiple-select${
            isMobile ? ' relation__multiple-select-mobile' : ''
          }`}
          options={relationReaderOptions}
          selectedValues={relation.readers}
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
      case emailType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.email = action.data.value
          return recordCopy
        })
      case profileType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.id = action.data.value.tildeId
            recordCopy.name = action.data.value.preferredName
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
          <div className="small-heading col-md-3">Name</div>
          <div className="small-heading col-md-3">Email</div>
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
