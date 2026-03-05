import { headers } from 'next/headers'
import serverAuth from '../../auth'
import Moderation from './Moderation'
import CommonLayout from '../../CommonLayout'
import ErrorDisplay from '../../../components/ErrorDisplay'
import api from '../../../lib/api-client'

const errorMessage = 'Forbidden. Access to this page is restricted.'

export default async function page() {
  const { user, token } = await serverAuth()
  if (!token || !user?.id) return <ErrorDisplay message={errorMessage} />
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')
  try {
    const supportGroupResult = await api.get(
      '/groups',
      { id: `${process.env.SUPER_USER}/Support`, member: user.id },
      { accessToken: token, remoteIpAddress }
    )
    if (!supportGroupResult?.groups?.length) {
      console.log('User is not member of support group', {
        page: 'Moderation',
        user: user.id,
        remoteIpAddress,
      })
      return <ErrorDisplay message={errorMessage} />
    }
  } catch (error) {
    console.log('Error in Moderation Access Control', {
      page: 'Moderation',
      user: user.id,
      remoteIpAddress,
      apiError: error,
    })
    return <ErrorDisplay message={errorMessage} />
  }

  return (
    <CommonLayout banner={null}>
      <header>
        <h1>User Moderation</h1>
      </header>
      <Moderation />
    </CommonLayout>
  )
}
