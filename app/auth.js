import { jwtDecode } from 'jwt-decode'
import { cookies } from 'next/headers'

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

export default async function serverAuth() {
  const cookie = await cookies()
  const token = cookie.get(process.env.ACCESS_TOKEN_NAME)
  const clearanceToken = cookie.get(process.env.CLEARANCE_COOKIE_NAME || 'openreview.clearanceToken')?.value

  const payload = getTokenPayload(token?.value)
  if (!payload || !payload.user?.profile?.id) {
    // Guests forward the clearance token so the API gate can verify them.
    return { clearanceToken }
  }

  // Logged-in users bypass the gate, so they never need clearance.
  return { token: token.value, user: payload.user }
}
