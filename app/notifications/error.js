'use client'

import ErrorAlert from '../../components/ErrorAlert'

export default function Error({ error }) {
  return <ErrorAlert error={error} />
}
