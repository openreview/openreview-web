import dayjs from 'dayjs'

const storeName = 'console-cache'

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
        const cacheData = request.result
        if (!cacheData?.timeStamp || dayjs().diff(cacheData.timeStamp, 'hour') > 24) {
          resolve(null)
          return
        }

        resolve(request.result)
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
      const request = objectStore.put(data, venueId)

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
