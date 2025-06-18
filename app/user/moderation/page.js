import serverAuth, { isSuperUser } from '../../auth'
import Moderation from './Moderation'
import CommonLayout from '../../CommonLayout'
import ErrorDisplay from '../../../components/ErrorDisplay'

export default async function page() {
  const { user, token } = await serverAuth()
  if (!isSuperUser(user))
    return <ErrorDisplay message="Forbidden. Access to this page is restricted." />

  return (
    <CommonLayout banner={null}>
      <header>
        <h1>User Moderation</h1>
      </header>
      <Moderation accessToken={token} />
    </CommonLayout>
  )
}
