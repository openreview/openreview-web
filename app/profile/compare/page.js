import serverAuth from '../../auth'
import ErrorDisplay from '../../../components/ErrorDisplay'
import { checkAccess } from '../../../lib/server-access-control'
import ComparePage from './comparePage'

const errorMessage = 'Forbidden. Access to this page is restricted.'

export default async function page() {
  const { user, token } = await serverAuth()

  const hasAccess = await checkAccess(
    user,
    token,
    'Profile Compare',
    `${process.env.SUPER_USER}/Support`,
    true
  )
  if (!hasAccess) return <ErrorDisplay message={errorMessage} />

  return <ComparePage />
}
