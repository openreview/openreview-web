import { Suspense } from 'react'
import CommonLayout from '../CommonLayout'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Layout({ children }) {
  return (
    <CommonLayout banner={null}>
      <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
    </CommonLayout>
  )
}

export const metadata = {
  title: 'Support OpenReview | OpenReview',
}
