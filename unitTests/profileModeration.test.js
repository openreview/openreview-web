import { createHmac, webcrypto } from 'crypto'
import { TextEncoder } from 'util'
import api from '../lib/api-client'
import { rejectProfile } from '../lib/profile-moderation'

const secret = 'vouch request secret'
const invitationId = `${process.env.SUPER_USER}/Support/-/Vouch_Request`

beforeAll(() => {
  Object.defineProperty(global, 'crypto', { value: webcrypto, configurable: true })
  global.TextEncoder = TextEncoder
})

describe('rejectProfile', () => {
  test('fill the vouch request link with a guest token signed with the invitation secret', async () => {
    api.get = jest.fn((path) =>
      Promise.resolve(
        path === '/profiles'
          ? {
              profiles: [
                {
                  id: '~Sofia_Moreno1',
                  content: { preferredEmail: 'sofia.moreno@gmail.com' },
                },
              ],
            }
          : {
              invitations: [
                {
                  id: invitationId,
                  secret,
                  content: { linkExpirationDays: { value: 30 } },
                },
              ],
            }
      )
    )
    api.post = jest.fn(() => Promise.resolve({}))

    await rejectProfile(
      '~Sofia_Moreno1',
      'Ask a colleague to vouch for you:\n\n{{vouchRequestLink}}',
      ['Request supervisor or coauthor to vouch']
    )

    expect(api.get).toHaveBeenCalledWith('/invitations', { id: invitationId })
    expect(api.get).toHaveBeenCalledWith('/profiles', { id: '~Sofia_Moreno1' })
    const { reason, labels, decision } = api.post.mock.calls[0][1]
    expect(decision).toBe('reject')
    expect(labels).toEqual(['Request supervisor or coauthor to vouch'])

    const link = new URL(reason.split('\n\n')[1])
    expect(link.origin).toBe(window.location.origin)
    expect(link.pathname).toBe('/invitation')
    expect(link.searchParams.get('id')).toBe(invitationId)
    expect(link.searchParams.get('user')).toBe('~Sofia_Moreno1')
    expect(link.searchParams.get('email')).toBe('sofia.moreno@gmail.com')

    const [header, payload, signature] = link.searchParams.get('key').split('.')
    expect(
      createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
    ).toBe(signature)
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
    expect(claims.group).toBe('~Sofia_Moreno1')
    expect(claims.invitation).toBe(invitationId)
    const thirtyDays = 30 * 24 * 60 * 60
    expect(claims.exp).toBeGreaterThan(Date.now() / 1000 + thirtyDays - 60)
    expect(claims.exp).toBeLessThanOrEqual(Date.now() / 1000 + thirtyDays)
  })

  test('leave the message alone when it has no vouch request placeholder', async () => {
    api.get = jest.fn()
    api.post = jest.fn(() => Promise.resolve({}))

    await rejectProfile('~Sofia_Moreno1', 'Please add an institutional email.', [])

    expect(api.get).not.toHaveBeenCalled()
    expect(api.post.mock.calls[0][1].reason).toBe('Please add an institutional email.')
  })
})
