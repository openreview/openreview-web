/* globals promptError,clearMessage,$, promptMessage: false */
import { useCallback, useEffect, useReducer, useState } from 'react'
import { nanoid } from 'nanoid'
import debounce from 'lodash/debounce'
import Icon from '../Icon'
import useBreakpoint from '../../hooks/useBreakPoint'
import api from '../../lib/api-client'
import BasicModal from '../BasicModal'
import { buildArray, getNameString } from '../../lib/utils'
import useUser from '../../hooks/useUser'

const NamesButton = ({
  newRow,
  readonly,
  preferred,
  handleRemove,
  handleMakePreferred,
  handleRequestDeletion,
  hasPendingNameDeletionRequest,
  hasRejectedNameDeletionRequest,
  namesCount,
  isPreferredUsername,
  showDeleteNameButton,
}) => {
  const getRequestDeletionButtonTooltip = () => {
    if (hasPendingNameDeletionRequest) return 'Request to remove this name has been submitted.'
    if (hasRejectedNameDeletionRequest) return "This name can't be removed."
    return 'Submit a request to remove this name.'
  }
  if (!newRow && readonly) {
    if (preferred) {
      return <div className="preferred hint">(Preferred Name)</div>
    }
    return (
      <>
        <button type="button" className="btn preferred_button" onClick={handleMakePreferred}>
          Make Preferred
        </button>
        {namesCount !== 1 && !isPreferredUsername && showDeleteNameButton && (
          <span title={getRequestDeletionButtonTooltip()}>
            <button
              type="button"
              className={`btn request_deletion_button${
                hasPendingNameDeletionRequest || hasRejectedNameDeletionRequest
                  ? ' disabled'
                  : ''
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
}) => {
  const [reason, setReason] = useState('')
  const { accessToken, user } = useUser()
  const [error, setError] = useState(null)

  const postNameDeleteRequest = async () => {
    try {
      const result = await api.get(
        '/invitations',
        { id: nameDeletionInvitationId },
        { accessToken }
      )
      const profileNameRemovalInvitation = result.invitations[0]
      await api.post(
        '/notes',
        {
          invitation: profileNameRemovalInvitation.id,
          content: {
            name: getNameString(nameToRequestDelete),
            usernames: [nameToRequestDelete.username, ...nameToRequestDelete.altUsernames],
            comment: reason,
            status: 'Pending',
          },
          readers: buildArray(
            profileNameRemovalInvitation,
            'readers',
            user.profile.preferredId
          ),
          writers: buildArray(
            profileNameRemovalInvitation,
            'writers',
            user.profile.preferredId
          ),
          signatures: [user.profile.preferredId],
        },
        { accessToken }
      )
      $('#name-delete').modal('hide')
      promptMessage('Your request has been submitted')
      loadPendingNameDeletionNotes()
    } catch (apiError) {
      setError(apiError.message)
    }
  }
  if (!nameToRequestDelete) return null
  return (
    <BasicModal
      id="name-delete"
      title="Request Name Deletion"
      onPrimaryButtonClick={postNameDeleteRequest}
      primaryButtonDisabled={!reason.length}
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
          <strong>First name</strong>: {nameToRequestDelete.first}
        </li>
        {nameToRequestDelete.middle && (
          <li>
            <strong>Middle name</strong>: {nameToRequestDelete.middle}
          </li>
        )}
        {nameToRequestDelete.last && (
          <li>
            <strong>Last name</strong>: {nameToRequestDelete.last}
          </li>
        )}
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
  const [showDeleteNameButton, setShowDeleteNameButton] = useState(false)
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
      first: '',
      last: '',
      middle: '',
      preferred: false,
      username: '',
      newRow: true,
    }
    setNames({ addNewName: true, data: newNameRow })
  }

  const getTildUserName = useCallback(
    // eslint-disable-next-line no-shadow
    debounce(async (field, targetValue, key, names) => {
      try {
        const tildeUsername = await api.get('/tildeusername', {
          first:
            field === 'first' ? targetValue : names.find((name) => name.key === key)?.first,
          middle:
            field === 'middle' ? targetValue : names.find((name) => name.key === key)?.middle,
          last: field === 'last' ? targetValue : names.find((name) => name.key === key)?.last,
        })
        setNames({
          updateName: true,
          data: { key, field: 'username', value: tildeUsername.username },
        })
      } catch (error) {
        promptError(error.message, { scrollToTop: false })
      }
    }, 800),
    []
  )

  const handleUpdateName = async (key, field, targetValue) => {
    // eslint-disable-next-line no-param-reassign
    if (targetValue.length === 1) targetValue = targetValue.toUpperCase()
    const update = { updateName: true, data: { key, field, value: targetValue } }
    setNames(update)
    clearMessage()
    getTildUserName(field, targetValue, key, names)
  }

  const handleRemoveName = (key) => {
    clearMessage()
    setNames({ removeName: true, data: { key } })
  }

  const handleMakePreferredName = (key) => {
    setNames({ setPreferred: true, data: { key } })
  }

  const loadPendingNameDeletionNotes = async () => {
    // #region check invitation has been created
    try {
      const invitationResult = await api.get(
        '/invitations',
        { id: nameDeletionInvitationId },
        { accessToken }
      )
      if (invitationResult.invitations.length) {
        setShowDeleteNameButton(true)
      }
    } catch (error) {} // eslint-disable-line no-empty
    // #endregion
    try {
      const result = await api.get(
        '/notes',
        { invitation: nameDeletionInvitationId },
        { accessToken }
      )
      setPendingNameDeletionRequests(result.notes)
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
      $('#name-delete').modal('show')
      return
    }
    $('#name-delete').modal('hide')
  }, [nameToRequestDelete])

  return (
    <div className="container names">
      {!isMobile && (
        <div className="row">
          <div className="small-heading col-md-2">First</div>
          <div className="small-heading col-md-2">
            Middle <span className="hint">(optional)</span>
          </div>
          <div className="small-heading col-md-2">Last</div>
          <div className="small-heading col-md-2" />
          <div className="small-heading col-md-2" />
        </div>
      )}

      {names.map((p) => {
        if (p.duplicate) return null
        const hasPendingNameDeletionRequest = pendingNameDeletionRequests?.find(
          (q) => q?.content?.usernames.includes(p.username) && q?.content?.status === 'Pending'
        )
        const hasRejectedNameDeletionRequest = pendingNameDeletionRequests?.find(
          (q) =>
            q?.content?.usernames.includes(p.username) && q?.content?.status === 'Rejected'
        )
        return (
          <div className="row" key={p.key}>
            <div className="col-md-2 names__value">
              {isMobile && <div className="small-heading col-md-2">First</div>}
              <input
                type="text"
                className={`form-control first-name ${
                  profileNames.find((q) => q.key === p.key)?.valid === false
                    ? 'invalid-value'
                    : ''
                }`}
                value={p.first}
                readOnly={!p.newRow && p.username}
                onChange={(e) => {
                  handleUpdateName(p.key, 'first', e.target.value)
                }}
              />
            </div>
            <div className="col-md-2 names__value">
              {isMobile && (
                <div className="small-heading col-md-2">
                  Middle <span className="hint">(optional)</span>
                </div>
              )}
              <input
                type="text"
                className="form-control middle-name"
                value={p.middle}
                readOnly={!p.newRow && p.username}
                onChange={(e) => {
                  handleUpdateName(p.key, 'middle', e.target.value)
                }}
              />
            </div>
            <div className="col-md-2 names__value">
              {isMobile && <div className="small-heading col-md-2">Last</div>}
              <input
                type="text"
                className={`form-control last-name ${
                  profileNames.find((q) => q.key === p.key)?.valid === false
                    ? 'invalid-value'
                    : ''
                }`}
                value={p.last}
                readOnly={!p.newRow && p.username}
                onChange={(e) => {
                  handleUpdateName(p.key, 'last', e.target.value)
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
                  hasRejectedNameDeletionRequest={hasRejectedNameDeletionRequest}
                  namesCount={names.length}
                  isPreferredUsername={preferredUsername === p.username}
                  showDeleteNameButton={showDeleteNameButton}
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
      />
    </div>
  )
}

export default NamesSection
