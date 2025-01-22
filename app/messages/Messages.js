'use client'

import { use } from 'react'
import MessagesTable from '../../components/MessagesTable'
import PaginationLinks from '../../components/PaginationLinks'

export default function Messages({ loadMessagesP, page, pageSize, query }) {
  const { messages, count, errorMessage } = use(loadMessagesP)
  if (errorMessage) throw new Error(errorMessage)
  return (
    <>
      <MessagesTable messages={messages} />
      <PaginationLinks
        currentPage={page}
        itemsPerPage={pageSize}
        totalCount={count}
        baseUrl="/messages"
        queryParams={query}
        options={{ useShallowRouting: true }}
      />
    </>
  )
}
