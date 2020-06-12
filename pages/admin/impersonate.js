/* globals promptError: false */

import { useContext, useState } from 'react'
import withAdminAuth from '../../components/withAdminAuth'
import { auth } from '../../lib/auth'
import api from '../../lib/api-client'
import UserContext from '../../components/UserContext'

const Impersonate = ({ superToken }) => {
  const { loginUser, logoutUser } = useContext(UserContext)
  const [id, setId] = useState('')

  const impersonateByEmail = async (email) => {
    try {
      const result = await api.get('/impersonate', { groupId: email }, { accessToken: superToken })
      const { user, token } = result
      loginUser(user, token, `/profile?id=${user.profile.id}`)
    } catch (error) {
      promptError(error.message)
    }
  }

  const impersonateByTildeId = async () => {
    let email = null
    try {
      const result = await await api.get('/profiles', { id }, { accessToken: superToken })
      email = result.profiles[0]?.content?.emails[0]
    } catch (error) {
      promptError(error.message)
    }
    if (email) {
      impersonateByEmail(email)
    } else {
      promptError("can't find email")
    }
  }

  const ImpersonateUser = async () => {
    if (id.startsWith('~')) {
      impersonateByTildeId()
    } else {
      impersonateByEmail(id)
    }
  }

  return (
    <>
      <div className="form-group">
        ID
        <input className="form-control" value={id} placeholder="email or tilde id" onChange={(e) => { setId(e.target.value.trim()) }} />
      </div>

      <button type="button" className="btn" onClick={ImpersonateUser}>
        impersonate
      </button>
    </>
  )
}

Impersonate.getInitialProps = async (context) => {
  const { token } = auth(context)
  return { superToken: token }
}

export default withAdminAuth(Impersonate)
