import { redirect } from 'next/navigation'
import serverAuth from '../../auth'
import Impersonate from './Impersonate'

export const metadata = {
  title: 'Impersonate User | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page() {
  const { user, token } = await serverAuth()
  if (!token) redirect('/login?redirect=/user/impersonate')

  return (
    <div>
      <Impersonate user={user} />
    </div>
  )
}
