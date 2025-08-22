import { useEffect, useReducer } from 'react'
import { nanoid } from 'nanoid'
import Icon from '../Icon'
import useBreakpoint from '../../hooks/useBreakPoint'
import { getStartEndYear } from '../../lib/utils'

const ExpertiseSection = ({ profileExpertises, updateExpertise }) => {
  // #region action type constants
  const expertiseType = 'updateExpertise'
  const startType = 'updateStart'
  const endType = 'updateEnd'
  const addExpertiseType = 'addExpertise'
  const removeExpertiseType = 'removeExpertise'
  // #endregion
  const isMobile = !useBreakpoint('lg')

  const expertiseReducer = (state, action) => {
    switch (action.type) {
      case expertiseType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.keyWordsValue = action.data.value
            recordCopy.keywords = action.data.value
              .split(',')
              .flatMap((q) => (q.trim().length ? q.trim() : []))
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
      case addExpertiseType:
        return [
          ...state,
          {
            keywords: [],
            keyWordsValue: '',
            start: null,
            end: null,
            key: nanoid(),
          },
        ]
      case removeExpertiseType:
        return state.length > 1
          ? state.filter((p) => p.key !== action.data.key)
          : [
              {
                keywords: [],
                start: null,
                end: null,
                key: nanoid(),
              },
            ]
      default:
        return state
    }
  }

  const [expertises, setExpertises] = useReducer(
    expertiseReducer,
    profileExpertises?.length > 0
      ? profileExpertises?.map((p) => ({
          ...p,
          start: getStartEndYear(p.start),
          end: getStartEndYear(p.end),
          key: nanoid(),
          keyWordsValue: p.keywords.join(','),
        }))
      : [...Array(3).keys()].map(() => ({
          keywords: [],
          keyWordsValue: '', // the value for input
          start: null,
          end: null,
          key: nanoid(),
        }))
  )

  useEffect(() => {
    updateExpertise(expertises)
  }, [expertises])

  return (
    <div className="container expertise">
      {!isMobile && (
        <div className="row">
          <div className="small-heading col-md-6">Research areas of interest</div>
          <div className="small-heading col-md-1">Start</div>
          <div className="small-heading col-md-1">End</div>
        </div>
      )}
      {expertises.map((p) => (
        <div className="row" key={p.key}>
          <div className="col-md-6 expertise__value">
            {isMobile && (
              <div className="small-heading col-md-6">Research areas of interest</div>
            )}
            <input
              className={`form-control ${
                profileExpertises?.find((q) => q.key === p.key)?.valid === false
                  ? 'invalid-value'
                  : ''
              }`}
              value={p.keyWordsValue}
              onChange={(e) =>
                setExpertises({
                  type: expertiseType,
                  data: { value: e.target.value, key: p.key },
                })
              }
              aria-label="Research areas of interest"
            />
          </div>
          <div className="col-md-1 expertise__value">
            {isMobile && <div className="small-heading col-md-1">Start</div>}
            <input
              className={`form-control ${
                profileExpertises?.find((q) => q.key === p.key)?.valid === false
                  ? 'invalid-value'
                  : ''
              }`}
              placeholder="year"
              value={p.start ?? ''}
              onChange={(e) =>
                setExpertises({ type: startType, data: { value: e.target.value, key: p.key } })
              }
              aria-label="Start Year"
            />
          </div>
          <div className="col-md-1 expertise__value">
            {isMobile && <div className="small-heading col-md-1">End</div>}
            <input
              className={`form-control ${
                profileExpertises?.find((q) => q.key === p.key)?.valid === false
                  ? 'invalid-value'
                  : ''
              }`}
              placeholder="year"
              value={p.end ?? ''}
              onChange={(e) =>
                setExpertises({ type: endType, data: { value: e.target.value, key: p.key } })
              }
              aria-label="End Year"
            />
          </div>
          <div className="col-md-1 relation__value">
            <div
              role="button"
              aria-label="remove expertise"
              tabIndex={0}
              onClick={() =>
                setExpertises({ type: removeExpertiseType, data: { key: p.key } })
              }
            >
              <Icon name="minus-sign" tooltip="remove expertise" />
            </div>
          </div>
        </div>
      ))}
      <div className="row">
        <div
          role="button"
          aria-label="add another expertise"
          tabIndex={0}
          onClick={() => setExpertises({ type: addExpertiseType })}
        >
          <Icon name="plus-sign" tooltip="add another expertise" />
        </div>
      </div>
    </div>
  )
}

export default ExpertiseSection
