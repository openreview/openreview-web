/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { isValidEmail, prettyId } from '../../lib/utils'
import { formatVouchPosition } from '../../lib/vouch'
import Markdown from '../EditorComponents/Markdown'
import LoadingSpinner from '../LoadingSpinner'
import SpinnerButton from '../SpinnerButton'
import WebFieldContext from '../WebFieldContext'

const VouchVerificationForm = () => {
  const { entity: invitation, instructions, vouchedMessage } = useContext(WebFieldContext)
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isVouched, setIsVouched] = useState(null)
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

  return (
    <div className="note_editor">
      <Markdown text={instructions} />
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
      <div className="form-group">
        {statements.map((statement) => (
          <div className="checkbox" key={statement}>
            <label>
              <input
                type="checkbox"
                checked={checked.includes(statement)}
                onChange={(e) =>
                  setChecked((existing) =>
                    e.target.checked
                      ? [...existing, statement]
                      : existing.filter((p) => p !== statement)
                  )
                }
              />{' '}
              {statement}
            </label>
          </div>
        ))}
      </div>
      <SpinnerButton
        type="primary"
        onClick={vouch}
        loading={isSaving}
        disabled={
          !isValidEmail(email.trim()) || checked.length !== statements.length || isSaving
        }
      >
        {`Vouch for ${fullname}`}
      </SpinnerButton>
    </div>
  )
}

export default VouchVerificationForm
