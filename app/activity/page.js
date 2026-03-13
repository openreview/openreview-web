'use client'

/* globals $,typesetMathJax: false */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import styles from './Activity.module.scss'
import useUser from '../../hooks/useUser'
import BaseActivityList from '../../components/BaseActivityList'
import ErrorAlert from '../../components/ErrorAlert'

export default function Page() {
  const { isRefreshing, user } = useUser()
  const [activityNotes, setActivityNotes] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  const loadActivityData = async () => {
    const queryParam = {
      tauthor: true,
      trash: true,
      details: 'writable,invitation',
      sort: 'tmdate:desc',
      limit: 100,
    }

    api
      .get('/notes/edits', queryParam)
      .then(
        ({ edits }) => (edits?.length > 0 ? edits : []),
        () => []
      )
      .then((edits) => {
        setActivityNotes(edits.sort((a, b) => b.tmdate - a.tmdate))
      })
      .catch((apiError) => {
        setError(apiError)
      })
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!user) {
      router.push('/login?redirect=/activity')
      return
    }
    loadActivityData()
  }, [isRefreshing])

  useEffect(() => {
    if (!activityNotes) return

    setTimeout(() => {
      typesetMathJax()
      $('[data-toggle="tooltip"]').tooltip()
    }, 100)
  }, [activityNotes])

  if (!activityNotes && !error) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />

  return (
    <div className={styles.activity}>
      <BaseActivityList
        notes={activityNotes}
        emptyMessage="No recent activity to display."
        showActionButtons
        showGroup
      />
    </div>
  )
}
