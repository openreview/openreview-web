import { Suspense } from 'react'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function Layout({ children }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
}

export const metadata = {
  robots: { index: false, follow: false },
}
