/* globals promptError: false */
import { useEffect, useReducer, useState } from 'react'
import dynamic from 'next/dynamic'
import { nanoid } from 'nanoid'
import Icon from '../Icon'
import useBreakpoint from '../../hooks/useBreakPoint'
import { getStartEndYear } from '../../lib/utils'
import Dropdown from '../Dropdown'
import api from '../../lib/api-client'

const CreatableDropdown = dynamic(
  () => import('../Dropdown').then((mod) => mod.CreatableDropdown),
  {
    ssr: false,
    loading: () => (
      <input
        className="form-control position-dropdown__placeholder"
        value="loading..."
        onChange={() => {}}
      />
    ),
  }
)

const positionPlaceholder = 'Choose or type a position'
const institutionPlaceholder = 'Choose or type an institution'
const regionPlaceholder = 'Institution Country/Region'
// #region action type constants
const posititonType = 'updatePosition'
const startType = 'updateStart'
const endType = 'updateEnd'
const institutionDomainType = 'updateInstitutionDomain'
const institutionNameType = 'updateInstitutionName'
const institutionCountryType = 'updateInstitutionCountry'
const institutionCityType = 'updateInstitutionCity'
const institutionStateProvinceType = 'updateInstitutionStateProvince'
const institutionDepartmentType = 'updateInstitutionDepartment'
const addHistoryType = 'addHistory'
const removeHistoryType = 'removeHistory'
// #endregion

const EducationHistoryRow = ({
  p,
  history,
  setHistory,
  profileHistory,
  positionOptions,
  institutionDomainOptions,
  countryOptions,
  isMobile,
}) => {
  const [isPositionClicked, setIsPositionClicked] = useState(false)
  const [isDomainClicked, setIsDomainClicked] = useState(false)
  const [isRegionClicked, setIsRegionClicked] = useState(false)
  const invalidFields = profileHistory?.find((q) => q.key === p.key)?.invalidFields

  const updateDomain = async (domain, key) => {
    if (!domain) {
      setHistory({
        type: institutionDomainType,
        data: { value: { institutionDomain: '', institutionName: '' }, key },
      })
      return
    }
    try {
      let institutionName = ''
      const institution = (await api.get('/settings/institutions', { domain }))
        ?.institutions?.[0]

      if (institution?.parent) {
        const parentInstitution = (
          await api.get('/settings/institutions', { domain: institution.parent })
        )?.institutions?.[0]
        institutionName = `${institution.fullname}${
          parentInstitution?.fullname ? `, ${parentInstitution.fullname}` : ''
        }`
      } else {
        institutionName = institution.fullname
      }
      setHistory({
        type: institutionDomainType,
        data: { value: { institutionDomain: domain, institutionName }, key },
      })
    } catch (error) {
      setHistory({
        type: institutionDomainType,
        data: { value: { institutionDomain: domain, institutionName: '' }, key },
      })
    }
  }

  return (
    <div className="row">
      <div className="col-md-3 history__value">
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
            isInvalid={invalidFields?.includes('position')}
            defaultValue={p.position ? { value: p.position, label: p.position } : null}
            onChange={(e) => {
              setHistory({
                type: posititonType,
                data: { value: e ? e.value : '', key: p.key },
              })
              if (e) setIsPositionClicked(false)
            }}
            onBlur={(e) => {
              if (e.target.value) {
                setHistory({
                  type: posititonType,
                  data: { value: e.target.value, key: p.key },
                })
              }
              setIsPositionClicked(false)
            }}
            options={positionOptions}
          />
        ) : (
          <input
            className={`form-control position-dropdown__placeholder ${
              invalidFields?.includes('position') ? 'invalid-value' : ''
            }`}
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
            invalidFields?.includes('startYear') ? 'invalid-value' : ''
          }`}
          value={p.start ?? ''}
          placeholder="start year"
          onChange={(e) =>
            setHistory({ type: startType, data: { value: e.target.value, key: p.key } })
          }
        />
      </div>
      <div className="col-md-1 history__value">
        {isMobile && <div className="small-heading col-md-1">End</div>}
        <input
          className={`form-control ${
            invalidFields?.includes('endYear') ? 'invalid-value' : ''
          }`}
          value={p.end ?? ''}
          placeholder="end year"
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
            isInvalid={invalidFields?.includes('institution')}
            defaultValue={
              p.institution?.domain
                ? { value: p.institution?.domain, label: p.institution?.domain }
                : null
            }
            onChange={(e) => {
              updateDomain(e?.value ?? '', p.key)
              if (e) setIsDomainClicked(false)
            }}
            onBlur={(e) => {
              if (e.target.value) {
                updateDomain(e.target.value, p.key)
                setIsDomainClicked(false)
              }
            }}
            options={institutionDomainOptions}
          />
        ) : (
          <input
            className={`form-control institution-dropdown__placeholder ${
              invalidFields?.includes('institution') ? 'invalid-value' : ''
            }`}
            placeholder={institutionPlaceholder}
            value={p.institution?.domain}
            onClick={() => setIsDomainClicked(true)}
            onFocus={() => setIsDomainClicked(true)}
            onChange={() => {}}
          />
        )}
      </div>
      <div className="col-md-3 history__value">
        {isMobile && <div className="small-heading col-md-4">Institution Name</div>}
        <input
          className={`form-control institution-dropdown__name ${
            invalidFields?.includes('institution') ? 'invalid-value' : ''
          }`}
          placeholder="Institution Name"
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
      <div className="col-md-2 history__value">
        {isMobile && <div className="small-heading col-md-4">Institution Country/Region</div>}
        {isRegionClicked ? (
          <Dropdown
            options={countryOptions}
            onChange={(e) => {
              setHistory({
                type: institutionCountryType,
                data: { value: e?.value, key: p.key },
              })
              if (e) setIsRegionClicked(false)
            }}
            isInvalid={invalidFields?.includes('country')}
            value={countryOptions?.find((q) => q.value === p.institution?.country)}
            placeholder={regionPlaceholder}
            classNamePrefix="country-dropdown"
            hideArrow
            isClearable
            defaultMenuIsOpen
            autoFocus
          />
        ) : (
          <input
            className={`form-control region-dropdown__placeholder ${
              invalidFields?.includes('country') ? 'invalid-value' : ''
            }`}
            placeholder={regionPlaceholder}
            value={
              countryOptions?.find((q) => q.value === p.institution?.country)?.label ?? ''
            }
            onClick={() => setIsRegionClicked(true)}
            onFocus={() => setIsRegionClicked(true)}
            onChange={() => {}}
          />
        )}
      </div>
      <div className="col-md-3 history__value">
        {isMobile && <div className="small-heading col-md-4">Institution State/Province</div>}
        <input
          className="form-control institution-state"
          placeholder="Institution State/Province"
          value={p.institution?.stateProvince ?? ''}
          onChange={(e) =>
            setHistory({
              type: institutionStateProvinceType,
              data: { value: e.target.value, key: p.key },
            })
          }
        />
      </div>
      <div className="col-md-3 history__value">
        {isMobile && <div className="small-heading col-md-4">Institution City</div>}
        <input
          className="form-control institution-city"
          placeholder="Institution City"
          value={p.institution?.city ?? ''}
          onChange={(e) =>
            setHistory({
              type: institutionCityType,
              data: { value: e.target.value, key: p.key },
            })
          }
        />
      </div>
      <div className="col-md-3 history__value">
        {isMobile && <div className="small-heading col-md-4">Department of Institution</div>}
        <input
          className="form-control institution-department"
          placeholder="Department of Institution"
          value={p.institution?.department ?? ''}
          onChange={(e) =>
            setHistory({
              type: institutionDepartmentType,
              data: { value: e.target.value, key: p.key },
            })
          }
        />
      </div>
    </div>
  )
}

const EducationHistorySection = ({
  profileHistory,
  positions,
  institutionDomains,
  countries,
  updateHistory,
}) => {
  const isMobile = !useBreakpoint('lg')
  const institutionDomainOptions = institutionDomains?.map((p) => ({
    value: p,
    label: p,
  }))
  const positionOptions = positions?.map((p) => ({ value: p, label: p }))
  const countryOptions = Object.entries(countries ?? {})?.map(([name, details]) => ({
    value: details.alphaTwoCode,
    label: name,
  }))

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
              domain: action.data.value.institutionDomain,
              name: action.data.value.institutionName,
            }
          }
          return recordCopy
        })
      case institutionCountryType:
        return state.map((p) => {
          const recordCopy = { ...p, institution: { ...p.institution } }
          if (p.key === action.data.key) {
            recordCopy.institution.country = action.data.value
          }
          return recordCopy
        })
      case institutionCityType:
        return state.map((p) => {
          const recordCopy = { ...p, institution: { ...p.institution } }
          if (p.key === action.data.key) {
            const city = action.data.value.trim()
            recordCopy.institution.city = city.length ? action.data.value : null
          }
          return recordCopy
        })
      case institutionStateProvinceType:
        return state.map((p) => {
          const recordCopy = { ...p, institution: { ...p.institution } }
          if (p.key === action.data.key) {
            const stateProvince = action.data.value.trim()
            recordCopy.institution.stateProvince = stateProvince.length
              ? action.data.value
              : null
          }
          return recordCopy
        })
      case institutionDepartmentType:
        return state.map((p) => {
          const recordCopy = { ...p, institution: { ...p.institution } }
          if (p.key === action.data.key) {
            const department = action.data.value.trim()
            recordCopy.institution.department = department.length ? action.data.value : null
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
            start: null,
            end: null,
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
          start: null,
          end: null,
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
          <div className="small-heading col-md-3">Position</div>
          <div className="small-heading col-md-1">Start</div>
          <div className="small-heading col-md-1">End</div>
          <div className="small-heading col-md-4">Institution Info</div>
        </div>
      )}
      {history.map((p) => (
        <EducationHistoryRow
          key={p.key}
          p={p}
          history={history}
          setHistory={setHistory}
          profileHistory={profileHistory}
          positionOptions={positionOptions}
          institutionDomainOptions={institutionDomainOptions}
          countryOptions={countryOptions}
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
