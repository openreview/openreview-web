import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import serverAuth from '../auth'
import FilterForm from './FilterForm'
import styles from './Messages.module.scss'
import Messages from './Messages'

export const metadata = {
  title: 'Message Viewer | OpenReview',
}

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
  if (!token) redirect(`/login?redirect=/messages?${encodeURIComponent(stringify(query))}`)

  return (
    <div className={styles.messages}>
      <FilterForm searchQuery={query} statusOptions={statusOptions} />
      <Messages query={query} statusOptionValues={statusOptionValues} />
    </div>
  )
}
