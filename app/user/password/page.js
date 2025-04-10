import { Suspense } from 'react'
import { headers } from 'next/headers'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import Password from './Password'
import styles from './Password.module.scss'
import CommonLayout from '../../CommonLayout'
import serverAuth from '../../auth'

export const metadata = {
  title: 'Change Password | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page({ searchParams }) {
  const { token } = await searchParams
  const { user } = await serverAuth()

  if (!token) return <ErrorDisplay message="Page not found" />

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const loadResetTokenP = api
    .get(`/resettable/${token}`, null, { remoteIpAddress })
    .catch((error) => {
      console.log('Error in loadResetTokenP', {
        page: 'user/password',
        user: user?.id,
        apiError: error,
        apiRequest: {
          endpoint: `/resettable/${token}`,
        },
      })
      return { errorMessage: error.message }
    })

  return (
    <CommonLayout>
      <div className={`row ${styles.password}`}>
        <div className="reset-container col-sm-12 col-md-8 col-lg-6 col-md-offset-2 col-lg-offset-3">
          <h1>Reset Password</h1>
          <Suspense fallback={<LoadingSpinner inline />}>
            <Password loadResetTokenP={loadResetTokenP} />
          </Suspense>
        </div>
      </div>
    </CommonLayout>
  )
}
