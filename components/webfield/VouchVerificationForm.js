/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { formatDateTime, isValidEmail, prettyId } from '../../lib/utils'
import { formatVouchPosition, vouchExpiryDateOptions } from '../../lib/vouch'
import Markdown from '../EditorComponents/Markdown'
import LoadingSpinner from '../LoadingSpinner'
import SpinnerButton from '../SpinnerButton'
import WebFieldContext from '../WebFieldContext'
import VouchStatements from './VouchStatements'

const VouchVerificationForm = () => {
  const {
    entity: invitation,
    instructions,
    vouchedMessage,
    declinedMessage,
  } = useContext(WebFieldContext)
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isVouched, setIsVouched] = useState(null)
  const [isDeclined, setIsDeclined] = useState(false)
  const [checked, setChecked] = useState([])

  const profileId = invitation.assertion.profile.id
  const { content } = invitation.assertion.profile
  const names = content.names.value.const.add ?? []
  const history = content.history.value.const.add ?? []
  const homepageValue = content.homepage?.value
  const homepage =
    typeof homepageValue === 'string' && !homepageValue.includes('${') ? homepageValue : null
  const statements = invitation.assertion.content?.confirmations?.value?.param?.enum ?? []
  const fullname = names[0]?.fullname ?? prettyId(profileId)
  const expiryDate = invitation.expdate
    ? formatDateTime(invitation.expdate, vouchExpiryDateOptions)
    : null

  useEffect(() => {
    api
      .get('/profiles/assertions', { invitation: invitation.id })
      .then(({ assertions }) => setIsVouched(assertions?.length > 0))
      .catch(() => setIsVouched(false))
  }, [invitation.id])

  const vouch = async () => {
    setIsSaving(true)
    try {
      await api.post('/profiles/assertions', {
        invitation: invitation.id,
        signatures: invitation.assertion.signatures,
        content: { confirmations: { value: statements } },
        profile: {
          id: profileId,
          content: { emails: { value: { add: [email.trim().toLowerCase()] } } },
        },
      })
      setIsVouched(true)
    } catch (error) {
      promptError(error.message)
    }
    setIsSaving(false)
  }

  if (isVouched === null) return <LoadingSpinner inline />

  if (isVouched) {
    return (
      <div className="note_editor">
        <Markdown text={vouchedMessage} />
      </div>
    )
  }

  if (invitation.expdate && invitation.expdate < Date.now()) {
    return (
      <div className="alert alert-warning">
        This vouch link has expired. Ask {fullname} to send you a new vouch request.
      </div>
    )
  }

  if (isDeclined) {
    return (
      <div className="note_editor">
        <Markdown text={declinedMessage} />
        {expiryDate && (
          <p>
            If you change your mind, you can vouch from this link until{' '}
            <strong>{expiryDate}</strong>.
          </p>
        )}
        <SpinnerButton type="default" onClick={() => setIsDeclined(false)}>
          Back to the request
        </SpinnerButton>
      </div>
    )
  }

  return (
    <div className="note_editor">
      <Markdown text={instructions} />
      {expiryDate && (
        <p>
          This request expires on <strong>{expiryDate}</strong>.
        </p>
      )}
      <p>
        <strong>Name:</strong> {fullname}
      </p>
      {homepage && (
        <p>
          <strong>Homepage:</strong>{' '}
          <a href={homepage} target="_blank" rel="noopener noreferrer">
            {homepage}
          </a>
        </p>
      )}
      <p>
        <strong>Positions:</strong>
      </p>
      <ul>
        {history.map((entry) => (
          <li key={formatVouchPosition(entry)}>{formatVouchPosition(entry)}</li>
        ))}
      </ul>
      <div className="form-group">
        <label htmlFor="vouchee-email">{`${fullname}'s email address`}</label>
        <input
          id="vouchee-email"
          type="email"
          className="form-control"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <VouchStatements statements={statements} checked={checked} setChecked={setChecked} />
      <SpinnerButton
        type="primary"
        onClick={vouch}
        loading={isSaving}
        disabled={
          !isValidEmail(email.trim()) || checked.length !== statements.length || isSaving
        }
      >
        {`Vouch for ${fullname}`}
      </SpinnerButton>{' '}
      <SpinnerButton type="default" onClick={() => setIsDeclined(true)} disabled={isSaving}>
        Don&apos;t vouch
      </SpinnerButton>
    </div>
  )
}

export default VouchVerificationForm
