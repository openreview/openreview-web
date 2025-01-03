import { redirect } from 'next/navigation'
import serverAuth from '../auth'
import api from '../../lib/api-client'
import MessagesTable from '../../components/MessagesTable'
import PaginationLinks from '../../components/PaginationLinks'
import FilterForm from './FilterForm'
import { stringify } from 'query-string'
import styles from './Messages.module.scss'

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

  const { to, page: pageParam, subject, status, parentGroup } = query
  const pageSize = 25
  const page = parseInt(pageParam, 10) || 1

  const loadMessages = () => {
    let validStatus
    if (Array.isArray(status)) {
      validStatus = status?.filter((status) => statusOptionValues.includes(status))
    } else if (statusOptionValues.includes(status)) {
      validStatus = status
    }

    return api.get(
      '/messages',
      {
        ...{ to, subject, status, parentGroup },
        status: validStatus,
        limit: pageSize,
        offset: pageSize * (page - 1),
      },
      { accessToken: token }
    )
  }

  const { messages, count } = await loadMessages()

  return (
    <div className={styles.messages}>
      <FilterForm searchQuery={query} statusOptions={statusOptions} />
      <MessagesTable messages={messages} />
      <PaginationLinks
        currentPage={page}
        itemsPerPage={pageSize}
        totalCount={count}
        baseUrl="/messages"
        queryParams={query}
        options={{ useShallowRouting: true }}
      />
    </div>
  )
}
