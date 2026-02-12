import Cookies from 'universal-cookie'

const REFRESH_TOKEN_STATUS_KEY = 'isGuestUser'

export function shouldTryRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_STATUS_KEY) !== 'true'
  } catch (_) {
    return true
  }
}

export function resetRefreshTokenStatus() {
  try {
    localStorage.removeItem(REFRESH_TOKEN_STATUS_KEY)
  } catch (_) {
    /* empty */
  }
}

export function isSuperUser(user) {
  return user?.id === process.env.SUPER_USER
}

async function clientRefreshToken() {
  try {
    const response = await fetch(`${process.env.API_V2_URL}/refreshToken`, {
      method: 'POST',
      headers: {
        Accept: 'application/json,text/*;q=0.99',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Url': document.location.href,
        'X-Source': 'client auth',
      },
      credentials: 'include',
    })
    const data = await response.json()
    if (!data.user) {
      try {
        localStorage.setItem(REFRESH_TOKEN_STATUS_KEY, 'true')
      } catch (_) {
        /* empty */
      }
      return {}
    }
    return { user: data.user }
  } catch (error) {
    return {}
  }
}

export async function clientAuth() {
  const cookie = new Cookies(document.cookie)
  const userPayload = cookie.get(process.env.USER_TOKEN_NAME)

  if (!userPayload) {
    return shouldTryRefreshToken() ? clientRefreshToken() : {}
  }

  return { user: userPayload }
}
