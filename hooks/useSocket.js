import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import useUser from './useUser'

export default function useSocket(namespace, eventNames, options) {
  const [latestEvent, setLatestEvent] = useState(null)
  const { user } = useUser()
  const query = options ? JSON.stringify(options) : undefined

  useEffect(() => {
    if (!(namespace && user)) return undefined

    const socket = io(`${process.env.API_V2_URL}/${namespace}`, {
      ...(options && { query: options, forceNew: true }),
      withCredentials: true,
      transports: ['websocket'],
    })
    socket.onAny((eventName, data) => {
      if (!eventNames.includes(eventName)) return
      setLatestEvent({ eventName, data, uniqueId: nanoid() })
    })

    if (eventNames.includes('connect')) {
      socket.on('connect', () => setLatestEvent({ eventName: 'connect', uniqueId: nanoid() }))
    }
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [namespace, user, query])

  if (latestEvent) return { ...latestEvent }
  return null
}
