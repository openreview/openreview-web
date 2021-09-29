import { useEffect, useReducer } from 'react'
import { nanoid } from 'nanoid'
import { CreatableDropdown } from '../Dropdown'
import MultiSelectorDropdown from '../MultiSelectorDropdown'

const RelationsSection = ({
  profileRelation,
  prefixedRelations,
  relationReaders,
  updateRelations,
}) => {
  const relationPlaceholder = 'Choose or type a relation'
  const relationOptions = prefixedRelations?.map(p => ({ value: p, label: p })) ?? []
  const relationReaderOptions = relationReaders?.map(p => ({ value: p, label: p })) ?? []
  // #region action type constants
  const relationType = 'updateRelation'
  const readersType = 'updateReaders'
  const startType = 'updateStart'
  const endType = 'updateEnd'
  const nameType = 'updateName'
  const emailType = 'updateEmail'
  const addRelationType = 'addRelation'
  const removeRelationType = 'removeRelation'
  // #endregion

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
            recordCopy.readers = action.data.value
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
      case addRelationType:
        return [...state, {
          key: nanoid(),
          relation: '',
          name: '',
          email: '',
          start: '',
          end: '',
          readers: [],
        }]
      case removeRelationType:
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

  const [relations, setRelation] = useReducer(
    relationReducer,
    profileRelation?.length > 0
      ? profileRelation?.map(p => ({ ...p, key: nanoid() }))
      : [...Array(3).keys()].map(() => ({
        key: nanoid(),
        relation: '',
        name: '',
        email: '',
        start: '',
        end: '',
        readers: [],
      })),
  )

  const getReaderText = (selectedValues) => {
    if (!selectedValues || !selectedValues.length || selectedValues.includes('everyone')) return 'everyone'
    return selectedValues.join(',')
  }

  useEffect(() => {
    updateRelations(relations)
  }, [relations])

  return (
    <section>
      <h4>Advisors & Other Relations</h4>
      <p className="instructions">Enter all advisors, co-workers, and other people that should be included when detecting conflicts of interest.</p>
      <div className="container relation">
        <div className="row">
          <div className="small-heading col-md-2">Relation</div>
          <div className="small-heading col-md-3">Name</div>
          <div className="small-heading col-md-3">Email</div>
          <div className="small-heading col-md-1">Start</div>
          <div className="small-heading col-md-1">End</div>
          <div className="small-heading col-md-1">Visible to</div>
        </div>
        {
          relations.map(p => (
            <div className="row" key={p.key}>
              <div className="col-md-2 relation__value">
                <CreatableDropdown
                  hideArrow
                  classNamePrefix="relation-dropdown"
                  placeholder={relationPlaceholder}
                  defaultValue={p.relation ? { value: p.relation, label: p.relation } : null}
                  onChange={e => setRelation({ type: relationType, data: { value: e.value, key: p.key } })}
                  options={relationOptions}
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      borderColor: state.selectProps.isInvalid ? '#8c1b13!important' : provided.borderColor,
                    }),
                  }}
                  isInvalid={profileRelation?.find(q => q.key === p.key)?.valid === false}
                />
              </div>
              <div className="col-md-3 relation__value">
                <input
                  className={`form-control ${profileRelation?.find(q => q.key === p.key)?.valid === false ? 'invalid-value' : ''}`}
                  value={p.name ?? ''}
                  onChange={e => setRelation({ type: nameType, data: { value: e.target.value, key: p.key } })}
                />
              </div>
              <div className="col-md-3 relation__value">
                <input
                  className={`form-control ${profileRelation?.find(q => q.key === p.key)?.valid === false ? 'invalid-value' : ''}`}
                  value={p.email ?? ''}
                  onChange={e => setRelation({ type: emailType, data: { value: e.target.value, key: p.key } })}
                />
              </div>
              <div className="col-md-1 relation__value">
                <input
                  className={`form-control ${profileRelation?.find(q => q.key === p.key)?.valid === false ? 'invalid-value' : ''}`}
                  value={p.start ?? ''}
                  placeholder="year"
                  onChange={e => setRelation({ type: startType, data: { value: e.target.value, key: p.key } })}
                />
              </div>
              <div className="col-md-1 relation__value">
                <input
                  className={`form-control ${profileRelation?.find(q => q.key === p.key)?.valid === false ? 'invalid-value' : ''}`}
                  value={p.end ?? ''}
                  placeholder="year"
                  onChange={e => setRelation({ type: endType, data: { value: e.target.value, key: p.key } })}
                />
              </div>
              <div className="col-md-1 relation__value">
                <MultiSelectorDropdown
                  extraDropdownClasses="relation__visibility-dropdown"
                  extraButtonClasses="relation__visibility-button"
                  options={relationReaderOptions}
                  selectedValues={p.readers}
                  setSelectedValues={values => setRelation({ type: readersType, data: { value: values, key: p.key } })}
                  displayTextFn={getReaderText}
                />
              </div>
              <div className="col-md-1 relation__value">
                <div className="glyphicon glyphicon-minus-sign" role="button" aria-label="remove relation" tabIndex={0} onClick={() => setRelation({ type: removeRelationType, data: { key: p.key } })} />
              </div>
            </div>
          ))
        }
        <div className="row"><div className="glyphicon glyphicon-plus-sign" role="button" aria-label="add another relation" tabIndex={0} onClick={() => setRelation({ type: addRelationType })} /></div>
      </div>
    </section>
  )
}

export default RelationsSection
