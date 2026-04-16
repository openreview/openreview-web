import { headers } from 'next/headers'
import serverAuth from '../../auth'
import { checkAccess } from '../../../lib/server-access-control'
import api from '../../../lib/api-client'

export async function GET() {
  const { user, token } = await serverAuth()

  const hasAccess = await checkAccess(
    user,
    token,
    'DebugIp',
    `${process.env.SUPER_USER}/Support`,
    true
  )
  if (!hasAccess) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const headersList = await headers()
  const xForwardedFor = headersList.get('x-forwarded-for')
  const xRealIp = headersList.get('x-real-ip')
  const host = headersList.get('host')

  // Leftmost entry of X-Forwarded-For is what nextjs would attribute as the client IP
  const clientIp = xForwardedFor?.split(',')?.[0]?.trim() ?? xRealIp ?? null

  let nodejs
  try {
    nodejs = await api.get(
      '/debug/ip',
      {},
      { accessToken: token, remoteIpAddress: xForwardedFor }
    )
  } catch (error) {
    nodejs = {
      error: error.message,
      name: error.name,
      status: error.status ?? null,
    }
  }

  return Response.json({
    nextjs: {
      clientIp,
      xForwardedFor,
      xRealIp,
      host,
    },
    nodejs,
  })
}
