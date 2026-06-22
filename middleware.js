import { NextResponse } from 'next/server'
import { getTokenPayload } from './app/auth'

export async function middleware(request) {
  const response = NextResponse.next()
  const accessToken = request.cookies.get(process.env.ACCESS_TOKEN_NAME)
  const refreshToken = request.cookies.get(process.env.REFRESH_TOKEN_NAME)
  if (accessToken) {
    return response
  }

  if (!refreshToken) {
    return response
  }

  const decodedRefreshToken = getTokenPayload(refreshToken.value)

  // TEMP DEBUG — remove after diagnosing staging refresh issue
  // oxlint-disable-next-line no-console
  console.log('refresh debug OUT', {
    envName: process.env.REFRESH_TOKEN_NAME,
    cookieName: refreshToken?.name,
    valueLen: refreshToken?.value?.length,
    valuePreview: refreshToken?.value?.slice(0, 12),
    apiV2Url: process.env.API_V2_URL,
    allCookies: request.cookies.getAll().map((c) => `${c.name}(${c.value?.length})`),
  })

  try {
    const tokenRefreshResponse = await fetch(`${process.env.API_V2_URL}/refreshToken`, {
      method: 'POST',
      headers: {
        Accept: 'application/json,text/*;q=0.99',
        Cookie: `${process.env.REFRESH_TOKEN_NAME}=${refreshToken?.value}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Forwarded-For': request.headers.get('x-forwarded-for'),
        'X-Url': request.nextUrl.href,
        'X-User': decodedRefreshToken?.user?.profile?.id ?? decodedRefreshToken?.user?.id,
        'X-Source': 'middleware',
      },
    })

    const data = await tokenRefreshResponse.json()
    // TEMP DEBUG — remove after diagnosing staging refresh issue
    // oxlint-disable-next-line no-console
    console.log('refresh debug IN', {
      status: tokenRefreshResponse.status,
      hasToken: !!data.token,
      data,
    })
    if (!data.token) {
      // oxlint-disable-next-line no-console
      console.error('middleware.js refresh token failed', data)
      return response
    }
    const decodedToken = getTokenPayload(data.token)
    if (!decodedToken) {
      // oxlint-disable-next-line no-console
      console.error('middleware.js refresh token failed', data)
      return response
    }
    const newResponse = NextResponse.redirect(request.nextUrl.clone())
    newResponse.headers.set('Set-Cookie', tokenRefreshResponse.headers.get('set-cookie'))
    return newResponse
  } catch (error) {
    // TEMP DEBUG — remove after diagnosing staging refresh issue
    // oxlint-disable-next-line no-console
    console.error('refresh debug CATCH', error)
    return response
  }
}

export const config = {
  matcher: [
    '/',
    '/activity',
    '/assignments',
    '/assignments/stats',
    '/edges/browse',
    '/forum',
    '/group',
    '/group/:path',
    '/invitation',
    '/invitation/:path',
    '/messages',
    '/notifications',
    '/profile',
    '/profile/:path',
    '/revisions',
    '/revisions/compare',
    '/search',
    '/submissions',
    '/tasks',
    '/user/:path',
    '/venue',
  ],
}
