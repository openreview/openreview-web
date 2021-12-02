/* globals promptError: false */
import { useCallback, useEffect, useReducer } from 'react'
import { nanoid } from 'nanoid'
import debounce from 'lodash/debounce'
import Icon from '../Icon'
import useBreakpoint from '../../hooks/useBreakPoint'
import api from '../../lib/api-client'

const NamesButton = ({
  newRow, readonly, preferred, handleRemove, handleMakePreferred,
}) => {
  if (!newRow && readonly) {
    if (preferred) {
      return <span className="preferred hint">(Preferred Name)</span>
    }
    return <button type="button" className="btn preferred_button" onClick={handleMakePreferred}>Make Preferred</button>
  }
  return <button type="button" className="btn remove_button" onClick={handleRemove}>Remove</button>
}

const NamesSection = ({ profileNames, updateNames }) => {
  const namesReducer = (names, action) => {
    if (action.addNewName) return [...names, action.data]
    if (action.updateName) {
      return names.map((name) => {
        const nameCopy = { ...name }
        if (name.key === action.data.key) nameCopy[action.data.field] = action.data.value
        return nameCopy
      })
    }
    if (action.removeName) {
      return names.filter(name => name.key !== action.data.key)
    }
    if (action.setPreferred) {
      return names.map((name) => {
        const nameCopy = { ...name, preferred: false }
        if (name.key === action.data.key) nameCopy.preferred = true
        return nameCopy
      })
    }
    return names
  }
  const [names, setNames] = useReducer(namesReducer, profileNames?.map(p => ({ ...p, key: nanoid() })) ?? [])
  const isMobile = !useBreakpoint('lg')

  const handleAddName = () => {
    const newNameRow = {
      key: nanoid(),
      altUsernames: [],
      first: '',
      last: '',
      middle: '',
      preferred: false,
      username: '',
      newRow: true,
    }
    setNames({ addNewName: true, data: newNameRow })
  }

  // eslint-disable-next-line no-shadow
  const getTildUserName = useCallback(debounce(async (field, targetValue, key, names) => {
    try {
      const tildeUsername = await api.get('/tildeusername', {
        first: field === 'first' ? targetValue : names.find(name => name.key === key)?.first,
        middle: field === 'middle' ? targetValue : names.find(name => name.key === key)?.middle,
        last: field === 'last' ? targetValue : names.find(name => name.key === key)?.last,
      })
      setNames({ updateName: true, data: { key, field: 'username', value: tildeUsername.username } })
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
  }, 800), [])

  const handleUpdateName = async (key, field, targetValue) => {
    // eslint-disable-next-line no-param-reassign
    if (targetValue.length === 1) targetValue = targetValue.toUpperCase()
    const update = { updateName: true, data: { key, field, value: targetValue } }
    setNames(update)
    getTildUserName(field, targetValue, key, names)
  }

  const handleRemoveName = (key) => {
    setNames({ removeName: true, data: { key } })
  }

  const handleMakePreferredName = (key) => {
    setNames({ setPreferred: true, data: { key } })
  }

  useEffect(() => {
    updateNames(names)
  }, [names])

  return (
    <div className="container names">
      {!isMobile && (
        <div className="row">
          <div className="small-heading col-md-2">First</div>
          <div className="small-heading col-md-2">
            Middle
            {' '}
            <span className="hint">(optional)</span>
          </div>
          <div className="small-heading col-md-2">Last</div>
          <div className="small-heading col-md-2" />
          <div className="small-heading col-md-2" />
        </div>
      )}

      {names.map((p) => {
        if (p.duplicate) return null

        return (
          <div className="row" key={p.key}>
            <div className="col-md-2 names__value">
              {isMobile && <div className="small-heading col-md-2">First</div>}
              <input
                type="text"
                className={`form-control first-name ${profileNames.find(q => q.key === p.key)?.valid === false ? 'invalid-value' : ''}`}
                value={p.first}
                readOnly={!p.newRow && p.username}
                onChange={(e) => { handleUpdateName(p.key, 'first', e.target.value) }}
              />
            </div>
            <div className="col-md-2 names__value">
              {isMobile && (
                <div className="small-heading col-md-2">
                  Middle
                  {' '}
                  <span className="hint">(optional)</span>
                </div>
              )}
              <input
                type="text"
                className="form-control middle-name"
                value={p.middle}
                readOnly={!p.newRow && p.username}
                onChange={(e) => { handleUpdateName(p.key, 'middle', e.target.value) }}
              />
            </div>
            <div className="col-md-2 names__value">
              {isMobile && <div className="small-heading col-md-2">Last</div>}
              <input
                type="text"
                className={`form-control last-name ${profileNames.find(q => q.key === p.key)?.valid === false ? 'invalid-value' : ''}`}
                value={p.last}
                readOnly={!p.newRow && p.username}
                onChange={(e) => { handleUpdateName(p.key, 'last', e.target.value) }}
              />
            </div>
            <div className="col-md-2 names__value">
              <div className="names__tilde-id">
                {p.username}
                <span data-toggle="tooltip" data-placement="top" title={p.altUsernames.join(', ')}>
                  {`${p.altUsernames.length > 0 ? `+${p.altUsernames.length} more` : ''}`}
                </span>
              </div>
            </div>
            <div className="col-md-2 names__value">
              <NamesButton
                key={p.key}
                newRow={p.newRow}
                readonly={p.username}
                preferred={p.preferred}
                handleRemove={() => handleRemoveName(p.key)}
                handleMakePreferred={() => handleMakePreferredName(p.key)}
              />
            </div>
          </div>
        )
      })}

      <div className="row">
        <div role="button" aria-label="add another name" tabIndex={0} onClick={handleAddName}>
          <Icon name="plus-sign" tooltip="add another name" />
        </div>
      </div>
    </div>
  )
}

export default NamesSection
