import { useEffect, useReducer, useState } from 'react'
import dynamic from 'next/dynamic'
import { nanoid } from 'nanoid'
import Icon from '../Icon'
import useBreakpoint from '../../hooks/useBreakPoint'
import { getStartEndYear } from '../../lib/utils'

const CreatableDropdown = dynamic(() =>
  import('../Dropdown').then((mod) => mod.CreatableDropdown)
)

const positionPlaceholder = 'Choose or type a position'
const institutionPlaceholder = 'Choose or type an institution'
// #region action type constants
const posititonType = 'updatePosition'
const startType = 'updateStart'
const endType = 'updateEnd'
const institutionDomainType = 'updateInstitutionDomain'
const institutionNameType = 'updateInstitutionName'
const addHistoryType = 'addHistory'
const removeHistoryType = 'removeHistory'
// #endregion

const EducationHisotryRow = ({
  p,
  history,
  setHistory,
  profileHistory,
  positionOptions,
  institutionDomainOptions,
  isMobile,
}) => {
  const [isPositionClicked, setIsPositionClicked] = useState(false)
  const [isDomainClicked, setIsDomainClicked] = useState(false)

  return (
    <div className="row">
      <div className="col-md-2 history__value">
        {isMobile && <div className="small-heading col-md-2">Position</div>}
        {isPositionClicked ? (
          <CreatableDropdown
            autofocus
            defaultMenuIsOpen
            hideArrow
            disableMouseMove
            isClearable
            classNamePrefix="position-dropdown"
            placeholder={positionPlaceholder}
            defaultValue={p.position ? { value: p.position, label: p.position } : null}
            onChange={(e) => {
              setHistory({
                type: posititonType,
                data: { value: e ? e.value : '', key: p.key },
              })
              if (e) setIsPositionClicked(false)
            }}
            options={positionOptions}
            styles={{
              control: (provided, state) => ({
                ...provided,
                borderColor: state.selectProps.isInvalid
                  ? '#8c1b13!important'
                  : provided.borderColor,
              }),
            }}
            isInvalid={profileHistory?.find((q) => q.key === p.key)?.valid === false}
          />
        ) : (
          <input
            className="form-control position-dropdown__placeholder"
            placeholder={positionPlaceholder}
            value={p.position}
            onClick={() => setIsPositionClicked(true)}
            onFocus={() => setIsPositionClicked(true)}
            onChange={() => {}}
          />
        )}
      </div>
      <div className="col-md-1 history__value">
        {isMobile && <div className="small-heading col-md-1">Start</div>}
        <input
          className={`form-control ${
            profileHistory?.find((q) => q.key === p.key)?.valid === false
              ? 'invalid-value'
              : ''
          }`}
          value={p.start ?? ''}
          placeholder="year"
          onChange={(e) =>
            setHistory({ type: startType, data: { value: e.target.value, key: p.key } })
          }
        />
      </div>
      <div className="col-md-1 history__value">
        {isMobile && <div className="small-heading col-md-1">End</div>}
        <input
          className={`form-control ${
            profileHistory?.find((q) => q.key === p.key)?.valid === false
              ? 'invalid-value'
              : ''
          }`}
          value={p.end ?? ''}
          placeholder="year"
          onChange={(e) =>
            setHistory({ type: endType, data: { value: e.target.value, key: p.key } })
          }
        />
      </div>
      <div className="col-md-3 history__value">
        {isMobile && <div className="small-heading col-md-3">Institution Domain</div>}
        {isDomainClicked ? (
          <CreatableDropdown
            autofocus
            defaultMenuIsOpen
            hideArrow
            disableMouseMove
            virtualList
            isClearable
            classNamePrefix="institution-dropdown"
            placeholder={institutionPlaceholder}
            defaultValue={
              p.institution?.domain
                ? { value: p.institution?.domain, label: p.institution?.domain }
                : null
            }
            onChange={(e) => {
              setHistory({
                type: institutionDomainType,
                data: { value: e ? e.value : '', key: p.key },
              })
              if (e) setIsDomainClicked(false)
            }}
            onBlur={(e) => {
              if (e.target.value) {
                setHistory({
                  type: institutionDomainType,
                  data: { value: e.target.value, key: p.key },
                })
                setIsDomainClicked(false)
              }
            }}
            options={institutionDomainOptions}
            styles={{
              control: (provided, state) => ({
                ...provided,
                borderColor: state.selectProps.isInvalid
                  ? '#8c1b13!important'
                  : provided.borderColor,
              }),
            }}
            isInvalid={profileHistory?.find((q) => q.key === p.key)?.valid === false}
          />
        ) : (
          <input
            className="form-control institution-dropdown__placeholder"
            placeholder={institutionPlaceholder}
            value={p.institution?.domain}
            onClick={() => setIsDomainClicked(true)}
            onFocus={() => setIsDomainClicked(true)}
            onChange={() => {}}
          />
        )}
      </div>
      <div className="col-md-4 history__value">
        {isMobile && <div className="small-heading col-md-4">Institution Name</div>}
        <input
          className="form-control institution-name"
          value={p.institution?.name ?? ''}
          onChange={(e) =>
            setHistory({
              type: institutionNameType,
              data: { value: e.target.value, key: p.key },
            })
          }
        />
      </div>
      <div className="col-md-1 history__value">
        {history.length > 1 && (
          <div
            role="button"
            aria-label="remove history"
            tabIndex={0}
            onClick={() => setHistory({ type: removeHistoryType, data: { key: p.key } })}
          >
            <Icon name="minus-sign" tooltip="remove history" />
          </div>
        )}
      </div>
    </div>
  )
}

const EducationHistorySection = ({
  profileHistory,
  positions,
  institutions,
  updateHistory,
}) => {
  const isMobile = !useBreakpoint('lg')
  const institutionDomainOptions = institutions?.flatMap((p) =>
    p.id ? { value: p.id, label: p.id } : []
  )
  const positionOptions = positions?.map((p) => ({ value: p, label: p }))

  const getInstitutionName = (domain) => {
    if (!domain) return ''
    const institution = institutions?.find((i) => i.id === domain)
    if (!institution) return ''
    const parentInstitution = institutions?.find((i) => i.id === institution.parent)
    return `${institution.fullname}${
      parentInstitution?.fullname ? `, ${parentInstitution.fullname}` : ''
    }`
  }

  const historyReducer = (state, action) => {
    switch (action.type) {
      case posititonType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.position = action.data.value
          return recordCopy
        })
      case institutionNameType:
        return state.map((p) => {
          const recordCopy = { ...p, institution: { ...p.institution } }
          if (p.key === action.data.key) {
            recordCopy.institution.name = action.data.value
          }
          return recordCopy
        })
      case institutionDomainType:
        return state.map((p) => {
          const recordCopy = { ...p, institution: { ...p.institution } }
          if (p.key === action.data.key) {
            recordCopy.institution = {
              domain: action.data.value,
              name: getInstitutionName(action.data.value),
            }
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
      case addHistoryType:
        return [
          ...state,
          {
            key: nanoid(),
            position: '',
            start: '',
            end: '',
            institution: {
              domain: '',
              name: '',
            },
          },
        ]
      case removeHistoryType:
        return state.filter((p) => p.key !== action.data.key)
      default:
        return state
    }
  }

  const [history, setHistory] = useReducer(
    historyReducer,
    profileHistory?.length > 0
      ? profileHistory?.map((p) => ({
          ...p,
          start: getStartEndYear(p.start),
          end: getStartEndYear(p.end),
          key: nanoid(),
        }))
      : [...Array(3).keys()].map(() => ({
          key: nanoid(),
          position: '',
          start: '',
          end: '',
          institution: {
            domain: '',
            name: '',
          },
        }))
  )

  useEffect(() => {
    updateHistory(history)
  }, [history])

  return (
    <div className="container history history-new">
      {!isMobile && (
        <div className="row">
          <div className="small-heading col-md-2">Position</div>
          <div className="small-heading col-md-1">Start</div>
          <div className="small-heading col-md-1">End</div>
          <div className="small-heading col-md-3">Institution Domain</div>
          <div className="small-heading col-md-4">Institution Name</div>
        </div>
      )}
      {history.map((p) => (
        <EducationHisotryRow
          key={p.key}
          p={p}
          history={history}
          setHistory={setHistory}
          profileHistory={profileHistory}
          positionOptions={positionOptions}
          institutionDomainOptions={institutionDomainOptions}
          isMobile={isMobile}
        />
      ))}
      <div className="row">
        <div
          role="button"
          aria-label="add another history"
          tabIndex={0}
          onClick={() => setHistory({ type: addHistoryType })}
        >
          <Icon name="plus-sign" tooltip="add another history" />
        </div>
      </div>
    </div>
  )
}

export default EducationHistorySection
