import { useReducer } from 'react'
import { nanoid } from 'nanoid'
import { CreatableDropdown } from '../Dropdown'
import MultiSelectorDropdown from '../MultiSelectorDropdown'

const RelationsSection = ({ profileRelation, relations, relationReaders, updateRelations }) => {
  const relationPlaceholder = 'Choose or type a relation'
  const relationOptions = relations.map(p => ({ value: p, label: p }))
  const relationReaderOptions = relationReaders.map(p => ({ value: p, label: p }))

  const relationReducer = (state, action) => {
    switch (action.type) {
      case 'relation':
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.relation = action.data.value
          return recordCopy
        })
      case 'updateReaders':
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.readers = action.data.value
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
      case 'name':
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.name = action.data.value
          return recordCopy
        })
      case 'email':
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) recordCopy.email = action.data.value
          return recordCopy
        })
      case 'addRelation':
        return [...state, {
          key: nanoid(),
          relation: '',
          name: '',
          email: '',
          start: '',
          end: '',
          readers: [],
        }]
      case 'removeRelation':
        return state.length > 1 ? state.filter(p => p.key !== action.data.key) : [{
          key: nanoid(),
          relation: '',
          name: '',
          email: '',
          start: '',
          end: '',
          readers: [],
        }]
      default:
        return state
    }
  }

  const [relation, setRelation] = useReducer(relationReducer, profileRelation.map(p => ({ ...p, key: nanoid() })))

  const getReaderText = (selectedValues) => {
    if (!selectedValues || !selectedValues.length || selectedValues.includes('everyone')) return 'everyone'
    return selectedValues.join(',')
  }

  return (
    <section>
      <h4>Advisors & Other Relations</h4>
      <p className="instructions">Enter all advisors, co-workers, and other people that should be included when detecting conflicts of interest.</p>
      <div className="container history">
        <div className="row">
          <div className="small-heading col-md-2">Relation</div>
          <div className="small-heading col-md-3">Name</div>
          <div className="small-heading col-md-3">Email</div>
          <div className="small-heading col-md-1">Start</div>
          <div className="small-heading col-md-1">End</div>
          <div className="small-heading col-md-1">Visible to</div>
        </div>
        {
          relation.map(p => (
            <div className="row" key={p.key}>
              <div className="col-md-2 relation__value">
                <CreatableDropdown
                  hideArrow
                  classNamePrefix="relation-dropdown"
                  placeholder={relationPlaceholder}
                  defaultValue={p.position ? { value: p.position, label: p.position } : null}
                  onChange={e => setRelation({ type: 'relation', data: { value: e.value, key: p.key } })}
                  options={relationOptions}
                />
              </div>
              <div className="col-md-3 relation__value">
                <input className="form-control" value={p.name ?? ''} onChange={e => setRelation({ type: 'name', data: { value: e.value, key: p.key } })} />
              </div>
              <div className="col-md-3 relation__value">
                <input className="form-control" value={p.email ?? ''} onChange={e => setRelation({ type: 'email', data: { value: e.value, key: p.key } })} />
              </div>
              <div className="col-md-1 relation__value">
                <input className="form-control" value={p.start ?? ''} onChange={e => setRelation({ type: 'startYear', data: { value: e.value, key: p.key } })} />
              </div>
              <div className="col-md-1 relation__value">
                <input className="form-control" value={p.end ?? ''} onChange={e => setRelation({ type: 'endYear', data: { value: e.value, key: p.key } })} />
              </div>
              <div className="col-md-1 relation__value">
                <MultiSelectorDropdown
                  extraDropdownClasses="relation__visibility-dropdown"
                  extraButtonClasses="relation__visibility-button"
                  options={relationReaderOptions}
                  selectedValues={p.readers}
                  setSelectedValues={values => setRelation({ type: 'updateReaders', data: { value: values, key: p.key } })}
                  displayTextFn={getReaderText}
                />
              </div>
              <div className="col-md-1 relation__value">
                <div className="glyphicon glyphicon-minus-sign" role="button" aria-label="remove relation" tabIndex={0} onClick={() => setRelation({ type: 'removeRelation', data: { key: p.key } })} />
              </div>
            </div>
          ))
        }
        <div className="row"><div className="glyphicon glyphicon-plus-sign" role="button" aria-label="add another relation" tabIndex={0} onClick={() => setRelation({ type: 'addRelation' })} /></div>
      </div>
    </section>
  )
}

export default RelationsSection
