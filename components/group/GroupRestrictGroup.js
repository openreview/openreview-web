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
