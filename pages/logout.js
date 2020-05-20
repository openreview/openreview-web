import Router from 'next/router'
import api from '../lib/api-client'
import { auth, removeAuthCookie } from '../lib/auth'

const Logout = () => (
  <div>Logging out...</div>
)

Logout.getInitialProps = async (ctx) => {
  const { user, token } = auth(ctx)
  let message
  if (user) {
    try {
      await api.post('/logout', {}, { accessToken: token })
      removeAuthCookie()
      message = 'You are now logged out'
    } catch (error) {
      message = `Error: ${error.message}`
    }
  }
  if (ctx.req) {
    ctx.res.writeHead(302, { Location: '/' }).end()
  } else {
    // Should never get here since this function should only run on the server
    Router.replace('/')
  }
}

Logout.bodyClass = 'logout'

export default Logout
