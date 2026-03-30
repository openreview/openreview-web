import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { nanoid } from 'nanoid'
import useUser from './useUser'

export default function useSocket(namespace, eventNames, options) {
  const [latestEvent, setLatestEvent] = useState(null)
  const { user } = useUser()
  const socket = useRef(null)

  const connectSocket = () => {
    socket.current = io(
      `${process.env.API_V2_URL}/${namespace}`,
      options
        ? { query: options, withCredentials: true, transports: ['websocket'] }
        : { withCredentials: true, transports: ['websocket'] }
    )
    socket.current.onAny((eventName, data) => {
      if (!eventNames.includes(eventName)) return
      setLatestEvent({ eventName, data, uniqueId: nanoid() })
    })
  }
  useEffect(() => {
    if (!(namespace && user)) return
    if (!socket.current?.auth?.accessToken) {
      connectSocket(namespace)
      return
    }
    socket.current.disconnect()
    socket.current.connect()
  }, [namespace, user])

  useEffect(
    () => () => {
      if (socket.current) {
        socket.current.removeAllListeners()
        socket.current.disconnect()
      }
    },
    []
  )

  if (latestEvent) return { ...latestEvent }
  return null
}
