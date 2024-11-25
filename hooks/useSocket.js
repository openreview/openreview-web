import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { nanoid } from 'nanoid'
import useUser from './useUser'

export default function useSocket(namespace, eventNames, options) {
  const [latestEvent, setLatestEvent] = useState(null)
  const { accessToken } = useUser()
  const socket = useRef(null)

  const connectSocket = () => {
    socket.current = io(
      `${process.env.API_V2_URL}/${namespace}`,
      options
        ? { query: options, auth: { accessToken }, transports: ['websocket'] }
        : { auth: { accessToken }, transports: ['websocket'] }
    )
    socket.current.onAny((eventName, data) => {
      if (!eventNames.includes(eventName)) return
      setLatestEvent({ eventName, data, uniqueId: nanoid() })
    })
  }
  useEffect(() => {
    if (!(namespace && accessToken)) return
    if (!socket.current?.auth?.accessToken) {
      connectSocket(namespace)
      return
    }
    socket.current.auth = { accessToken }
    socket.current.connect()
  }, [namespace, accessToken])

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
