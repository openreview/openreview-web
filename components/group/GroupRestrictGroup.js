/* globals promptError,promptMessage: false */
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import EditorSection from '../EditorSection'
import LoadingSpinner from '../LoadingSpinner'

const GroupRestrictGroup = ({ group, setIsGroupRestricted }) => {
  const [restrictStatus, setRestrictStatus] = useState(null)
  const [confirmGroupId, setConfirmGroupId] = useState('')

  const loadRestrictStatus = async () => {
    try {
      const result = await api.get('/domains/restriction', { domain: group.id })
      setRestrictStatus(result.status)
      setIsGroupRestricted(result.status === 'restricted')
    } catch (error) {
      promptError(error.message)
    }
  }

  const restrictUnrestrictGroup = async () => {
    try {
      const result = await api.post('/domains/restriction', {
        domain: group.id,
        action: restrictStatus === 'restricted' ? 'unrestrict' : 'restrict',
      })
      if (result.status !== 'ok')
        throw new Error('An error occurred while updating restriction status')
      setConfirmGroupId('')
      loadRestrictStatus()
      promptMessage(
        `${restrictStatus === 'restricted' ? 'Emergency shutdown has been lifted' : 'Venue is now under emergency shutdown'}`
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadRestrictStatus()
  }, [group.id])

  if (!restrictStatus) return <LoadingSpinner inline text={null} />

  return (
    <EditorSection title="Group Emergency Shutdown" className="restrict">
      <div className="container restrict-container">
        <div className="restrict-instructions">
          <p>
            <strong>⚠️ Emergency use only.</strong> Use this if you suspect a misconfiguration
            is exposing sensitive data (e.g., reviewer identities, confidential submissions,
            or private notes).
          </p>
          <p>When shut down:</p>
          <ul>
            <li>All read and write access for non-organizers is immediately suspended</li>
            <li>Authors, reviewers, and the public cannot access any venue data</li>
            <li>Venue organizers retain full access to investigate and fix the issue</li>
          </ul>
          <p>
            Access can be restored at any time by typing the group id and clicking{' '}
            <strong>Lift Emergency Shutdown</strong>. Only use this feature if there is an
            active data leak or misconfiguration that needs immediate containment.
          </p>
        </div>
        <label htmlFor="confirm-group-id">
          Type the group id to{' '}
          {restrictStatus === 'restricted'
            ? 'lift emergency shutdown'
            : 'shut down this venue'}
        </label>
        <input
          id="confirm-group-id"
          type="text"
          className="form-control"
          value={confirmGroupId}
          onChange={(e) => setConfirmGroupId(e.target.value)}
          placeholder={group.id}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={confirmGroupId !== group.id}
          onClick={restrictUnrestrictGroup}
        >
          {restrictStatus === 'restricted' ? 'Lift Emergency Shutdown ' : 'Shut Down Venue'}
        </button>
      </div>
    </EditorSection>
  )
}

export default GroupRestrictGroup
