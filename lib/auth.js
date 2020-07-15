import Cookies from 'universal-cookie'
import jwtDecode from 'jwt-decode'

const accessTokenId = 'openreview.accessToken'
const cookieExpiration = 60 * 60 * 24

export function setAuthCookie(token) {
  const cookie = new Cookies()
  cookie.set(accessTokenId, token, { maxAge: cookieExpiration, path: '/', sameSite: 'lax' })
}

export function removeAuthCookie() {
  const cookie = new Cookies()
  cookie.remove(accessTokenId, { path: '/', sameSite: 'lax' })
}

export function isSuperUser(user) {
  return user?.id === process.env.SUPER_USER
}

export function auth(ctx) {
  // Get cookies from request headers if executing on server side, or document.cookies
  // if running on the client
  const cookie = new Cookies(ctx?.req?.headers?.cookie)

  const token = cookie.get(accessTokenId)
  if (!token) {
    return {}
  }

  let payload
  try {
    payload = jwtDecode(token)
  } catch (error) {
    payload = null
  }

  return payload ? { user: payload.user, token } : {}
}
