import serverAuth from '../auth'
import LoginPage from './Login'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Login | OpenReview',
}

export default async function page() {
  const { user } = await serverAuth()

  if (user) redirect('/')
  return <LoginPage />
}
