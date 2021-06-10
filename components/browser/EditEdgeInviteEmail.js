/* eslint-disable no-use-before-define */
/* globals promptError,promptMessage: false */
import { useContext, useState } from 'react'
import api from '../../lib/api-client'
import { getInterpolatedValues, getSignatures } from '../../lib/edge-utils'
import { isValidEmail, prettyInvitationId } from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'
import UserContext from '../UserContext'
import EdgeBrowserContext from './EdgeBrowserContext'

// eslint-disable-next-line object-curly-newline
const EditEdgeInviteEmail = ({ type, otherType, entityType, parentId, parentNumber, reloadColumnEntities }) => {
  const [emailToInvite, setEmailToInvite] = useState('')
  const [loading, setLoading] = useState(false)
  const { editInvitations, availableSignaturesInvitationMap } = useContext(EdgeBrowserContext)
  const { user, accessToken } = useContext(UserContext)

  const editInvitation = editInvitations?.filter(p => p?.[type]?.query?.['value-regex'] === '~.*|.+@.+')?.[0]

  const handleInviteBtnClick = async () => {
    const email = emailToInvite.trim()
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
      signatures: getSignatures(editInvitation, availableSignaturesInvitationMap, parentNumber, user),
      nonreaders: getValues(editInvitation.nonreaders, email),
    }
    // post
    try {
      const result = await api.post('/edges', newEdgeJson, { accessToken })
      setEmailToInvite('')
      promptMessage(`Invitation has been sent to ${email} and it's waiting for the response.`)
    } catch (error) {
      promptError(error.message)
    }
    setLoading(false)
    // trigger column update
    reloadColumnEntities()
  }

  // readers/nonreaders/writers
  const getValues = (value, email) => getInterpolatedValues({
    value,
    columnType: type,
    shouldReplaceHeadNumber: false,
    paperNumber: null,
    parentPaperNumber: parentNumber,
    id: email,
    parentId,
  })

  const shouldDisableSubmitBtn = () => {
    if (loading) return true
    if (emailToInvite.trim().startsWith('~')) return false
    return !isValidEmail(emailToInvite.trim())
  }

  if (!editInvitation || entityType !== 'Profile') return null
  return (
    <div className="">
      <form className="form-inline widget-invite-assignment">
        {/* <label htmlFor="email-invite">Email/Profile: </label> */}
        <input type="email" id="email-invite" value={emailToInvite} onChange={e => setEmailToInvite(e.target.value)} placeholder={editInvitation[type].description} title={editInvitation[type].description} />
        <button type="button" className="btn btn-default btn-xs" onClick={handleInviteBtnClick} disabled={shouldDisableSubmitBtn()}>
          {loading && <LoadingSpinner inline text="" extraClass="spinner-small" />}
          {prettyInvitationId(editInvitation.id)}
        </button>
      </form>
    </div>
  )
}

export default EditEdgeInviteEmail
