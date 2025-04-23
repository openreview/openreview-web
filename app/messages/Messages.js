'use client'

import { useEffect, useState } from 'react'
import MessagesTable from '../../components/MessagesTable'
import PaginationLinks from '../../components/PaginationLinks'
import api from '../../lib/api-client'
import ErrorAlert from '../../components/ErrorAlert'
import LoadingSpinner from '../../components/LoadingSpinner'

const pageSize = 25

export default function Messages({ query, statusOptionValues, accessToken }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [allMessages, setAllMessages] = useState(null)
  const [error, setError] = useState(null)

  const count = allMessages?.length
  const messages = allMessages?.length
    ? allMessages.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : []

  const loadMessages = async (after) => {
    let validStatus
    if (Array.isArray(query.status)) {
      validStatus = query.status?.filter((status) => statusOptionValues.includes(status))
    } else if (statusOptionValues.includes(query.status)) {
      validStatus = query.status
    }

    try {
      const apiRes = await api.get(
        '/messages',
        {
          ...query,
          status: validStatus,
          after,
        },
        { accessToken }
      )
      if (after) {
        setAllMessages((existingMessages) =>
          (existingMessages ?? []).concat(apiRes.messages || [])
        )
      } else {
        setAllMessages(apiRes.messages || [])
      }
      setError(null)
    } catch (apiError) {
      setError(apiError)
      setAllMessages([])
    }
  }

  useEffect(() => {
    if (!allMessages?.length || allMessages.length < 1000) return
    const availablePages = Math.ceil(allMessages.length / pageSize)
    if (currentPage >= availablePages - 5) {
      loadMessages(allMessages[allMessages.length - 1].id)
    }
  }, [currentPage])

  useEffect(() => {
    if (!query) return
    loadMessages()
    setCurrentPage(1)
  }, [query])

  if (!allMessages) return <LoadingSpinner />

  return (
    <>
      {error && <ErrorAlert error={error} />}
      <MessagesTable messages={messages} />
      <PaginationLinks
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={pageSize}
        totalCount={count}
      />
    </>
  )
}
