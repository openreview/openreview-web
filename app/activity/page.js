import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import serverAuth from '../auth'
import Activity from './Activity'
import styles from './Activity.module.scss'

export const metadata = {
  title: 'Activity | OpenReview',
}

export default async function page() {
  await connection()
  const { token } = await serverAuth()
  if (!token) redirect('/login?redirect=/activity')

  return (
    <div className={styles.activity}>
      <Activity />
    </div>
  )
}
