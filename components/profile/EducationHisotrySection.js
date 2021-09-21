import { useReducer } from 'react'
import { nanoid } from 'nanoid'
import { CreatableDropdown } from '../Dropdown'

const EducationHisotrySection = ({ profileHistory, positions, institutions }) => {
  const positionPlaceholder = 'Choose or type a position'
  const institutionPlaceholder = 'Choose or type an institution'
  const institutionDomainOptions = institutions.flatMap(p => (p.id ? { value: p.id, label: p.id } : []))
  const positionOptions = positions.map(p => ({ value: p, label: p }))

  const getInstitutionName = (domain) => {
    const institution = institutions.find(i => i.id === domain)
    if (!institution) return ''
    const parentInstitution = institutions.find(i => i.id === institution.parent)
    return `${institution.fullname}${parentInstitution ? `, ${parentInstitution.fullname}` : ''}`
  }

  const historyReducer = (state, action) => {
    switch (action.type) {
      case 'position':
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.position = action.data.value
          return recordCopy
        })
      case 'institutionName':
        return state.map((p) => {
          const recordCopy = { ...p, institution: { ...p.institution } }
          if (p.key === action.data.key) {
            recordCopy.institution.name = action.data.value
          }
          return recordCopy
        })
      case 'institutionDomain':
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
      case 'startYear':
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.start = action.data.value
          return recordCopy
        })
      case 'endYear':
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.end = action.data.value
          return recordCopy
        })
      case 'addHistory':
        return [...state, {
          key: nanoid(),
          position: '',
          start: '',
          end: '',
          institution: {
            domain: '',
            name: '',
          },
        }]
      case 'removeHistory':
        return state.filter(p => p.key !== action.data.key)
      default:
        return state
    }
  }

  const [history, setHistory] = useReducer(historyReducer, profileHistory.map(p => ({ ...p, key: nanoid() })))

  return (
    <section>
      <h4>Education & Career Hisotry</h4>
      <p className="instructions">
        Enter your education and career history.
        The institution domain is used for conflict of interest detection,
        author deduplication, analysis of career path history, and tallies of institutional diversity.
        For ongoing positions, leave the End field blank.
      </p>
      <div className="container history">
        <div className="row">
          <div className="small-heading col-md-2">Position</div>
          <div className="small-heading col-md-1">Start</div>
          <div className="small-heading col-md-1">End</div>
          <div className="small-heading col-md-3">Institution Domain</div>
          <div className="small-heading col-md-4">Institution Name</div>
        </div>
        {
          history.map(p => (
            <div className="row" key={p.key}>
              <div className="col-md-2 history__value">
                <CreatableDropdown
                  hideArrow
                  classNamePrefix="position-dropdown"
                  placeholder={positionPlaceholder}
                  defaultValue={p.position ? { value: p.position, label: p.position } : null}
                  onChange={e => setHistory({ type: 'position', data: { value: e.value, key: p.key } })}
                  options={positionOptions}
                />
              </div>
              <div className="col-md-1 history__value">
                <input className="form-control" value={p.start ?? ''} placeholder="year" onChange={e => setHistory({ type: 'startYear', data: { value: e.value, key: p.key } })} />
              </div>
              <div className="col-md-1 history__value">
                <input className="form-control" value={p.end ?? ''} placeholder="year" onChange={e => setHistory({ type: 'endYear', data: { value: e.value, key: p.key } })} />
              </div>
              <div className="col-md-3 history__value">
                <CreatableDropdown
                  hideArrow
                  classNamePrefix="institution-dropdown"
                  placeholder={institutionPlaceholder}
                  // eslint-disable-next-line max-len
                  defaultValue={p.institution?.domain ? { value: p.institution?.domain, label: p.institution?.domain } : null}
                  onChange={e => setHistory({ type: 'institutionDomain', data: { value: e.value, key: p.key } })}
                  options={institutionDomainOptions}
                />
              </div>
              <div className="col-md-4 history__value">
                <input className="form-control" value={p.institution?.name ?? ''} onChange={e => setHistory({ type: 'institutionName', data: { value: e.value, key: p.key } })} />
              </div>
              <div className="col-md-1 history__value">
                {history.length > 1 && <div className="glyphicon glyphicon-minus-sign" role="button" aria-label="remove history" tabIndex={0} onClick={() => setHistory({ type: 'removeHistory', data: { key: p.key } })} />}
              </div>
            </div>
          ))
        }
        <div className="row"><div className="glyphicon glyphicon-plus-sign" role="button" aria-label="add another history" tabIndex={0} onClick={() => setHistory({ type: 'addHistory' })} /></div>
      </div>
    </section>
  )
}

export default EducationHisotrySection
