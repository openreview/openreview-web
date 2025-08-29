import dayjs from 'dayjs'
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

let getCache

beforeAll(async () => {
  const module = await import('../lib/console-cache')
  getCache = module.getCache
})

const normalDb = {
  transaction: jest.fn(() => ({
    objectStore: jest.fn(() => ({
      get: jest.fn(() => {
        const request = { result: { timeStamp: dayjs().valueOf(), compressed: undefined } }
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

const compressedDb = {
  transaction: jest.fn(() => ({
    objectStore: jest.fn(() => ({
      get: jest.fn(() => {
        const request = {
          result: {
            timeStamp: dayjs().valueOf(),
            compressed: true,
            payload: [
              // {someMap: {key:1}}
              120, 156, 171, 86, 42, 206, 207, 77, 245, 77, 44, 80, 178, 170, 86, 42, 169, 44,
              72, 85, 178, 82, 2, 241, 116, 148, 82, 243, 74, 138, 50, 83, 139, 149, 172, 162,
              163, 149, 178, 83, 43, 149, 116, 12, 99, 99, 107, 107, 1, 136, 46, 15, 225,
            ],
          },
        }
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

const compressedIndexedDB = {
  open: jest.fn(() => {
    const request = { result: compressedDb }

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

  test('getCache should return cached compressed data', async () => {
    global.indexedDB = compressedIndexedDB
    const result = await getCache('testVenue')
    expect(result.timeStamp).toBeDefined()
    expect(result.someMap.get('key')).toBe(1)
  })

  test('getCache should not return cached but stale data', async () => {
    global.indexedDB = staleIndexedDB
    const result = await getCache('testVenue')
    expect(result).toBeNull()
  })
})
