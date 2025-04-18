'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './Search.module.scss'
import Search from './Search'
import FilterForm from './FilterForm'
import ErrorAlert from '../../components/ErrorAlert'
import LoadingSpinner from '../../components/LoadingSpinner'

const sourceOptions = { all: 'All', forum: 'Papers Only', reply: 'Replies Only' }

function Page() {
  const searchParams = useSearchParams()
  const query = {
    term: searchParams.get('term'),
    content: searchParams.get('content'),
    group: searchParams.get('group'),
    source: searchParams.get('source'),
  }

  if (!query.term) return <ErrorAlert error={{ message: 'Missing search term or query' }} />

  return (
    <div className={styles.search}>
      <FilterForm searchQuery={query} sourceOptions={sourceOptions} />
      <Search searchQuery={query} sourceOptions={sourceOptions} />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Page />
    </Suspense>
  )
}
