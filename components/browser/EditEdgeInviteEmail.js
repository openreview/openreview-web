/* globals promptError: false */
/* globals promptMessage: false */

import { useContext, useState } from 'react'
import api from '../../lib/api-client'
import { getInterpolatedValues, getSignatures } from '../../lib/edge-utils'
import { isValidEmail, prettyInvitationId } from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'
import UserContext from '../UserContext'
import EdgeBrowserContext from './EdgeBrowserContext'

const EditEdgeInviteEmail = ({
  type,
  otherType,
  entityType,
  parentId,
  parentNumber,
  reloadColumnEntities,
}) => {
  const [emailToInvite, setEmailToInvite] = useState('')
  const [loading, setLoading] = useState(false)
  const { editInvitations, availableSignaturesInvitationMap, version } =
    useContext(EdgeBrowserContext)
  const { user, accessToken } = useContext(UserContext)

  const editInvitation = editInvitations?.filter(
    (p) => p?.[type]?.query?.['value-regex'] === '~.*|.+@.+'
  )?.[0]

  // readers/nonreaders/writers
  const getValues = (value, email) =>
    getInterpolatedValues({
      value,
      columnType: type,
      shouldReplaceHeadNumber: false,
      paperNumber: null,
      parentPaperNumber: parentNumber,
      id: email,
      parentId,
      version,
    })

  const handleInviteEmail = async () => {
    let email = emailToInvite.trim()
    if (!email.startsWith('~')) email = email.toLowerCase()
    setLoading(true)
    // construct the template
    const newEdgeJson = {
      invitation: editInvitation.id,
      [type]: email,
      [otherType]: parentId,
      label: editInvitation.label?.default,
      weight: 0,
      readers: getValues(editInvitation.readers, email),
      writers: getValues(editInvitation.writers, email),
      signatures: getSignatures(
        editInvitation,
        availableSignaturesInvitationMap,
        parentNumber,
        user
      ),
      nonreaders: getValues(editInvitation.nonreaders, email),
    }
    // post
    try {
      const result = await api.post('/edges', newEdgeJson, { accessToken, version })
      setEmailToInvite('')
      promptMessage(`Invitation has been sent to ${email} and it's waiting for the response.`)
    } catch (error) {
      promptError(error.message)
    }
    setLoading(false)
    // trigger column update
    reloadColumnEntities()
  }

  const shouldDisableSubmitBtn = () => {
    if (loading) return true
    if (emailToInvite.trim().startsWith('~')) return false
    return !isValidEmail(emailToInvite.trim())
  }

  if (!editInvitation || entityType !== 'profile') return null
  return (
    <div className="">
      <form
        className="form-inline widget-invite-assignment"
        onSubmit={(e) => {
          e.preventDefault()
          handleInviteEmail()
        }}
      >
        <input
          type="text"
          id="email-invite"
          autoComplete="off"
          value={emailToInvite}
          placeholder={editInvitation[type].description}
          title={editInvitation[type].description}
          onChange={(e) => setEmailToInvite(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-default btn-xs"
          disabled={shouldDisableSubmitBtn()}
        >
          {loading && <LoadingSpinner inline text="" extraClass="spinner-small" />}
          {prettyInvitationId(editInvitation.id)}
        </button>
      </form>
    </div>
  )
}

export default EditEdgeInviteEmail
