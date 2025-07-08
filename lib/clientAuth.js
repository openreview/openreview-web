import { jwtDecode } from 'jwt-decode'
import Cookies from 'universal-cookie'

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

async function clientRefreshToken() {
  try {
    const response = await fetch(`${process.env.API_V2_URL}/refreshToken`, {
      method: 'POST',
      headers: {
        Accept: 'application/json,text/*;q=0.99',
        'Content-Type': 'application/json; charset=UTF-8',
      },
      credentials: 'include',
    })
    const data = await response.json()
    if (!data.token) return {}
    const decodedToken = getTokenPayload(data.token)
    if (!decodedToken) return {} // token returned but is invalid
    return data
  } catch (error) {
    return {}
  }
}

export async function clientAuth() {
  const cookie = new Cookies(document.cookie)
  const token = cookie.get(process.env.ACCESS_TOKEN_NAME)

  const payload = getTokenPayload(token)
  if (!payload) {
    return clientRefreshToken()
  }

  return { token, user: payload.user }
}
