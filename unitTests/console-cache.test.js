import dayjs from 'dayjs'
import { getCache } from '../lib/console-cache'

const normalDb = {
  transaction: jest.fn(() => ({
    objectStore: jest.fn(() => ({
      get: jest.fn(() => {
        const request = { result: { timeStamp: dayjs().valueOf() } }
        setTimeout(() => {
          request.onsuccess()
        }, 0)
        return request
      }),
      put: jest.fn(),
      openCursor: jest.fn(),
    })),
  })),
  close: jest.fn(),
}

const staleDb = {
  transaction: jest.fn(() => ({
    objectStore: jest.fn(() => ({
      get: jest.fn(() => {
        const request = { result: { timeStamp: dayjs().subtract(25, 'hour').valueOf() } }
        setTimeout(() => {
          request.onsuccess()
        }, 0)
        return request
      }),
      put: jest.fn(),
      openCursor: jest.fn(),
    })),
  })),
  close: jest.fn(),
}

const normalIndexedDB = {
  open: jest.fn(() => {
    const request = { result: normalDb }

    setTimeout(() => {
      request.onsuccess()
    }, 0)

    return request
  }),
}

const staleIndexedDB = {
  open: jest.fn(() => {
    const request = { result: staleDb }

    setTimeout(() => {
      request.onsuccess()
    }, 0)

    return request
  }),
}

beforeEach(() => {
  global.indexedDB = normalIndexedDB
})

describe('console-cache', () => {
  test('getCache should return cached data', async () => {
    const result = await getCache('testVenue')
    expect(result.timeStamp).toBeDefined()
  })

  test('getCache should not return cached but stale data', async () => {
    global.indexedDB = staleIndexedDB
    const result = await getCache('testVenue')
    expect(result).toBeNull()
  })
})
