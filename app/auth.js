import { jwtDecode } from 'jwt-decode'
import { cookies } from 'next/headers'

export function isSuperUser(user) {
  return user?.id === process.env.SUPER_USER
}

function getTokenPayload(token) {
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

export default async function serverAuth() {
  const cookie = await cookies()
  const token = cookie.get(process.env.ACCESS_TOKEN_NAME)

  const payload = getTokenPayload(token?.value)
  if (!payload) {
    return {}
  }

  return { token: token.value, user: payload.user }
}
