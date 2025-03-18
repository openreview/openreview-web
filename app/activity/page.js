import { redirect } from 'next/navigation'
import serverAuth from '../auth'
import Activity from './Activity'
import styles from './Activity.module.scss'

export const metadata = {
  title: 'Activity | OpenReview',
}

export default async function page() {
  const { token } = await serverAuth()
  console.log(token)
  if (!token) redirect('/login?redirect=/activity')

  return (
    <div className={styles.activity}>
      <Activity />
    </div>
  )
}
