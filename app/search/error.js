'use client'

import ErrorDisplay from '../../components/ErrorDisplay'
import CommonLayout from '../CommonLayout'

export default function Error({ error }) {
  return (
    <CommonLayout banner={null} editBanner={null}>
      <ErrorDisplay message={error.message} />
    </CommonLayout>
  )
}
