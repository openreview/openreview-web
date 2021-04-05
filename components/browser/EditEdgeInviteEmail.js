/* eslint-disable no-use-before-define */
/* globals promptError: false */
import { useContext, useState } from 'react'
import api from '../../lib/api-client'
import { getInterpolatedValues, getSignatures } from '../../lib/edge-utils'
import { isValidEmail, prettyInvitationId } from '../../lib/utils'
import UserContext from '../UserContext'
import EdgeBrowserContext from './EdgeBrowserContext'

// eslint-disable-next-line object-curly-newline
const EditEdgeInviteEmail = ({ type, otherType, entityType, parentId, parentNumber, reloadWithoutUpdate }) => {
  const [emailsToInvite, setEmailsToInvite] = useState('')
  const { editInvitations, availableSignaturesInvitationMap } = useContext(EdgeBrowserContext)
  const { user, accessToken } = useContext(UserContext)

  const emailsToInviteArray = emailsToInvite?.split(';')?.map(p => p.trim())?.filter(p => p)
  const editInvitation = editInvitations?.filter(p => p?.[type]?.query?.['value-regex'] === '~.*|.+@.+')?.[0]

  const handleInviteBtnClick = async () => {
    emailsToInviteArray.forEach(async (email) => {
      // construct the template
      const newEdgeJson = {
        invitation: editInvitation.id,
        name: editInvitation.id.split('/').pop().replace(/_/g, ' '),
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
        setEmailsToInvite('')
      } catch (error) {
        promptError(error.message)
      }
    })
    // trigger column update
    reloadWithoutUpdate()
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
    if (!emailsToInviteArray.length) return true
    return emailsToInviteArray.some((p) => {
      if (p.startsWith('~')) return false
      return !isValidEmail(p)
    })
  }

  if (!editInvitation || entityType !== 'Profile') return null
  return (
    <div className="">
      <form className="form-inline widget-invite-assignment">
        {/* <label htmlFor="email-invite">Email/Profile: </label> */}
        <input type="email" id="email-invite" value={emailsToInvite} onChange={e => setEmailsToInvite(e.target.value)} placeholder={editInvitation[type].description} />
        <button type="button" className="btn btn-default btn-xs" onClick={handleInviteBtnClick} disabled={shouldDisableSubmitBtn()}>{prettyInvitationId(editInvitation.id)}</button>
      </form>
    </div>
  )
}

export default EditEdgeInviteEmail
