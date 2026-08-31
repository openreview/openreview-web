import { AutoComplete, Input, Select } from 'antd'
import { nanoid } from 'nanoid'
import { useEffect, useReducer, useRef } from 'react'
import useBreakpoint from '../../hooks/useBreakPoint'
import api from '../../lib/api-client'
import { getStartEndYear } from '../../lib/utils'
import Icon from '../Icon'

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
  const invalidFields = profileHistory?.find((q) => q.key === p.key)?.invalidFields
  const isIndependentResearcher = p.position === 'Independent Researcher'
  const invalidFieldMessages = invalidFields ? [...new Set(Object.values(invalidFields))] : []

  const lastLookedUpDomain = useRef(p.institution?.domain)

  const updateDomain = async (domain, key) => {
    lastLookedUpDomain.current = domain
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
        <AutoComplete
          options={positionOptions}
          value={p.position}
          style={{ width: '100%' }}
          status={invalidFields?.position ? 'error' : undefined}
          onChange={(e) =>
            setHistory({
              type: posititonType,
              data: { value: e ?? '', key: p.key },
            })
          }
          placeholder={positionPlaceholder}
          showSearch={{ filterOption: true }}
          allowClear
          aria-label="Position"
        />
      </div>
      <div className="col-md-1 history__value">
        {isMobile && <div className="small-heading col-md-1">Start</div>}
        <Input
          value={p.start}
          status={invalidFields?.startYear ? 'error' : undefined}
          placeholder="start year"
          onChange={(e) =>
            setHistory({ type: startType, data: { value: e.target.value, key: p.key } })
          }
          aria-label="start year"
        />
      </div>
      <div className="col-md-1 history__value">
        {isMobile && <div className="small-heading col-md-1">End</div>}
        <Input
          value={p.end}
          status={invalidFields?.endYear ? 'error' : undefined}
          placeholder="end year"
          onChange={(e) =>
            setHistory({ type: endType, data: { value: e.target.value, key: p.key } })
          }
          aria-label="end year"
        />
      </div>
      <div className="col-md-3 history__value">
        {isMobile && <div className="small-heading col-md-3">Institution Domain</div>}
        <AutoComplete
          options={institutionDomainOptions}
          value={p.institution?.domain}
          style={{ width: '100%' }}
          status={invalidFields?.institutionDomain ? 'error' : undefined}
          onChange={(e) => {
            setHistory({
              type: institutionDomainType,
              data: {
                value: {
                  institutionDomain: e ?? '',
                  institutionName: e ? (p.institution?.name ?? '') : '',
                },
                key: p.key,
              },
            })
          }}
          onSelect={(value) => updateDomain(value, p.key)}
          onBlur={() => {
            const currentDomain = p.institution?.domain ?? ''
            if (currentDomain && currentDomain !== lastLookedUpDomain.current) {
              updateDomain(currentDomain, p.key)
            }
          }}
          placeholder={institutionPlaceholder}
          showSearch={{ filterOption: true }}
          allowClear
          aria-label="Institution Domain"
          disabled={isIndependentResearcher}
          styles={
            isIndependentResearcher ? { input: { color: 'rgba(0, 0, 0, 0.25)' } } : undefined
          }
        />
      </div>
      <div className="col-md-3 history__value">
        {isMobile && <div className="small-heading col-md-4">Institution Name</div>}
        <Input
          value={p.institution?.name}
          disabled={isIndependentResearcher}
          style={isIndependentResearcher ? { borderColor: '#d9d9d9' } : undefined}
          status={invalidFields?.institutionName ? 'error' : undefined}
          placeholder="Institution Name"
          onChange={(e) =>
            setHistory({
              type: institutionNameType,
              data: { value: e.target.value, key: p.key },
            })
          }
          aria-label="Institution Name"
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
        <Select
          options={countryOptions}
          value={p.institution?.country}
          placeholder={regionPlaceholder}
          style={{ width: '100%' }}
          status={invalidFields?.institutionCountryRegion ? 'error' : undefined}
          onChange={(e) => {
            setHistory({
              type: institutionCountryType,
              data: { value: e, key: p.key },
            })
          }}
          allowClear
          suffixIcon={null}
          optionRender={(option) => <div style={{ whiteSpace: 'normal' }}>{option.label}</div>}
          showSearch={{ optionFilterProp: 'label' }}
          notFoundContent="No matching found"
          aria-label="Institution Country/Region"
        />
      </div>
      <div className="col-md-3 history__value">
        {isMobile && <div className="small-heading col-md-4">Institution State/Province</div>}
        <Input
          value={p.institution?.stateProvince}
          placeholder="Institution State/Province"
          onChange={(e) =>
            setHistory({
              type: institutionStateProvinceType,
              data: { value: e.target.value, key: p.key },
            })
          }
          aria-label="Institution State/Province"
        />
      </div>
      <div className="col-md-3 history__value">
        {isMobile && <div className="small-heading col-md-4">Institution City</div>}
        <Input
          value={p.institution?.city}
          placeholder="Institution City"
          onChange={(e) =>
            setHistory({
              type: institutionCityType,
              data: { value: e.target.value, key: p.key },
            })
          }
          aria-label="Institution City"
        />
      </div>
      <div className="col-md-3 history__value">
        {isMobile && <div className="small-heading col-md-4">Department of Institution</div>}
        <Input
          value={p.institution?.department}
          placeholder="Department of Institution"
          onChange={(e) =>
            setHistory({
              type: institutionDepartmentType,
              data: { value: e.target.value, key: p.key },
            })
          }
          aria-label="Department of Institution"
        />
      </div>
      {invalidFieldMessages.length > 0 && (
        <div className="col-md-12 history__error" role="alert">
          {invalidFieldMessages.map((message) => (
            <div key={message}>
              <Icon name="exclamation-sign" /> {message}
            </div>
          ))}
        </div>
      )}
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
          if (p.key === action.data.key) {
            recordCopy.position = action.data.value
            if (action.data.value === 'Independent Researcher') {
              recordCopy.institution = {
                domain: 'independent-researcher.org',
                name: 'Independent',
              }
            } else if (
              p.position === 'Independent Researcher' &&
              p.institution?.domain === 'independent-researcher.org'
            ) {
              recordCopy.institution = {
                domain: '',
                name: '',
              }
            }
          }
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

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip()
  }, [profileHistory])

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
