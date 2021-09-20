/* globals promptError: false */
import { useReducer, useEffect } from 'react'
import { nanoid } from 'nanoid'
import api from '../../lib/api-client'
import NamesButton from './NameButton'

const NamesSection = ({ profileNames }) => {
  const namesReducer = (names, action) => {
    // if (action.initialLoad) return action.data
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

  const [names, setNames] = useReducer(namesReducer, profileNames?.map(p => ({ ...p, key: nanoid() })))

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

  const handleUpdateName = async (key, field, targetValue) => {
    // eslint-disable-next-line no-param-reassign
    if (targetValue.length === 1) targetValue = targetValue.toUpperCase()
    const update = { updateName: true, data: { key, field, value: targetValue } }
    setNames(update)
    try {
      const tildeUsername = await api.get('/tildeusername', {
        first: field === 'first' ? targetValue : names.find(name => name.key === key).first,
        middle: field === 'middle' ? targetValue : names.find(name => name.key === key).middle,
        last: field === 'last' ? targetValue : names.find(name => name.key === key).last,
      })
      setNames({ updateName: true, data: { key, field: 'username', value: tildeUsername.username } })
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleRemoveName = (key) => {
    setNames({ removeName: true, data: { key } })
  }

  const handleMakePreferredName = (key) => {
    setNames({ setPreferred: true, data: { key } })
  }

  // useEffect(() => {
  //   if (profileNames) {
  //     setNames({ initialLoad: true, data: profileNames })
  //   }
  // }, [profileNames])

  return (
    <section>
      <h4>Names</h4>
      <p className="instructions">Enter your full name (first, middle, last). Also add any other names you have used in the past when authoring papers.</p>
      <table className="names-table">
        <tbody>
          <tr border="0">
            <td><div className="small-heading">First</div></td>
            <td>
              <div className="small-heading">{'Middle '}</div>
              <span className="hint">(optional)</span>
            </td>
            <td><div className="small-heading">Last</div></td>
            <td><div className="small-heading" /></td>
            <td><div className="small-heading" /></td>
          </tr>
          {
            // eslint-disable-next-line arrow-body-style
            names && names.map((name) => {
              return (
                <tr border="0" className="info_row" key={name.key}>
                  <td className="info_item">
                    <input
                      type="text"
                      className="form-control first_name profile"
                      value={name.first}
                      readOnly={!name.newRow && name.username.length}
                      onChange={(e) => { handleUpdateName(name.key, 'first', e.target.value) }}
                    />
                  </td>
                  <td className="info_item">
                    <input
                      type="text"
                      className="form-control middle_name profile"
                      value={name.middle}
                      readOnly={!name.newRow && name.username.length}
                      onChange={(e) => { handleUpdateName(name.ley, 'middle', e.target.value) }}
                    />
                  </td>
                  <td className="info_item">
                    <input
                      type="text"
                      className="form-control last_name profile"
                      value={name.last}
                      readOnly={!name.newRow && name.username.length}
                      onChange={(e) => { handleUpdateName(name.key, 'last', e.target.value) }}
                    />
                  </td>
                  <td className="info_item">
                    <span className="newUsername">{name.username}</span>
                  </td>
                  <td className="info_item">
                    <span className="username" style={{ display: 'none' }}>{name.username}</span>
                  </td>
                  <td className="info_item preferred_cell">
                    <NamesButton
                      key={name.key}
                      newRow={name.newRow}
                      readonly={name.username.length}
                      preferred={name.preferred}
                      handleRemove={() => handleRemoveName(name.key)}
                      handleMakePreferred={() => handleMakePreferredName(name.key)}
                    />
                  </td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
      <div className="glyphicon glyphicon-plus-sign" role="button" aria-label="add another name" tabIndex={0} onClick={handleAddName} />
    </section>
  )
}

export default NamesSection
