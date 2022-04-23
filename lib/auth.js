import Cookies from 'universal-cookie'
import jwtDecode from 'jwt-decode'

export const accessTokenId = 'openreview.accessToken'
export const cookieExpiration = 60 * 60 * 24 * 1000 // 1 day
export const refreshExpiration = 7 * 60 * 60 * 24 * 1000 // 7 days

const apiDomain = process.env.API_URL.replace(/https?:\/\//, '')
const apiV2Domain = process.env.API_V2_URL ? process.env.API_V2_URL.replace(/https?:\/\//, '') : ''

export function setAuthCookie(token) {
  const cookie = new Cookies()
  cookie.set(accessTokenId, token, { maxAge: cookieExpiration / 1000, path: '/', sameSite: 'lax' })
  cookie.set(accessTokenId, token, { maxAge: cookieExpiration / 1000, domain: apiDomain, path: '/', sameSite: 'lax' })
  if (process.env.API_V2_URL) {
    cookie.set(accessTokenId, token, { maxAge: cookieExpiration / 1000, domain: apiV2Domain, path: '/', sameSite: 'lax' })
  }
}

export function removeAuthCookie() {
  const cookie = new Cookies()
  cookie.remove(accessTokenId, { path: '/', sameSite: 'lax' })
  cookie.remove(accessTokenId, { domain: apiDomain, path: '/', sameSite: 'lax' })
  if (process.env.API_V2_URL) {
    cookie.set(accessTokenId, { domain: apiV2Domain, path: '/', sameSite: 'lax' })
  }
}

export function isSuperUser(user) {
  return user?.id === process.env.SUPER_USER
}

export function getTokenPayload(token) {
  if (!token) {
    return null
  }

  let payload
  try {
    payload = jwtDecode(token)
  } catch (error) {
    payload = null
  }

  // Validate JWT expiration date and issuer
  if (!payload || payload.exp * 1000 < Date.now() || payload.iss !== 'openreview') {
    return null
  }

  return payload
}

export function auth(ctx) {
  // Get cookies from request headers if executing on server side, or document.cookies
  // if running on the client
  const cookie = new Cookies(ctx?.req?.headers?.cookie)

  const token = cookie.get(accessTokenId)

  const payload = getTokenPayload(token)
  if (!payload) {
    return {}
  }

  return { token, user: payload.user, expiration: payload.exp * 1000 }
}
