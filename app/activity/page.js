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
  const { accessToken, isRefreshing } = useUser()
  const [activityNotes, setActivityNotes] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  const loadActivityData = async () => {
    const queryParamV1 = {
      tauthor: true,
      trash: true,
      details: 'forumContent,writable,invitation',
      sort: 'tmdate:desc',
      limit: 100,
    }
    const queryParamV2 = {
      tauthor: true,
      trash: true,
      details: 'writable,invitation',
      sort: 'tmdate:desc',
      limit: 100,
    }

    Promise.all([
      api.get('/notes', queryParamV1, { accessToken, version: 1 }).then(
        ({ notes }) => (notes?.length > 0 ? notes : []),
        () => []
      ),
      api
        .get('/notes/edits', queryParamV2, { accessToken })
        .then(
          ({ edits }) => (edits?.length > 0 ? edits : []),
          () => []
        )
        .then((edits) => edits.map((edit) => ({ ...edit, apiVersion: 2 }))),
    ])
      .then(([notes, edits]) => {
        setActivityNotes(notes.concat(edits).sort((a, b) => b.tmdate - a.tmdate))
      })
      .catch((apiError) => {
        setError(apiError)
      })
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!accessToken) {
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
