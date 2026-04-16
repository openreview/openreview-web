/**
 * @jest-environment node
 */
import { headers } from 'next/headers'
import { GET } from '../app/debug/ip/route'
import serverAuth from '../app/auth'
import { checkAccess } from '../lib/server-access-control'
import api from '../lib/api-client'

jest.mock('next/headers')
jest.mock('../app/auth')
jest.mock('../lib/server-access-control')
jest.mock('../lib/api-client')

const supportUser = { id: '~Support_User1', profile: { id: '~Support_User1' } }
const nodejsPayload = {
  clientIp: '203.0.113.10',
  expressIp: '203.0.113.10',
  socketRemoteAddr: '10.0.0.5',
  xForwardedFor: '203.0.113.10, 10.0.0.1',
  xRealIp: null,
  trustProxyConfig: ['loopback', '10.0.0.0/8'],
}

const mockHeaders = (map) => {
  headers.mockImplementation(async () => ({
    get: (name) => map[name.toLowerCase()] ?? null,
  }))
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /debug/ip', () => {
  test('returns 403 when the caller is not a support user or super user', async () => {
    serverAuth.mockResolvedValue({ user: supportUser, token: 'some-token' })
    checkAccess.mockResolvedValue(false)
    mockHeaders({ 'x-forwarded-for': '203.0.113.10', host: 'openreview.net' })

    const res = await GET()

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' })
    expect(api.get).not.toHaveBeenCalled()
  })

  test('returns combined nextjs + nodejs payload for an authorized caller', async () => {
    serverAuth.mockResolvedValue({ user: supportUser, token: 'some-token' })
    checkAccess.mockResolvedValue(true)
    api.get.mockResolvedValue(nodejsPayload)
    mockHeaders({
      'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      'x-real-ip': '203.0.113.10',
      host: 'openreview.net',
    })

    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      nextjs: {
        clientIp: '203.0.113.10',
        xForwardedFor: '203.0.113.10, 10.0.0.1',
        xRealIp: '203.0.113.10',
        host: 'openreview.net',
      },
      nodejs: nodejsPayload,
    })
  })

  test('forwards the incoming X-Forwarded-For chain verbatim to the nodejs api client', async () => {
    serverAuth.mockResolvedValue({ user: supportUser, token: 'some-token' })
    checkAccess.mockResolvedValue(true)
    api.get.mockResolvedValue(nodejsPayload)
    const xff = '203.0.113.10, 10.0.0.1'
    mockHeaders({ 'x-forwarded-for': xff, host: 'openreview.net' })

    await GET()

    expect(api.get).toHaveBeenCalledWith(
      '/debug/ip',
      {},
      { accessToken: 'some-token', remoteIpAddress: xff }
    )
  })

  test('falls back to x-real-ip when x-forwarded-for is missing', async () => {
    serverAuth.mockResolvedValue({ user: supportUser, token: 'some-token' })
    checkAccess.mockResolvedValue(true)
    api.get.mockResolvedValue(nodejsPayload)
    mockHeaders({ 'x-real-ip': '203.0.113.99', host: 'openreview.net' })

    const res = await GET()
    const body = await res.json()

    expect(body.nextjs.clientIp).toBe('203.0.113.99')
    expect(body.nextjs.xForwardedFor).toBeNull()
    expect(body.nextjs.xRealIp).toBe('203.0.113.99')
  })

  test('reports clientIp as null when no ip headers are present', async () => {
    serverAuth.mockResolvedValue({ user: supportUser, token: 'some-token' })
    checkAccess.mockResolvedValue(true)
    api.get.mockResolvedValue(nodejsPayload)
    mockHeaders({ host: 'openreview.net' })

    const res = await GET()
    const body = await res.json()

    expect(body.nextjs.clientIp).toBeNull()
  })

  test('surfaces a nodejs error in the response body without failing the request', async () => {
    serverAuth.mockResolvedValue({ user: supportUser, token: 'some-token' })
    checkAccess.mockResolvedValue(true)
    const apiError = Object.assign(new Error('Access denied'), {
      name: 'ForbiddenError',
      status: 403,
    })
    api.get.mockRejectedValue(apiError)
    mockHeaders({ 'x-forwarded-for': '203.0.113.10', host: 'openreview.net' })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.nextjs.clientIp).toBe('203.0.113.10')
    expect(body.nodejs).toEqual({
      error: 'Access denied',
      name: 'ForbiddenError',
      status: 403,
    })
  })

  test('invokes checkAccess with support group id and super-user bypass enabled', async () => {
    process.env.SUPER_USER = 'openreview.net'
    serverAuth.mockResolvedValue({ user: supportUser, token: 'some-token' })
    checkAccess.mockResolvedValue(true)
    api.get.mockResolvedValue(nodejsPayload)
    mockHeaders({ 'x-forwarded-for': '203.0.113.10', host: 'openreview.net' })

    await GET()

    expect(checkAccess).toHaveBeenCalledWith(
      supportUser,
      'some-token',
      'DebugIp',
      'openreview.net/Support',
      true
    )
  })
})
