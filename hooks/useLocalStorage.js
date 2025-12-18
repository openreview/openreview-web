/* global promptError:false */
import { useCallback, useEffect, useSyncExternalStore } from 'react'

function dispatchStorageEvent(key, newValue) {
  window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
}

function setLocalStorageItem(key, value) {
  try {
    const stringifiedValue = JSON.stringify(value)
    window.localStorage.setItem(key, stringifiedValue)
    dispatchStorageEvent(key, stringifiedValue)
  } catch (error) {
    if (error?.name === 'QuotaExceededError') {
      Object.keys(window.localStorage).forEach((storageKey) => {
        if (storageKey.startsWith('forum-notifications-')) {
          window.localStorage.removeItem(storageKey)
        }
      })
    }
  }
}

function removeLocalStorageItem(key) {
  window.localStorage.removeItem(key)
  dispatchStorageEvent(key, null)
}

function getLocalStorageItem(key) {
  return window.localStorage.getItem(key)
}

function useLocalStorageSubscribe(callback) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getLocalStorageServerSnapshot() {
  return null
}

export default function useLocalStorage(key, initialValue) {
  const getSnapshot = () => getLocalStorageItem(key)

  const store = useSyncExternalStore(
    useLocalStorageSubscribe,
    getSnapshot,
    getLocalStorageServerSnapshot
  )

  const setState = useCallback(
    (newValue) => {
      try {
        if (newValue === undefined || newValue === null) {
          removeLocalStorageItem(key)
        } else {
          setLocalStorageItem(key, newValue)
        }
      } catch (e) {
        console.warn(e)
      }
    },
    [key, store]
  )

  useEffect(() => {
    if (getLocalStorageItem(key) === null && typeof initialValue !== 'undefined') {
      setLocalStorageItem(key, initialValue)
    }
  }, [key, initialValue])

  return [store ? JSON.parse(store) : initialValue, setState]
}
