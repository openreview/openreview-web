import { redirect } from 'next/navigation'
import serverAuth from '../auth'
import LoginPage from './Login'

export const metadata = {
  title: 'Login | OpenReview',
}

export default async function page() {
  const { user } = await serverAuth()

  if (user) redirect('/')
  return <LoginPage />
}
