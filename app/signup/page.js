import { redirect } from 'next/navigation'
import serverAuth from '../auth'
import styles from './Signup.module.scss'
import Signup from './Signup'

export const metadata = {
  title: 'Sign Up | OpenReview',
}

export default async function page() {
  const { user } = await serverAuth()
  if (user) redirect('/')

  return (
    <div className={styles.signup}>
      <Signup />
    </div>
  )
}
