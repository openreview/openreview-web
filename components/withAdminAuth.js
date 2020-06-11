import withError from './withError'
import { auth } from '../lib/auth'
import { isSuperUser } from '../lib/utils'

export default function withAdminAuth(Component) {
  const WithAdminAuth = Component

  WithAdminAuth.getInitialProps = (ctx) => {
    const { user, token } = auth(ctx)

    if (!isSuperUser(user)) {
      return { statusCode: 403, message: 'Forbidden. Access to this page is restricted.' }
    }

    // This HOC does NOT call the getInitialProps method of the wrapped component
    // it always passes the query params and access token as props
    return { ...ctx.query, accessToken: token }
  }

  WithAdminAuth.bodyClass = Component.bodyClass

  return withError(WithAdminAuth)
}
