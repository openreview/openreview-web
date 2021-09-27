import { useEffect, useReducer } from 'react'
import { nanoid } from 'nanoid'

const ExpertiseSection = ({ profileExpertises, updateExpertise }) => {
  // #region action type constants
  const expertiseType = 'updateExpertise'
  const startType = 'updateStart'
  const endType = 'updateEnd'
  const addExpertiseType = 'addExpertise'
  const removeExpertiseType = 'removeExpertise'
  // #endregion

  const expertiseReducer = (state, action) => {
    switch (action.type) {
      case expertiseType:
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.keywords = action.data.value.split(',').map(q => q.trim())
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
        return [...state, {
          keywords: [],
          start: '',
          end: '',
          key: nanoid(),
        }]
      case removeExpertiseType:
        return state.length > 1 ? state.filter(p => p.key !== action.data.key) : [{
          keywords: [],
          start: '',
          end: '',
          key: nanoid(),
        }]
      default:
        return state
    }
  }

  const [expertises, setExpertises] = useReducer(
    expertiseReducer,
    profileExpertises?.length > 0
      ? profileExpertises?.map(p => ({ ...p, key: nanoid() }))
      : [...Array(3).keys()].map(() => ({
        keywords: [],
        start: '',
        end: '',
        key: nanoid(),
      })),
  )

  useEffect(() => {
    updateExpertise(expertises)
  }, [expertises])

  return (
    <section>
      <h4>Expertise</h4>
      <p className="instructions">
        For each line, enter comma-separated keyphrases representing an intersection of your interests.
        {' '}
        Think of each line as a query for papers in which you would have expertise and interest. For example:
        <br />
        <em>topic models, social network analysis, computational social science</em>
        <br />
        <em>deep learning, RNNs, dependency parsing</em>
      </p>
      <div className="container expertise">
        <div className="row">
          <div className="small-heading col-md-6">Research areas of interest</div>
          <div className="small-heading col-md-1">Start</div>
          <div className="small-heading col-md-1">End</div>
        </div>
        {
          expertises.map(p => (
            <div className="row" key={p.key}>
              <div className="col-md-6 expertise__value">
                <input
                  className={`form-control ${profileExpertises?.find(q => q.key === p.key)?.valid === false ? 'invalid-value' : ''}`}
                  value={p.keywords.join(', ') ?? ''}
                  onChange={e => setExpertises({ type: expertiseType, data: { value: e.target.value, key: p.key } })}
                />
              </div>
              <div className="col-md-1 expertise__value">
                <input
                  className={`form-control ${profileExpertises?.find(q => q.key === p.key)?.valid === false ? 'invalid-value' : ''}`}
                  placeholder="year"
                  value={p.start ?? ''}
                  onChange={e => setExpertises({ type: startType, data: { value: e.target.value, key: p.key } })}
                />
              </div>
              <div className="col-md-1 expertise__value">
                <input
                  className={`form-control ${profileExpertises?.find(q => q.key === p.key)?.valid === false ? 'invalid-value' : ''}`}
                  placeholder="year"
                  value={p.end ?? ''}
                  onChange={e => setExpertises({ type: endType, data: { value: e.target.value, key: p.key } })}
                />
              </div>
              <div className="col-md-1 relation__value">
                <div className="glyphicon glyphicon-minus-sign" role="button" aria-label="remove expertise" tabIndex={0} onClick={() => setExpertises({ type: removeExpertiseType, data: { key: p.key } })} />
              </div>
            </div>
          ))
        }
        <div className="row">
          <div className="glyphicon glyphicon-plus-sign" role="button" aria-label="add another expertise" tabIndex={0} onClick={() => setExpertises({ type: addExpertiseType })} />
        </div>
      </div>
    </section>
  )
}

export default ExpertiseSection
