/* eslint-disable arrow-body-style */
/* eslint-disable arrow-parens */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
/* eslint-disable no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* globals promptError: false */

/**
 * WIP: This is a re-implementation of the current profile edit UI in pure React.
 * Currently on the Names and Gender sections are implemented.
 */

import { useEffect, useReducer } from 'react'
import api from '../lib/api-client'

// import '../styles/components/legacy-profile-editor.less'

const NamesSection = ({ profileNames }) => {
  const namesReducer = (names, action) => {
    if (action.initialLoad) return action.data
    if (action.addNewName) return [...names, action.data]
    if (action.updateName) {
      return names.map(name => {
        const nameCopy = { ...name }
        if (name.key === action.data.key) nameCopy[action.data.field] = action.data.value
        return nameCopy
      })
    }
    if (action.removeName) {
      return names.filter(name => name.key !== action.data.key)
    }
    if (action.setPreferred) {
      return names.map(name => {
        const nameCopy = { ...name, preferred: false }
        if (name.key === action.data.key) nameCopy.preferred = true
        return nameCopy
      })
    }
    return names
  }

  const [names, setNames] = useReducer(namesReducer, profileNames)

  const handleAddName = () => {
    const newNameRow = {
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

  const handleUpdateName = async update => {
    setNames(update)
    try {
      const tildeUsername = await api.get('/tildeusername', {
        first: update.data.field === 'first' ? update.data.value : names.find(name => name.key === update.data.key).first,
        middle: update.data.field === 'middle' ? update.data.value : names.find(name => name.key === update.data.key).middle,
        last: update.data.field === 'last' ? update.data.value : names.find(name => name.key === update.data.key).last,
      })
      setNames({ updateName: true, data: { key: update.data.key, field: 'username', value: tildeUsername.username } })
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

  useEffect(() => {
    if (profileNames) {
      setNames({ initialLoad: true, data: profileNames })
    }
  }, [profileNames])

  return (
    <section>
      <h4>Names</h4>
      <p className="instructions">Enter your full name (first, middle, last). Also add any other names you have used in the past when authoring papers.</p>
      <table className="info_table" id="names_table">
        <tbody>
          <tr border="0">
            <td className="info_item"><div className="small_heading">First</div></td>
            <td className="info_item"><div className="small_heading">Middle (optional)</div></td>
            <td className="info_item"><div className="small_heading">Last</div></td>
            <td className="info_item"><div className="small_heading" /></td>
            <td className="info_item"><div className="small_heading" /></td>
          </tr>
          {
            names && names.map((name, i) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <tr border="0" className="info_row" key={i}>
                  <td className="info_item">
                    <input type="text" className="form-control first_name profile" defaultValue={name.first ?? ''} readOnly={!name.newRow && name.username.length} onChange={e => { handleUpdateName({ updateName: true, data: { key: name.key, field: 'first', value: e.target.value } }) }} />
                  </td>
                  <td className="info_item">
                    <input type="text" className="form-control middle_name profile" defaultValue={name.middle ?? ''} readOnly={!name.newRow && name.username.length} onChange={e => { handleUpdateName({ updateName: true, data: { key: name.key, field: 'middle', value: e.target.value } }) }} />
                  </td>
                  <td className="info_item">
                    <input type="text" className="form-control last_name profile" defaultValue={name.last ?? ''} readOnly={!name.newRow && name.username.length} onChange={e => { handleUpdateName({ updateName: true, data: { key: name.key, field: 'last', value: e.target.value } }) }} />
                  </td>
                  <td className="info_item">
                    <span className="newUsername">{name.username}</span>
                  </td>
                  <td className="info_item">
                    <span className="username" style={{ display: 'none' }}>{name.username}</span>
                  </td>
                  <td className="info_item preferred_cell">
                    <NamesButton key={name.key} newRow={name.newRow} readonly={name.username.length} preferred={name.preferred} handleRemove={() => handleRemoveName(name.key)} handleMakePreferred={() => handleMakePreferredName(name.key)} />
                  </td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
      <div className="glyphicon glyphicon-plus-sign" onClick={handleAddName} />
    </section>
  )
}

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

const GenderSection = ({ gender }) => {
  return (
    <section>
      <h4>Gender</h4>
      <p className="instructions">This information helps conferences better understand their gender diversity. (Optional)</p>
      <table id="personal_table" className="info_table">
        <tbody>
          <tr border="0" className="info_row">
            <td className="info_item">
              <div className="dropdown">
                <input placeholder="Choose a gender or type a custom gender" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}

const ProfileEditor = ({ profile }) => {
  return (
    <div className="profile-edit-container">
      <NamesSection profileNames={profile?.names} />
      <GenderSection gender={profile?.gender} />
      <button type="button" className="btn">Register for OpenReview</button>
      <button type="button" className="btn">Cancel</button>
    </div>
  )
}

export default ProfileEditor
