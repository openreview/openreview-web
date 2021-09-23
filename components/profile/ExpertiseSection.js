import { useEffect, useReducer } from 'react'
import { nanoid } from 'nanoid'

const ExpertiseSection = ({ profileExpertises, updateExpertise }) => {
  const expertiseReducer = (state, action) => {
    switch (action.type) {
      case 'updateExpertise':
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.keywords = action.data.value.split(',').map(q => q.trim())
          }
          return recordCopy
        })
      case 'updateStart':
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.start = action.data.value
          }
          return recordCopy
        })
      case 'updateEnd':
        return state.map((p) => {
          const recordCopy = { ...p }
          if (p.key === action.data.key) {
            recordCopy.end = action.data.value
          }
          return recordCopy
        })
      case 'addExpertise':
        return [...state, {
          keywords: [],
          start: '',
          end: '',
          key: nanoid(),
        }]
      case 'removeExpertise':
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
  // eslint-disable-next-line max-len
  const [expertises, setExpertises] = useReducer(expertiseReducer, profileExpertises.map(p => ({ ...p, key: nanoid() })))

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
                <input className="form-control" value={p.keywords.join(', ') ?? ''} onChange={e => setExpertises({ type: 'updateExpertise', data: { value: e.target.value, key: p.key } })} />
              </div>
              <div className="col-md-1 expertise__value">
                <input className="form-control" value={p.start ?? ''} onChange={e => setExpertises({ type: 'updateStart', data: { value: e.target.value, key: p.key } })} />
              </div>
              <div className="col-md-1 expertise__value">
                <input className="form-control" value={p.end ?? ''} onChange={e => setExpertises({ type: 'updateEnd', data: { value: e.target.value, key: p.key } })} />
              </div>
              <div className="col-md-1 relation__value">
                <div className="glyphicon glyphicon-minus-sign" role="button" aria-label="remove expertise" tabIndex={0} onClick={() => setExpertises({ type: 'removeExpertise', data: { key: p.key } })} />
              </div>
            </div>
          ))
        }
        <div className="row">
          <div className="glyphicon glyphicon-plus-sign" role="button" aria-label="add another expertise" tabIndex={0} onClick={() => setExpertises({ type: 'addExpertise' })} />
        </div>
      </div>
    </section>
  )
}

export default ExpertiseSection
