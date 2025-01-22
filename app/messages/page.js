import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { Suspense } from 'react'
import serverAuth from '../auth'
import api from '../../lib/api-client'
import MessagesTable from '../../components/MessagesTable'
import PaginationLinks from '../../components/PaginationLinks'
import FilterForm from './FilterForm'
import styles from './Messages.module.scss'
import Messages from './Messages'
import LoadingSpinner from '../../components/LoadingSpinner'

export const metadata = {
  title: 'Message Viewer | OpenReview',
}

export const dynamic = 'force-dynamic'

const statusOptions = [
  { label: 'Delivered', value: 'delivered' },
  { label: 'Bounced', value: 'bounce' },
  { label: 'Processed', value: 'processed' },
  { label: 'Dropped', value: 'dropped' },
  { label: 'Error', value: 'error' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Deferred', value: 'deferred' },
]
const statusOptionValues = statusOptions.map((o) => o.value)

export default async function page({ searchParams }) {
  const { token } = await serverAuth()
  const query = await searchParams
  if (!token) redirect(`/login?redirect=/messages?${stringify(query)}`)

  const { to, page: pageParam, subject, status: statusParam, parentGroup } = query
  const pageSize = 25
  const parsedPageParam = parseInt(pageParam, 10) || 1

  let validStatus
  if (Array.isArray(statusParam)) {
    validStatus = statusParam?.filter((status) => statusOptionValues.includes(status))
  } else if (statusOptionValues.includes(statusParam)) {
    validStatus = statusParam
  }

  const loadMessagesP = api
    .get(
      '/messages',
      {
        ...{ to, subject, status: statusParam, parentGroup },
        status: validStatus,
        limit: pageSize,
        offset: pageSize * (parsedPageParam - 1),
      },
      { accessToken: token }
    )
    .catch((error) => ({ errorMessage: error.message }))

  return (
    <div className={styles.messages}>
      <FilterForm searchQuery={query} statusOptions={statusOptions} />
      <Suspense fallback={<LoadingSpinner />}>
        <Messages
          loadMessagesP={loadMessagesP}
          page={parsedPageParam}
          pageSize={pageSize}
          query={query}
        />
      </Suspense>
    </div>
  )
}
