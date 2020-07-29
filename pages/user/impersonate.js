/* globals promptError: false */

import { useContext, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Icon from '../../components/Icon'
import ErrorAlert from '../../components/ErrorAlert'
import withAdminAuth from '../../components/withAdminAuth'
import api from '../../lib/api-client'
import UserContext from '../../components/UserContext'

const Impersonate = ({ accessToken }) => {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState(null)
  const { loginUser } = useContext(UserContext)

  const impersonateByEmail = async (email) => {
    try {
      const { user, token } = await api.get('/impersonate', { groupId: email }, { accessToken })
      loginUser(user, token, '/profile')
    } catch (apiError) {
      setError(apiError)
    }
  }

  const impersonateUser = async (e) => {
    e.preventDefault()
    setError(null)

    let email
    if (userId.startsWith('~')) {
      try {
        const { profiles } = await api.get('/profiles', { id: userId }, { accessToken })
        email = profiles[0]?.content?.emails[0]
        if (!email) {
          setError({ message: `Email not found for username ${userId}` })
        }
      } catch (apiError) {
        setError(apiError)
      }
    } else if (userId.includes('@')) {
      email = userId
    } else {
      setError({ message: 'Please enter a valid username or email' })
    }

    if (email) {
      impersonateByEmail(email)
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

export default withAdminAuth(Impersonate)
