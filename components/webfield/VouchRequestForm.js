/* globals view2,promptError,promptMessage: false */
import copy from 'copy-to-clipboard'
import { useContext, useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { formatDateTime, prettyId } from '../../lib/utils'
import { formatVouchPosition, getVouchDetails, vouchExpiryDateOptions } from '../../lib/vouch'
import { translateInvitationMessage } from '../../lib/webfield-utils'
import Markdown from '../EditorComponents/Markdown'
import SpinnerButton from '../SpinnerButton'
import WebFieldContext from '../WebFieldContext'
import VouchStatements from './VouchStatements'

const dayMillis = 24 * 60 * 60 * 1000

const VouchRequestForm = () => {
  const {
    entity: invitation,
    args,
    instructions,
    requestedMessage,
    vouchInvitationId,
  } = useContext(WebFieldContext)
  const [voucherId, setVoucherId] = useState('')
  const [voucherLookup, setVoucherLookup] = useState(null)
  const [voucheeProfile, setVoucheeProfile] = useState(null)
  const [checked, setChecked] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [vouchRequest, setVouchRequest] = useState(null)

  const voucherRegex = invitation.edit?.note?.content?.voucher?.value?.param?.regex
  const statements = invitation.edit?.note?.content?.confirmations?.value?.param?.enum ?? []
  const expirationDays = invitation.content?.requestExpirationDays?.value
  const voucher = voucherId.trim()
  const isValidVoucher = Boolean(voucherRegex) && new RegExp(voucherRegex).test(voucher)
  const voucherProfile = voucherLookup?.id === voucher ? voucherLookup.profile : undefined

  useEffect(() => {
    if (typeof args.user !== 'string' || typeof args.key !== 'string') return
    api
      .get('/profiles', { id: args.user })
      .then(({ profiles }) => setVoucheeProfile(profiles?.[0] ?? null))
      .catch(() => setVoucheeProfile(null))
  }, [args.user, args.key])

  useEffect(() => {
    if (!isValidVoucher) return undefined
    let isCurrent = true
    const timer = setTimeout(() => {
      api
        .get('/profiles', { id: voucher })
        .then(({ profiles }) => {
          if (isCurrent) setVoucherLookup({ id: voucher, profile: profiles?.[0] ?? null })
        })
        .catch(() => {
          if (isCurrent) setVoucherLookup({ id: voucher, profile: null })
        })
    }, 500)
    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [voucher, isValidVoucher])

  if (typeof args.user !== 'string' || typeof args.key !== 'string') {
    return (
      <div className="alert alert-danger">
        <strong>Error:</strong> The link is invalid. Please use the link in the email you
        received.
      </div>
    )
  }

  const requestVouch = async () => {
    setIsSaving(true)
    try {
      const edit = view2.constructEdit({
        formData: {
          voucher,
          confirmations: statements,
          editSignatureInputValues: [args.user],
        },
        invitationObj: invitation,
      })
      const result = await api.post('/notes/edits', edit, { guestToken: args.key })
      const vouchId = vouchInvitationId.replace('{{number}}', result.note.number)
      setVouchRequest({
        link: `${window.location.origin}/invitation?id=${vouchId}`,
        expdate: expirationDays ? Date.now() + expirationDays * dayMillis : null,
      })
    } catch (error) {
      promptError(error.message)
    }
    setIsSaving(false)
  }

  if (vouchRequest) {
    return (
      <div className="note_editor">
        <Markdown text={translateInvitationMessage(requestedMessage, args)} />
        <div className="form-group">
          <label htmlFor="vouch-link">Link for {prettyId(voucher)}</label>
          <input
            id="vouch-link"
            className="form-control"
            readOnly
            value={vouchRequest.link}
            onFocus={(e) => e.target.select()}
          />
        </div>
        {vouchRequest.expdate && (
          <p>
            The request expires on{' '}
            <strong>{formatDateTime(vouchRequest.expdate, vouchExpiryDateOptions)}</strong>.
          </p>
        )}
        <SpinnerButton
          type="primary"
          onClick={() => {
            copy(vouchRequest.link)
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
        {voucherProfile && (
          <p className="text-success">
            Profile found:{' '}
            <a href={`/profile?id=${voucher}`} target="_blank" rel="noopener noreferrer">
              {getVouchDetails(voucherProfile).fullname ?? prettyId(voucher)}
            </a>
          </p>
        )}
        {voucherProfile === null && (
          <p className="text-warning">
            We couldn&apos;t confirm that this profile exists. It may not exist, or it may not
            be public. Check the profile ID with your colleague before you send the request.
          </p>
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
      <VouchStatements statements={statements} checked={checked} setChecked={setChecked} />
      <SpinnerButton
        type="primary"
        onClick={requestVouch}
        loading={isSaving}
        disabled={!isValidVoucher || checked.length !== statements.length || isSaving}
      >
        Request a vouch
      </SpinnerButton>
    </div>
  )
}

export default VouchRequestForm
