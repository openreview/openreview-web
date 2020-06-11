import { useEffect, useContext } from 'react'
import withError from '../../components/withError'
import { auth, isSuperUser } from '../../lib/auth'
import api from '../../lib/api-client'
import UserContext from '../../components/UserContext'

const Impersonate = ({ groupIdToImpersonate, superToken }) => {
  const { loginUser } = useContext(UserContext)

  useEffect(() => {
    // eslint-disable-next-line no-use-before-define
    getImpersonatedToken()
  }, [])

  const getImpersonatedToken = async () => {
    const result = await api.get('/impersonate', { groupId: groupIdToImpersonate }, { accessToken: superToken })
    const { user, token } = result
    loginUser(user, token)
  }

  return (
    null
  )
}

Impersonate.getInitialProps = async (context) => {
  if (!context.query.groupId) {
    return { statusCode: 400, message: 'GroupId is missing' }
  }
  const { user, token } = auth(context)
  if (!isSuperUser(user)) {
    return { statusCode: 400, message: 'Not logged in as super user' }
  }
  return { groupIdToImpersonate: context.query.groupId, superToken: token }
}

export default withError(Impersonate)
