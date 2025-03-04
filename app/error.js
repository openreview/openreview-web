'use client'

import ErrorDisplay from '../components/ErrorDisplay'

export default function Error({ error }) {
  return <ErrorDisplay message={error.message} />
}
