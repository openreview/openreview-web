import { NextResponse } from 'next/server'

// eslint-disable-next-line import/prefer-default-export
export async function middleware(request) {
  // console.log('middleware.js request')
  const response = NextResponse.next()
  const accessToken = request.cookies.get(process.env.ACCESS_TOKEN_NAME)
  const refreshToken = request.cookies.get(process.env.REFRESH_TOKEN_NAME)
  // console.log('middleware.js accesstoken is ', accessToken)
  // console.log('middleware.js refreshToken is ', refreshToken)
  // console.log('middleware request cookies', request.cookies)

  if (accessToken) {
    // console.log('middleware has access token so return')
    return response
  }

  if (!refreshToken) {
    // console.log('middleware.js has no refresh token so return')
    return response
  }

  try {
    // console.log('middleware start to refresh token')
    const tokenRefreshResponse = await fetch(`${process.env.API_V2_URL}/refreshToken`, {
      method: 'POST',
      headers: {
        Accept: 'application/json,text/*;q=0.99',
        Cookie: `${process.env.REFRESH_TOKEN_NAME}=${refreshToken?.value}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    })

    const data = await tokenRefreshResponse.json()
    if (data.status === 401 || data.status === 400) {
      console.error('middleware.js refresh token failed', data)
      return response
    }
    // console.log('middleware.js refreshed token')
    return NextResponse.redirect(request.nextUrl, {
      headers: {
        'Set-Cookie': tokenRefreshResponse.headers.get('set-cookie'),
      },
    })
  } catch (error) {
    // console.error('middleware.js refresh token failed')
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
    '/group:path',
    '/invitation',
    '/invitation:path',
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
