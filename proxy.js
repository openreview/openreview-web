import { NextResponse } from 'next/server'
import { getTokenPayload } from './lib/clientAuth'

export async function proxy(request) {
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
    if (!data.token) {
      console.error('middleware.js refresh token failed', data)
      return response
    }
    const decodedToken = getTokenPayload(data.token)
    if (!decodedToken) {
      console.error('middleware.js refresh token failed', data)
      return response
    }
    const newResponse = NextResponse.redirect(request.nextUrl.clone())
    newResponse.headers.set('Set-Cookie', tokenRefreshResponse.headers.get('set-cookie'))
    return newResponse
  } catch (error) {
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
