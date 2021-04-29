/* globals promptError: false */

import { useContext, useState } from 'react'
import Head from 'next/head'
import Icon from '../../components/Icon'
import ErrorAlert from '../../components/ErrorAlert'
import api from '../../lib/api-client'
import UserContext from '../../components/UserContext'

const Impersonate = ({ accessToken }) => {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState(null)
  const { loginUser } = useContext(UserContext)

  const impersonate = async (groupId) => {
    try {
      const { user, token } = await api.get('/impersonate', { groupId }, { accessToken })
      loginUser(user, token, '/profile')
    } catch (apiError) {
      setError(apiError)
    }
  }

  const impersonateUser = async (e) => {
    e.preventDefault()
    setError(null)

    if (userId.startsWith('~') || userId.includes('@')) {
      impersonate(userId)
    } else {
      setError({ message: 'Please enter a valid username or email' })
    }
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

        {error && (
          <ErrorAlert error={error} />
        )}

        <form className="form-inline mb-4" onSubmit={impersonateUser}>
          <div className="input-group mr-2" style={{ width: 'calc(100% - 128px)' }}>
            <div className="input-group-addon" style={{ width: '34px' }}>
              <Icon name="user" />
            </div>
            <input
              type="text"
              className={`form-control ${error ? 'form-invalid' : ''}`}
              placeholder="john@example.com, ~Jane_Doe1"
              value={userId}
              onChange={e => setUserId(e.target.value.trim())}
            />
          </div>
          <button type="submit" className="btn" disabled={userId.length < 3} style={{ width: '120px' }}>
            Impersonate
          </button>
        </form>
      </div>
    </div>
  )
}

export default Impersonate
