import withError from './withError'
import { auth, isSuperUser } from '../lib/auth'

export default function withAdminAuth(Component) {
  const WithAdminAuth = Component
  const hasGetInitialProps = !!Component.getInitialProps

  WithAdminAuth.getInitialProps = (ctx) => {
    const { user, token } = auth(ctx)

    if (!isSuperUser(user)) {
      return { statusCode: 403, message: 'Forbidden. Access to this page is restricted.' }
    }

    if (hasGetInitialProps) {
      // withAdminAuth always passes the query params and access token as props to wrappen
      // component, so need to warn the user if that component has getInitialProps definied
      // eslint-disable-next-line no-console
      console.warn('Warning: withAdminAuth does not call getInitialProps of wrapped component')
    }

    return { ...ctx.query, accessToken: token, superUser: user }
  }

  WithAdminAuth.displayName = `withAdminAuth(${
    Component.displayName || Component.name || 'Component'
  })`
  WithAdminAuth.bodyClass = Component.bodyClass

  return withError(WithAdminAuth)
}
