/* globals promptError,clearMessage,$, promptMessage,view2: false */
import { useCallback, useEffect, useReducer, useState } from 'react'
import { nanoid } from 'nanoid'
import debounce from 'lodash/debounce'
import Icon from '../Icon'
import useBreakpoint from '../../hooks/useBreakPoint'
import api from '../../lib/api-client'
import BasicModal from '../BasicModal'
import { getNameString } from '../../lib/utils'
import useUser from '../../hooks/useUser'

const NamesButton = ({
  newRow,
  readonly,
  preferred,
  handleRemove,
  handleMakePreferred,
  handleRequestDeletion,
  hasPendingNameDeletionRequest,
  namesCount,
  hasPreferredUsername,
  isPreferredUsername,
}) => {
  const getRequestDeletionButtonTooltip = () =>
    hasPendingNameDeletionRequest
      ? 'Request to remove this name has been submitted.'
      : 'Submit a request to remove this name.'

  if (!newRow && readonly) {
    if (preferred) {
      return <div className="preferred hint">(Preferred Name)</div>
    }
    return (
      <>
        <button type="button" className="btn preferred_button" onClick={handleMakePreferred}>
          Make Preferred
        </button>
        {namesCount !== 1 && hasPreferredUsername && !isPreferredUsername && (
          <span title={getRequestDeletionButtonTooltip()}>
            <button
              type="button"
              className={`btn request_deletion_button${
                hasPendingNameDeletionRequest ? ' disabled' : ''
              }`}
              onClick={handleRequestDeletion}
            >
              Request Deletion
            </button>
          </span>
        )}
      </>
    )
  }
  return (
    <button type="button" className="btn remove_button" onClick={handleRemove}>
      Remove
    </button>
  )
}

const nameDeletionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal`
const NameDeleteRequestModal = ({
  nameToRequestDelete,
  setNameToRequestDelete,
  loadPendingNameDeletionNotes,
  preferredUsername,
}) => {
  const [reason, setReason] = useState('')
  const { accessToken } = useUser()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const postNameDeleteRequest = async () => {
    setIsLoading(true)
    try {
      const profileNameRemovalInvitation = await api.getInvitationById(
        nameDeletionInvitationId,
        accessToken
      )
      const editToPost = view2.constructEdit({
        formData: {
          name: getNameString(nameToRequestDelete),
          usernames: [nameToRequestDelete.username, ...nameToRequestDelete.altUsernames],
          comment: reason,
          status: 'Pending',
          editSignatureInputValues: [preferredUsername],
        },
        invitationObj: profileNameRemovalInvitation,
      })
      await api.post('/notes/edits', editToPost, { accessToken })
      $('#name-delete').modal('hide')
      promptMessage('Your request has been submitted')
      loadPendingNameDeletionNotes()
    } catch (apiError) {
      setError(apiError.message)
    }
    setIsLoading(false)
  }

  if (!nameToRequestDelete) return null

  return (
    <BasicModal
      id="name-delete"
      title="Request Name Deletion"
      onPrimaryButtonClick={postNameDeleteRequest}
      primaryButtonDisabled={!reason.length || isLoading}
      onClose={() => {
        setNameToRequestDelete(null)
        setError(null)
        setReason('')
      }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      <p>
        You are requesting to remove the name {getNameString(nameToRequestDelete)} from your
        profile and all associated submissions. This action cannot be undone.
      </p>
      <ul>
        <li>
          <strong>Full name</strong>: {nameToRequestDelete.fullname}
        </li>
      </ul>
      <textarea
        className="form-control"
        rows={5}
        placeholder="Please enter a short description of why you want to delete this name from your profile"
        value={reason}
        maxLength={5000}
        onChange={(e) => setReason(e.target.value)}
      />
    </BasicModal>
  )
}

const NamesSection = ({ profileNames, updateNames, preferredUsername }) => {
  const [nameToRequestDelete, setNameToRequestDelete] = useState(null)
  const [pendingNameDeletionRequests, setPendingNameDeletionRequests] = useState(null)
  const { accessToken } = useUser()
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
      return names.filter((name) => name.key !== action.data.key)
    }
    if (action.setPreferred) {
      return names.map((name) => {
        const nameCopy = { ...name, preferred: false }
        if (name.key === action.data.key) nameCopy.preferred = true
        return nameCopy
      })
    }
    if (action.reset) {
      return action.body.value.map((p) => ({ ...p, key: nanoid() }))
    }
    return names
  }
  const [names, setNames] = useReducer(
    namesReducer,
    profileNames?.map((p) => ({ ...p, key: nanoid() })) ?? []
  )
  const isMobile = !useBreakpoint('lg')

  const handleAddName = () => {
    const newNameRow = {
      key: nanoid(),
      altUsernames: [],
      fullname: '',
      preferred: false,
      username: '',
      newRow: true,
    }
    setNames({ addNewName: true, data: newNameRow })
  }

  const getTildeUserName = useCallback(
    debounce(async (targetValue, key) => {
      try {
        const tildeUsername = await api.get('/tildeusername', { fullname: targetValue })
        setNames({
          updateName: true,
          data: { key, field: 'username', value: tildeUsername.username },
        })
      } catch (error) {
        promptError(error.message)
      }
    }, 800),
    []
  )

  const handleUpdateName = async (key, field, targetValue) => {
    setNames({
      updateName: true,
      data: {
        key,
        field,
        value: targetValue.length === 1 ? targetValue.toUpperCase() : targetValue,
      },
    })
    clearMessage()
    getTildeUserName(targetValue, key)
  }

  const handleRemoveName = (key) => {
    clearMessage()
    setNames({ removeName: true, data: { key } })
  }

  const handleMakePreferredName = (key) => {
    setNames({ setPreferred: true, data: { key } })
  }

  const getNameDeletionRequests = async () => {
    const result = await api.get(
      '/notes',
      { invitation: nameDeletionInvitationId },
      { accessToken }
    )
    return result.notes
  }

  const loadPendingNameDeletionNotes = async () => {
    try {
      const nameDeletionNotes = await getNameDeletionRequests()
      setPendingNameDeletionRequests(nameDeletionNotes)
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleDeleteNameChange = async (nameToDelete) => {
    try {
      const nameDeletionNotes = await getNameDeletionRequests()
      const hasPendingNameDeletionRequest = nameDeletionNotes?.find(
        (p) =>
          p?.content?.usernames.value.includes(nameToDelete.username) &&
          p?.content?.status.value === 'Pending'
      )
      if (hasPendingNameDeletionRequest) {
        promptError(`Request to remove ${getNameString(nameToDelete)} has been submitted.`)
        setNameToRequestDelete(null)
        setPendingNameDeletionRequests(nameDeletionNotes)
        return
      }
      $('#name-delete').modal('show')
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadPendingNameDeletionNotes()
  }, [])

  useEffect(() => {
    updateNames(names)
  }, [names])

  useEffect(() => {
    if (nameToRequestDelete) {
      handleDeleteNameChange(nameToRequestDelete)
      return
    }
    $('#name-delete').modal('hide')
  }, [nameToRequestDelete])

  useEffect(() => {
    if (profileNames.some((p) => p.key)) return
    setNames({
      reset: true,
      body: { value: profileNames },
    })
  }, [profileNames])

  return (
    <div className="container names">
      {!isMobile && (
        <div className="row">
          <div className="small-heading col-md-4">Full Name</div>
          <div className="small-heading col-md-2" />
          <div className="small-heading col-md-2" />
        </div>
      )}

      {names.map((p) => {
        if (p.duplicate) return null
        const hasPendingNameDeletionRequest = pendingNameDeletionRequests?.find(
          (q) =>
            q?.content?.usernames.value.includes(p.username) &&
            q?.content?.status.value === 'Pending'
        )
        return (
          <div className="row" key={p.key}>
            <div className="col-md-4 names__value">
              {isMobile && <div className="small-heading col-md-2">Full Name</div>}
              <input
                aria-label="Full Name"
                type="text"
                className={`form-control full-name ${
                  profileNames.find((q) => q.key === p.key)?.valid === false
                    ? 'invalid-value'
                    : ''
                }`}
                value={p.fullname}
                readOnly={!p.newRow && p.username}
                onChange={(e) => {
                  handleUpdateName(p.key, 'fullname', e.target.value)
                }}
              />
            </div>
            <div className="col-md-2 names__value">
              <div className="names__tilde-id" translate="no">
                {p.username}
                <span
                  data-toggle="tooltip"
                  data-placement="top"
                  title={p.altUsernames.join(', ')}
                >
                  {`${p.altUsernames.length > 0 ? `+${p.altUsernames.length} more` : ''}`}
                </span>
              </div>
            </div>
            {pendingNameDeletionRequests && (
              <div className="col-md-4 names__value">
                <NamesButton
                  key={p.key}
                  newRow={p.newRow}
                  readonly={p.username}
                  preferred={p.preferred}
                  handleRemove={() => handleRemoveName(p.key)}
                  handleMakePreferred={() => handleMakePreferredName(p.key)}
                  handleRequestDeletion={() => setNameToRequestDelete(p)}
                  pendingNameDeletionRequests={pendingNameDeletionRequests}
                  hasPendingNameDeletionRequest={hasPendingNameDeletionRequest}
                  namesCount={names.length}
                  hasPreferredUsername={preferredUsername}
                  isPreferredUsername={preferredUsername === p.username}
                />
              </div>
            )}
          </div>
        )
      })}

      <div className="row">
        <div role="button" aria-label="add another name" tabIndex={0} onClick={handleAddName}>
          <Icon name="plus-sign" tooltip="add another name" />
        </div>
      </div>
      <NameDeleteRequestModal
        nameToRequestDelete={nameToRequestDelete}
        setNameToRequestDelete={setNameToRequestDelete}
        loadPendingNameDeletionNotes={loadPendingNameDeletionNotes}
        preferredUsername={preferredUsername}
      />
    </div>
  )
}

export default NamesSection
