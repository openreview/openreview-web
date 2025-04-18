'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { stringify } from 'query-string'
import V1Compare from './V1Compare'
import Compare from './Compare'
import LoadingSpinner from '../../../components/LoadingSpinner'
import styles from './Compare.module.scss'
import CommonLayout from '../../CommonLayout'
import ErrorDisplay from '../../../components/ErrorDisplay'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import Banner from '../../../components/Banner'
import { forumLink } from '../../../lib/banner-links'

function Page() {
  const searchParams = useSearchParams()
  const { accessToken, isRefreshing } = useUser()
  const router = useRouter()
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)

  const query = {
    id: searchParams.get('id'),
    left: searchParams.get('left'),
    right: searchParams.get('right'),
    version: searchParams.get('version'),
  }

  const getNote = async () => {
    try {
      const note = await api.getNoteById(query.id, accessToken)
      if (note) {
        setBanner(<Banner>{forumLink(note)}</Banner>)
      }
    } catch (_) {
      /* empty */
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!accessToken)
      router.replace(
        `/login?redirect=${encodeURIComponent(`/revisions/compare?${stringify(query)}`)}`
      )
    if (!(query.id && query.left && query.right)) setError('Missing required parameter')
    getNote()
  }, [isRefreshing])

  if (error) return <ErrorDisplay message={error} />

  return (
    <CommonLayout banner={banner}>
      <div className={styles.compare}>
        <header>
          <h1>Revision Comparison</h1>
          <div className="button-container">
            <Link href={`/revisions?id=${query.id}`} className="btn btn-primary">
              Show Revisions List
            </Link>
          </div>
        </header>
        {/* eslint-disable-next-line eqeqeq */}
        {query.version == 2 ? (
          <Compare query={query} accessToken={accessToken} />
        ) : (
          <V1Compare query={query} accessToken={accessToken} />
        )}
      </div>
    </CommonLayout>
  )
}

export default function RevisionsComparePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Page />
    </Suspense>
  )
}
