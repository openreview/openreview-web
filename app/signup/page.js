import { redirect } from 'next/navigation'
import serverAuth from '../auth'
import Signup from './Signup'

export const metadata = {
  title: 'Sign Up | OpenReview',
}

export default async function page() {
  const { user } = await serverAuth()
  if (user) redirect('/')

  return <Signup />
}
