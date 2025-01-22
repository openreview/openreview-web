'use client'

import ErrorDisplay from '../components/ErrorDisplay'

export default function Error({ error }) {
  console.log('global error')
  return <ErrorDisplay message={error.message} />
}
