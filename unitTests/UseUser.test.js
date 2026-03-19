import { renderHook, waitFor } from '@testing-library/react'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

let userFromClientAuth

jest.mock('../lib/clientAuth', () => ({
  clientAuth: jest.fn(() => Promise.resolve(userFromClientAuth)),
}))

beforeEach(() => {
  userFromClientAuth = {}
})

describe('useUser hook', () => {
  // no profile.id indicates the user cookie is corrupted, return null so that user can login again
  test('return null user when cookie has no profile.id', async () => {
    userFromClientAuth = { user: { id: 'test@mail.com' } }

    const { result } = renderHook(() => useUser())

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })
    expect(result.current.user).toBeNull()
  })

  // no user token in cookie
  test('return null user when clientAuth returns empty object', async () => {
    userFromClientAuth = {}

    const { result } = renderHook(() => useUser())

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })
    expect(result.current.user).toBeNull()
  })

  test('return cookie user when profile is not required', async () => {
    api.get = jest.fn()
    const userFromCookie = { id: 'test@mail.com', profile: { id: '~Test_User1' } }
    userFromClientAuth = { user: userFromCookie }

    const { result } = renderHook(() => useUser())

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })
    expect(result.current.user).toEqual(userFromCookie)
    expect(api.get).not.toHaveBeenCalled()
  })

  test('return full profile when getFullProfile is true', async () => {
    userFromClientAuth = {
      user: { id: 'test@mail.com', profile: { id: '~Test_User1', fullname: 'Test User' } },
    }
    api.get = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~Test_User1',
            content: {
              names: [{ fullname: 'Test User', username: '~Test_User1', preferred: true }],
              preferredEmail: 'test@mail.com',
            },
          },
        ],
      })
    )

    const { result } = renderHook(() => useUser(true))

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })
    expect(api.get).toHaveBeenCalledWith('/profiles', { id: '~Test_User1' })
    expect(result.current.user).toEqual({
      profile: {
        id: '~Test_User1',
        preferredId: '~Test_User1',
        preferredName: 'Test User',
        preferredEmail: 'test@mail.com',
      },
    })
  })

  test('use first name as preferred name when profile has no preferred name', async () => {
    userFromClientAuth = {
      user: { id: 'test@mail.com', profile: { id: '~Test_User1', fullname: 'Test User' } },
    }
    api.get = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~Test_User1',
            content: {
              names: [
                {
                  fullname: 'First Name One',
                  username: '~First_Name_One1',
                  preferred: undefined,
                },
                {
                  fullname: 'First Name Two',
                  username: '~First_Name_Two1',
                  preferred: undefined,
                },
              ],
              emails: ['test@mail.com'],
            },
          },
        ],
      })
    )

    const { result } = renderHook(() => useUser(true))

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })
    expect(result.current.user).toEqual({
      profile: {
        id: '~Test_User1',
        preferredId: '~First_Name_One1',
        preferredName: 'First Name One',
        preferredEmail: 'test@mail.com',
      },
    })
  })

  test('return user cookie when call to get profile failed', async () => {
    const userFromCookie = { id: 'test@mail.com', profile: { id: '~Test_User1' } }
    userFromClientAuth = { user: userFromCookie }
    api.get = jest.fn(() => Promise.reject({ message: 'get profile call failed' }))

    const { result } = renderHook(() => useUser(true))

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })
    expect(result.current.user).toEqual(userFromCookie)
  })

  test('return cookie user when no profile is returned', async () => {
    const userFromCookie = { id: 'test@mail.com', profile: { id: '~Test_User1' } }
    userFromClientAuth = { user: userFromCookie }
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))

    const { result } = renderHook(() => useUser(true))

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })
    expect(result.current.user).toEqual(userFromCookie)
  })
})
