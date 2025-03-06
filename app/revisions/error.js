'use client'

import ErrorAlert from '../../components/ErrorAlert'
import CommonLayout from '../CommonLayout'

export default function Error({ error }) {
  return (
    <CommonLayout banner={null}>
      <ErrorAlert error={error} />
    </CommonLayout>
  )
}
