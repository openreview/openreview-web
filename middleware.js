import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

// eslint-disable-next-line import/prefer-default-export
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

  try {
    const tokenRefreshResponse = await fetch(`${process.env.API_V2_URL}/refreshToken`, {
      method: 'POST',
      headers: {
        Accept: 'application/json,text/*;q=0.99',
        Cookie: `${process.env.REFRESH_TOKEN_NAME}=${refreshToken?.value}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Forwarded-For': request.headers.get('x-forwarded-for'),
      },
    })

    const data = await tokenRefreshResponse.json()
    if (data.status === 401 || data.status === 400) {
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
