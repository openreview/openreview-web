import { redirect } from 'next/navigation'
import serverAuth from '../auth'
import LoginPage from './Login'

export const metadata = {
  title: 'Login | OpenReview',
}

export default async function page({ searchParams }) {
  const { user } = await serverAuth()
  const { redirect: redirectParam } = await searchParams

  if (user) redirect(redirectParam ?? '/')
  return <LoginPage />
}
