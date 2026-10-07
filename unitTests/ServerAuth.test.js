import { jwtDecode } from 'jwt-decode'
import { cookies } from 'next/headers'
import serverAuth from '../app/auth'
import '@testing-library/jest-dom'

jest.mock('next/headers')
jest.mock('jwt-decode')

describe('serverAuth', () => {
  test('return clearanceToken when cookie does not have access token', async () => {
    const accessTokenInCookie = undefined
    const clearanceTokenInCookie = 'some clearance token'
    const cookieGet = jest.fn((name) =>
      name === process.env.ACCESS_TOKEN_NAME
        ? { value: undefined }
        : { value: clearanceTokenInCookie }
    )
    cookies.mockImplementation(() => ({
      get: cookieGet,
    }))

    const expectedResult = { clearanceToken: clearanceTokenInCookie }
    const actualResult = await serverAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.ACCESS_TOKEN_NAME)
    expect(jwtDecode).not.toHaveBeenCalled()
    expect(actualResult).toEqual(expectedResult)
  })

  test('return payload when cookie exist and is valid', async () => {
    const accessTokenInCookie = 'some valid token'
    const cookieGet = jest.fn(() => ({ value: accessTokenInCookie }))
    cookies.mockImplementation(() => ({
      get: cookieGet,
    }))
    jwtDecode.mockImplementation(() => ({
      user: { id: '~Test_User1', profile: { id: '~Test_User1' } },
      exp: Math.floor(Date.now() / 1000) + 60,
      iss: 'openreview-1234',
    }))

    const expectedResult = {
      token: accessTokenInCookie,
      user: { id: '~Test_User1', profile: { id: '~Test_User1' } },
    }
    const actualResult = await serverAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.ACCESS_TOKEN_NAME)
    expect(jwtDecode).toHaveBeenCalledWith(accessTokenInCookie)
    expect(actualResult).toEqual(expectedResult)
  })

  test('return empty object when cookie exist but has expired', async () => {
    const accessTokenInCookie = 'some expired token'
    const clearanceTokenInCookie = undefined // user previously logged in so no clearanceToken
    const cookieGet = jest.fn((name) =>
      name === process.env.ACCESS_TOKEN_NAME
        ? { value: accessTokenInCookie }
        : { value: clearanceTokenInCookie }
    )
    cookies.mockImplementation(() => ({
      get: cookieGet,
    }))
    jwtDecode.mockImplementation(() => ({
      user: { id: '~Test_User1' },
      exp: Math.floor(Date.now() / 1000) - 60,
      iss: 'openreview-1234',
    }))

    const expectedResult = {}
    const actualResult = await serverAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.ACCESS_TOKEN_NAME)
    expect(jwtDecode).toHaveBeenCalledWith(accessTokenInCookie)
    expect(actualResult).toEqual(expectedResult)
  })

  test('return empty object when cookie exist but cannot decode', async () => {
    const accessTokenInCookie = 'some invalid token'
    const clearanceTokenInCookie = undefined
    const cookieGet = jest.fn((name) =>
      name === process.env.ACCESS_TOKEN_NAME
        ? { value: accessTokenInCookie }
        : { value: clearanceTokenInCookie }
    )
    cookies.mockImplementation(() => ({
      get: cookieGet,
    }))
    jwtDecode.mockImplementation(() => {
      throw new Error('decoding access token failed')
    })

    const expectedResult = {}
    const actualResult = await serverAuth()

    expect(cookieGet).toHaveBeenCalledWith(process.env.ACCESS_TOKEN_NAME)
    expect(jwtDecode).toHaveBeenCalledWith(accessTokenInCookie)
    expect(actualResult).toEqual(expectedResult)
  })
})
