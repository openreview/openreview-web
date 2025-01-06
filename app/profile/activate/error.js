'use client'

/* globals promptError: false */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Error({ error }) {
  const router = useRouter()

  useEffect(() => {
    if (!error) return
    promptError(error.message)
    router.replace('/')
  }, [error])

  return null
}
