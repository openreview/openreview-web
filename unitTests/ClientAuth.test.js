import Cookies from 'universal-cookie'
import { clientAuth } from '../lib/clientAuth'
import '@testing-library/jest-dom'

jest.mock('universal-cookie')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('clientAuth', () => {
  test('return payload when cookie has access token and it is valid', async () => {
    const userTokenInCookie = { id: '~Test_User1' }
    const cookieGet = jest.fn(() => userTokenInCookie)
    global.fetch = jest.fn()
    Cookies.mockImplementation(() => ({
      get: cookieGet,
    }))

    const expectedResult = { user: { id: '~Test_User1' } }
    const actualResult = await clientAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.USER_TOKEN_NAME)
    expect(global.fetch).not.toHaveBeenCalled()
    expect(expectedResult).toEqual(actualResult)
  })

  test('try refreshing token(successful) when cookie does not have user token', async () => {
    const cookieGet = jest.fn(() => undefined)
    Cookies.mockImplementation(() => ({
      get: cookieGet,
    }))
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            token: 'new access token', // returned for cookie setting in middleware only, not for client auth to consume
            user: { id: '~Test_User1' },
          }),
      })
    )

    const expectedResult = { user: { id: '~Test_User1' } }
    const actualResult = await clientAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.USER_TOKEN_NAME)
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_V2_URL}/refreshToken`,
      expect.anything()
    )
    expect(expectedResult).toEqual(actualResult)
  })

  test('return empty object when refresh token fail with TokenExpiredError', async () => {
    const cookieGet = jest.fn(() => undefined)
    Cookies.mockImplementation(() => ({
      get: cookieGet,
    }))
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            status: 401,
            name: 'TokenExpiredError',
            message: 'Token has expired. Please log in again.',
          }),
      })
    )

    const expectedResult = {}
    const actualResult = await clientAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.USER_TOKEN_NAME)
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_V2_URL}/refreshToken`,
      expect.anything()
    )
    expect(expectedResult).toEqual(actualResult)
  })
})
