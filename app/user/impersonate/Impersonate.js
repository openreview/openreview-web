'use client'

import { useEffect, useState } from 'react'
import { uniqBy } from 'lodash'
import { useRouter } from 'next/navigation'
import Icon from '../../../components/Icon'
import ErrorAlert from '../../../components/ErrorAlert'
import api from '../../../lib/api-client'

const PreviousImpersonationList = ({
  previousImpersonations,
  setPreviousImpersonations,
  user,
  impersonateUser,
  setError,
}) => {
  useEffect(() => {
    try {
      const userList = localStorage.getItem(`${user.profile.id}|impersonatedUsers`)
      setPreviousImpersonations(JSON.parse(userList ?? []))
    } catch (_error) {
      setPreviousImpersonations([])
    }
  }, [user])

  if (previousImpersonations?.length <= 0) return null
  return (
    <div style={{ marginTop: '1.875rem' }}>
      <hr />
      <h4>Previous Impersonations</h4>
      <ul className="list-unstyled">
        {previousImpersonations.map((impersonation) => {
          const { groupId, note } =
            typeof impersonation === 'string' ? { groupId: impersonation } : impersonation
          return (
            <li key={groupId}>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a
                href="#"
                role="button"
                onClick={(e) => {
                  e.preventDefault()
                  setError(null)
                  impersonateUser(groupId, note)
                }}
              >
                {groupId}
              </a>
              {note && ` - ${note}`}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function Impersonate({ user }) {
  const [error, setError] = useState(null)
  const [userId, setUserId] = useState('')
  const [impersonateNote, setImpersonateNote] = useState('')
  const [previousImpersonations, setPreviousImpersonations] = useState([])
  const router = useRouter()

  const impersonateUser = async (groupId, note) => {
    try {
      await api.post('/impersonate', { groupId })
      const trimmedList = uniqBy(
        [
          { groupId, note },
          ...previousImpersonations.map((p) => (typeof p === 'string' ? { groupId: p } : p)),
        ].slice(0, 10),
        'groupId'
      )

      localStorage.setItem(`${user.profile.id}|impersonatedUsers`, JSON.stringify(trimmedList))
      router.replace('/profile')
      router.refresh()
    } catch (apiError) {
      setError(apiError)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    if (!userId.startsWith('~') && !userId.includes('@')) {
      setError({ message: 'Please enter a valid username or email' })
      return
    }

    impersonateUser(userId, impersonateNote.trim())
  }

  return (
    <>
      {error && <ErrorAlert error={error} />}
      <form className="form-inline mb-4" onSubmit={handleSubmit}>
        <div className="input-group mr-2" style={{ width: 'calc(100% - 128px)' }}>
          <div className="input-group-addon" style={{ width: '34px' }}>
            <Icon name="user" />
          </div>
          <input
            type="text"
            className={`form-control ${error ? 'form-invalid' : ''}`}
            placeholder="john@example.com, ~Jane_Doe1"
            value={userId}
            onChange={(e) => setUserId(e.target.value.trim())}
          />
        </div>
        <button
          type="submit"
          className="btn"
          disabled={userId.length < 3}
          style={{ width: '120px' }}
        >
          Impersonate
        </button>
        <div className="input-group mt-2" style={{ width: 'calc(100% - 128px)' }}>
          <input
            type="text"
            className="form-control"
            placeholder="user role or purpose of impersonation"
            maxLength={45}
            value={impersonateNote}
            onChange={(e) => setImpersonateNote(e.target.value)}
          />
        </div>
      </form>
      <PreviousImpersonationList
        previousImpersonations={previousImpersonations}
        setPreviousImpersonations={setPreviousImpersonations}
        user={user}
        impersonateUser={impersonateUser}
        setError={setError}
      />
    </>
  )
}
