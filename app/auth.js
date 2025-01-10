import { jwtDecode } from 'jwt-decode'
import { cookies } from 'next/headers'
import api from '../lib/api-client'

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

// export async function serverRefreshToken() {
//   const cookie = await cookies()
//   const token = cookie.get(process.env.ACCESS_TOKEN_NAME)
//   const refreshToken = cookie.get(process.env.REFRESH_TOKEN_NAME)

//   const payload = getTokenPayload(token?.value)
//   if (payload) return payload

//   if (!refreshToken?.value) return {}

//   try {
//     // const response = await api.post('/refreshToken', {}, { refreshToken: refreshToken?.value })
//     const response = await fetch(`${process.env.API_V2_URL}/refreshToken`, {
//       method: 'POST',
//       headers: {
//         Accept: 'application/json,text/*;q=0.99',
//         Cookie: `${process.env.REFRESH_TOKEN_NAME}=${refreshToken?.value}`,
//         'Content-Type': 'application/json; charset=UTF-8',
//       },
//     })
//     const data = await response.json()
//     // console.log('serverRefreshToken using fetch response:', response)
//     // console.log('serverRefreshToken using fetch data:', data)
//     if (data.status === 401) return {}
//     return data
//   } catch (error) {
//     // console.error('Error refreshing token in server:', error)
//     return {}
//   }
// }

export default async function serverAuth() {
  const cookie = await cookies()
  const token = cookie.get(process.env.ACCESS_TOKEN_NAME)

  const payload = getTokenPayload(token?.value)
  if (!payload) {
    // return serverRefreshToken()
    return {}
  }

  return { token: token.value, user: payload.user }
}
