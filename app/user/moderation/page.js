import serverAuth from '../../auth'
import Moderation from './Moderation'
import CommonLayout from '../../CommonLayout'
import ErrorDisplay from '../../../components/ErrorDisplay'
import { checkAccess } from '../../../lib/server-access-control'

const errorMessage = 'Forbidden. Access to this page is restricted.'

export default async function page() {
  const { user, token } = await serverAuth()

  const hasAccess = await checkAccess(
    user,
    token,
    'Moderation',
    `${process.env.SUPER_USER}/Support`,
    true
  )
  if (!hasAccess) return <ErrorDisplay message={errorMessage} />

  return (
    <CommonLayout banner={null}>
      <header>
        <h1>User Moderation</h1>
      </header>
      <Moderation />
    </CommonLayout>
  )
}
