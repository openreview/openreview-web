import dayjs from 'dayjs'
import { deflate, inflate } from 'pako'

const storeName = 'console-cache'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const compress = (obj) => {
  const json = JSON.stringify(obj, (_, value) =>
    value instanceof Map ? { type: 'Map', entries: [...value.entries()] } : value
  )
  const bytes = textEncoder.encode(json)
  return deflate(bytes)
}

const decompress = (bytes) => {
  const inflated = inflate(bytes)
  const json = textDecoder.decode(inflated)
  return JSON.parse(json, (_, value) => {
    if (value && value.type === 'Map' && Array.isArray(value.entries)) {
      return new Map(value.entries)
    }
    return value
  })
}

const connect = () =>
  new Promise((resolve, reject) => {
    const DBOpenRequest = window.indexedDB.open('PCConsole')

    DBOpenRequest.onsuccess = () => {
      const db = DBOpenRequest.result
      resolve(db)
    }

    DBOpenRequest.onerror = (event) => {
      reject(event)
    }

    DBOpenRequest.onupgradeneeded = (event) => {
      const db = event.target.result
      db.createObjectStore(storeName)
    }
  })

export const getCache = async (venueId) => {
  try {
    const db = await connect()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.get(venueId)

      request.onerror = (event) => {
        reject(event)
      }

      request.onsuccess = () => {
        let cacheData = request.result
        if (!cacheData) {
          resolve(null)
          return
        }

        if (cacheData.compressed) {
          const original = decompress(cacheData.payload)
          cacheData = { ...original, timeStamp: cacheData.timeStamp }
        }

        if (!cacheData.timeStamp || dayjs().diff(cacheData.timeStamp, 'hour') > 24) {
          resolve(null)
          return
        }

        resolve(cacheData)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    return null
  }
}

export const setCache = async (venueId, data) => {
  try {
    const db = await connect()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const objectStore = transaction.objectStore(storeName)

      const compressedData = {
        timeStamp: data.timeStamp,
        compressed: true,
        payload: compress(data),
      }
      const request = objectStore.put(compressedData, venueId)

      request.onerror = (event) => {
        reject(event)
      }

      request.onsuccess = () => {
        resolve()
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    return null
  }
}

export const clearCache = async (venueId) => {
  try {
    const db = await connect()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const objectStore = transaction.objectStore(storeName)
      const request = objectStore.openCursor()

      request.onerror = (event) => {
        reject(event)
      }

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          const cacheData = cursor.value
          if (
            cursor.key === venueId ||
            !cacheData?.timeStamp ||
            dayjs().diff(cacheData.timeStamp, 'hour') > 24
          ) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve(null)
        }
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    return null
  }
}
