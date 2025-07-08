import Cookies from 'universal-cookie'
import { clientAuth } from '../lib/clientAuth'
import '@testing-library/jest-dom'
import { jwtDecode } from 'jwt-decode'

jest.mock('universal-cookie')
jest.mock('jwt-decode')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('clientAuth', () => {
  test('return payload when cookie has access token and it is valid', async () => {
    const accessTokenInCookie = 'some valid token'
    const cookieGet = jest.fn(() => accessTokenInCookie)
    global.fetch = jest.fn()
    Cookies.mockImplementation(() => ({
      get: cookieGet,
    }))
    jwtDecode.mockImplementation(() => ({
      user: { id: '~Test_User1' },
      exp: Math.floor(Date.now() / 1000) + 60,
      iss: 'openreview-1234',
    }))

    const expectedResult = { token: accessTokenInCookie, user: { id: '~Test_User1' } }
    const actualResult = await clientAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.ACCESS_TOKEN_NAME)
    expect(jwtDecode).toHaveBeenCalledWith(accessTokenInCookie)
    expect(global.fetch).not.toHaveBeenCalled()
    expect(expectedResult).toEqual(actualResult)
  })

  test('try refreshing token(successful) when cookie does not have access token', async () => {
    const accessTokenInCookie = undefined
    const cookieGet = jest.fn(() => accessTokenInCookie)
    Cookies.mockImplementation(() => ({
      get: cookieGet,
    }))
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({ token: 'new access token', user: { id: '~Test_User1' } }),
      })
    )
    jwtDecode.mockImplementation(() => ({
      user: { id: '~Test_User1' },
      exp: Math.floor(Date.now() / 1000) + 60,
      iss: 'openreview-1234',
    }))

    const expectedResult = { token: 'new access token', user: { id: '~Test_User1' } }
    const actualResult = await clientAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.ACCESS_TOKEN_NAME)
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_V2_URL}/refreshToken`,
      expect.anything()
    )
    expect(jwtDecode).toHaveBeenCalledWith('new access token')
    expect(expectedResult).toEqual(actualResult)
  })

  test('return empty object when refresh token fail with TokenExpiredError', async () => {
    const accessTokenInCookie = undefined
    const cookieGet = jest.fn(() => accessTokenInCookie)
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

    expect(cookieGet).toHaveBeenCalledWith(process.env.ACCESS_TOKEN_NAME)
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_V2_URL}/refreshToken`,
      expect.anything()
    )
    expect(jwtDecode).not.toHaveBeenCalled()
    expect(expectedResult).toEqual(actualResult)
  })

  test('return empty object when refresh token fail with MissingTokenError', async () => {
    const accessTokenInCookie = undefined
    const cookieGet = jest.fn(() => accessTokenInCookie)
    Cookies.mockImplementation(() => ({
      get: cookieGet,
    }))
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            status: 400,
            name: 'MissingTokenError',
            message: 'No token found',
          }),
      })
    )

    const expectedResult = {}
    const actualResult = await clientAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.ACCESS_TOKEN_NAME)
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_V2_URL}/refreshToken`,
      expect.anything()
    )
    expect(jwtDecode).not.toHaveBeenCalled()
    expect(expectedResult).toEqual(actualResult)
  })

  test('return empty object when refresh token fail with RateLimitError', async () => {
    const accessTokenInCookie = undefined
    const cookieGet = jest.fn(() => accessTokenInCookie)
    Cookies.mockImplementation(() => ({
      get: cookieGet,
    }))
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            status: 429,
            name: 'RateLimitError',
            message: 'Rate Limited',
          }),
      })
    )

    const expectedResult = {}
    const actualResult = await clientAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.ACCESS_TOKEN_NAME)
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_V2_URL}/refreshToken`,
      expect.anything()
    )
    expect(jwtDecode).not.toHaveBeenCalled()
    expect(expectedResult).toEqual(actualResult)
  })

  test('return empty object when refresh token is successful but new token is an expired one', async () => {
    const accessTokenInCookie = undefined
    const cookieGet = jest.fn(() => accessTokenInCookie)
    Cookies.mockImplementation(() => ({
      get: cookieGet,
    }))
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({ token: 'new expired access token', user: { id: '~Test_User1' } }),
      })
    )
    jwtDecode.mockImplementation(() => ({
      user: { id: '~Test_User1' },
      exp: Math.floor(Date.now() / 1000) - 60,
      iss: 'openreview-1234',
    }))

    const expectedResult = {}
    const actualResult = await clientAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.ACCESS_TOKEN_NAME)
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_V2_URL}/refreshToken`,
      expect.anything()
    )
    expect(jwtDecode).toHaveBeenCalledWith('new expired access token')
    expect(expectedResult).toEqual(actualResult)
  })
})
