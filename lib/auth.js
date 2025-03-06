import Cookies from 'universal-cookie'
import { jwtDecode } from 'jwt-decode'

export const cookieExpiration = 60 * 60 * 24 * 1000 // 1 day
export const refreshExpiration = 7 * 60 * 60 * 24 * 1000 // 7 days

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
  if (!payload || payload.exp * 1000 < Date.now() || !payload.iss.startsWith('openreview')) {
    return null
  }

  return payload
}

export function auth(ctx) {
  // Get cookies from request headers if executing on server side, or document.cookies
  // if running on the client
  const cookie = new Cookies(ctx?.req?.headers?.cookie)

  const token = cookie.get(process.env.ACCESS_TOKEN_NAME)

  const payload = getTokenPayload(token)
  if (!payload) {
    return {}
  }

  return { token, user: payload.user, expiration: payload.exp * 1000 }
}
