/* globals promptError: false */

import { useContext, useState, useEffect } from 'react'
import Head from 'next/head'
import { uniqBy } from 'lodash'
import Icon from '../../components/Icon'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorAlert from '../../components/ErrorAlert'
import UserContext from '../../components/UserContext'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import api from '../../lib/api-client'

const Impersonate = () => {
  const [userId, setUserId] = useState('')
  const [impersonateNote, setImpersonateNote] = useState('')
  const [previousImpersonations, setPreviousImpersonations] = useState(null)
  const [error, setError] = useState(null)
  const { userLoading, user, accessToken } = useLoginRedirect()
  const { loginUser } = useContext(UserContext)

  const impersonateUser = async (groupId, note) => {
    try {
      const { user: newUser, token } = await api.post(
        '/impersonate',
        { groupId },
        { accessToken }
      )
      const trimmedList = uniqBy(
        [
          { groupId, note },
          ...previousImpersonations.map((p) => (typeof p === 'string' ? { groupId: p } : p)),
        ].slice(0, 10),
        'groupId'
      )

      localStorage.setItem(`${user.profile.id}|impersonatedUsers`, JSON.stringify(trimmedList))
      loginUser(newUser, token, '/profile')
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

  useEffect(() => {
    if (userLoading) return

    try {
      const userList = localStorage.getItem(`${user.profile.id}|impersonatedUsers`)
      setPreviousImpersonations(JSON.parse(userList ?? []))
    } catch (_error) {
      setPreviousImpersonations([])
    }
  }, [userLoading])

  if (userLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="row">
      <Head>
        <title key="title">Impersonate User | OpenReview</title>
      </Head>

      <div className="col-sm-12 col-md-8 col-lg-6 col-md-offset-2 col-lg-offset-3">
        <h1>Impersonate User</h1>

        <p className="text-muted mb-4">
          Enter the user&apos;s email address or username below.
        </p>

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

        {previousImpersonations?.length > 0 && (
          <div style={{ marginTop: '1.875rem' }}>
            <hr />
            <h4>Previous Impersonations</h4>
            <ul className="list-unstyled">
              {previousImpersonations.map((impersonation) => {
                const { groupId, note } =
                  typeof impersonation === 'string'
                    ? { groupId: impersonation }
                    : impersonation
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
        )}
      </div>
    </div>
  )
}

export default Impersonate
