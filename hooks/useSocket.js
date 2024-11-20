import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import useUser from './useUser'

export default function useSocket(namespace, eventNames, options) {
  const [latestEvent, setLatestEvent] = useState(null)
  const { accessToken } = useUser()
  const socket = useRef(null)

  const connectSocket = () => {
    socket.current = io(
      `${process.env.API_V2_URL}/${namespace}`,
      options ? { query: options, auth: { accessToken } } : { auth: { accessToken } }
    )

    socket.current.onAny((eventName, data) => {
      if (!eventNames.includes(eventName)) return
      setLatestEvent({ eventName, data })
    })
  }
  useEffect(() => {
    if (namespace && accessToken) {
      connectSocket(namespace)
    }
  }, [namespace])

  useEffect(() => {
    if (!accessToken || !socket.current) return
    socket.current.auth = { accessToken }
    socket.current.connect()
  }, [accessToken])

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
