/* globals view2,promptError,promptMessage: false */
import copy from 'copy-to-clipboard'
import { useContext, useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import { formatVouchPosition, getVouchDetails } from '../../lib/vouch'
import { translateInvitationMessage } from '../../lib/webfield-utils'
import Markdown from '../EditorComponents/Markdown'
import SpinnerButton from '../SpinnerButton'
import WebFieldContext from '../WebFieldContext'

const VouchRequestForm = () => {
  const {
    entity: invitation,
    args,
    instructions,
    requestedMessage,
    vouchInvitationId,
  } = useContext(WebFieldContext)
  const [voucherId, setVoucherId] = useState('')
  const [voucheeProfile, setVoucheeProfile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [vouchLink, setVouchLink] = useState(null)

  useEffect(() => {
    if (typeof args.user !== 'string' || typeof args.key !== 'string') return
    api
      .get('/profiles', { id: args.user })
      .then(({ profiles }) => setVoucheeProfile(profiles?.[0] ?? null))
      .catch(() => setVoucheeProfile(null))
  }, [args.user, args.key])

  if (typeof args.user !== 'string' || typeof args.key !== 'string') {
    return (
      <div className="alert alert-danger">
        <strong>Error:</strong> The link is invalid. Please use the link in the email you
        received.
      </div>
    )
  }

  const voucherRegex = invitation.edit?.note?.content?.voucher?.value?.param?.regex
  const voucher = voucherId.trim()
  const isValidVoucher = Boolean(voucherRegex) && new RegExp(voucherRegex).test(voucher)

  const requestVouch = async () => {
    setIsSaving(true)
    try {
      const edit = view2.constructEdit({
        formData: {
          voucher,
          editSignatureInputValues: [args.user],
        },
        invitationObj: invitation,
      })
      const result = await api.post('/notes/edits', edit, { guestToken: args.key })
      const vouchId = vouchInvitationId.replace('{{number}}', result.note.number)
      setVouchLink(`${window.location.origin}/invitation?id=${vouchId}`)
    } catch (error) {
      promptError(error.message)
    }
    setIsSaving(false)
  }

  if (vouchLink) {
    return (
      <div className="note_editor">
        <Markdown text={translateInvitationMessage(requestedMessage, args)} />
        <div className="form-group">
          <label htmlFor="vouch-link">Link for {prettyId(voucher)}</label>
          <input
            id="vouch-link"
            className="form-control"
            readOnly
            value={vouchLink}
            onFocus={(e) => e.target.select()}
          />
        </div>
        <SpinnerButton
          type="primary"
          onClick={() => {
            copy(vouchLink)
            promptMessage('Link copied')
          }}
        >
          Copy link
        </SpinnerButton>
      </div>
    )
  }

  const details = voucheeProfile ? getVouchDetails(voucheeProfile) : null

  return (
    <div className="note_editor">
      <Markdown text={translateInvitationMessage(instructions, args)} />
      <p>
        Request for <strong>{prettyId(args.user)}</strong>
      </p>
      <div className="form-group">
        <label htmlFor="voucher-id">Your colleague&apos;s profile ID</label>
        <input
          id="voucher-id"
          className="form-control"
          placeholder="~Jane_Doe1"
          value={voucherId}
          onChange={(e) => setVoucherId(e.target.value)}
        />
        {voucher && !isValidVoucher && (
          <p className="text-danger">Enter a profile ID such as ~Jane_Doe1.</p>
        )}
      </div>
      {details && (
        <div className="vouch-details">
          <p>
            <strong>Your colleague will confirm:</strong>
          </p>
          <ul>
            <li>Name: {details.fullname}</li>
            {typeof args.email === 'string' && <li>Email: {args.email}</li>}
            {details.homepage && <li>Homepage: {details.homepage}</li>}
            {details.positions.map((entry) => (
              <li key={formatVouchPosition(entry)}>Position: {formatVouchPosition(entry)}</li>
            ))}
          </ul>
        </div>
      )}
      <SpinnerButton
        type="primary"
        onClick={requestVouch}
        loading={isSaving}
        disabled={!isValidVoucher || isSaving}
      >
        Request a vouch
      </SpinnerButton>
    </div>
  )
}

export default VouchRequestForm
