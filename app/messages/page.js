import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import serverAuth from '../auth'
import api from '../../lib/api-client'
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
  const { token, user } = await serverAuth()
  const query = await searchParams
  if (!token) redirect(`/login?redirect=/messages?${stringify(query)}`)

  const { to, subject, status: statusParam, parentGroup } = query
  const pageSize = 25

  let validStatus
  if (Array.isArray(statusParam)) {
    validStatus = statusParam?.filter((status) => statusOptionValues.includes(status))
  } else if (statusOptionValues.includes(statusParam)) {
    validStatus = statusParam
  }

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const loadMessagesP = api
    .get(
      '/messages',
      {
        ...{ to, subject, status: statusParam, parentGroup },
        status: validStatus,
      },
      { accessToken: token, remoteIpAddress }
    )
    .catch((error) => {
      console.log('Error in loadMessagesP', {
        page: 'messages',
        user: user?.id,
        apiError: error,
        apiRequest: {
          endpoint: '/messages',
          params: {
            ...{ to, subject, status: statusParam, parentGroup },
            status: validStatus,
          },
        },
      })
      return { errorMessage: error.message }
    })

  return (
    <div className={styles.messages}>
      <FilterForm searchQuery={query} statusOptions={statusOptions} />
      <Suspense fallback={<LoadingSpinner />}>
        <Messages
          loadMessagesP={loadMessagesP}
          pageSize={pageSize}
          query={query}
          statusOptionValues={statusOptionValues}
          accessToken={token}
        />
      </Suspense>
    </div>
  )
}
