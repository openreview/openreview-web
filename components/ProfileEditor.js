/* eslint-disable object-curly-newline */
/* eslint-disable arrow-body-style */
/* eslint-disable arrow-parens */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
/* eslint-disable no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import '../styles/partials/ProfileEditor.less'
import { useState, useEffect, useReducer } from 'react'
import shortid from 'shortid'
import api from '../lib/api-client'

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
      key: shortid.generate(),
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
      promptError(error)
    }
  }

  const handleRemoveName = (key) => {
    setNames({ removeName: true, data: { key } })
  }

  useEffect(() => {
    if (profileNames) {
      profileNames.forEach(name => name.key = shortid.generate())
      setNames({ initialLoad: true, data: profileNames })
    }
  }, [profileNames])

  return (
    <section>
      <h4>Names</h4>
      <p className="instructions">How do you usually write your name as author of a paper? Also add any other names you have authored papers under.</p>
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
            names && names.map((name) => {
              return (
                <tr border="0" className="info_row" key={name.key}>
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
                    <NamesButton key={name.key} newRow={name.newRow} readonly={name.username.length} preferred={name.preferred} handleRemove={() => handleRemoveName(name.key)} />
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

const NamesButton = ({ newRow, readonly, preferred, handleRemove }) => {
  if (!newRow && readonly) {
    if (preferred) {
      return <span className="preferred hint">(Preferred Name)</span>
    }
    return <button type="button" className="btn preferred_button">Make Preferred</button>
  }
  return <button type="button" className="btn remove_button" onClick={handleRemove}>Remove</button>
}

const ProfileEditor = ({ profile }) => {
  return (
    <div className="profile-edit-container">
      <NamesSection profileNames={profile?.names} />
      <button type="button" className="btn">Register for OpenReview</button>
      <button type="button" className="btn">Cancel</button>
    </div>
  )
}

export default ProfileEditor
