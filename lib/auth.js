import Cookies from 'universal-cookie'
import jwtDecode from 'jwt-decode'

const accessTokenId = 'openreview.accessToken'
const cookieExpiration = 60 * 60 * 24

export function setAuthCookie(token) {
  const cookie = new Cookies()
  cookie.set(accessTokenId, token, { maxAge: cookieExpiration })
}

export function removeAuthCookie() {
  const cookie = new Cookies()
  cookie.remove(accessTokenId)
}

export function auth(ctx = {}) {
  let cookie
  if (ctx.req) {
    const cookieHeader = ctx.req.headers && ctx.req.headers.cookie
    cookie = new Cookies(cookieHeader)
  } else {
    cookie = new Cookies()
  }

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

export function isSuperUser(user) {
  return user?.id === process.env.SUPER_USER
}
