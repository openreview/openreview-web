'use client'

/* globals promptError: false */
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '../../lib/api-client'
import { forumLink } from '../../lib/banner-links'
import CommonLayout from '../CommonLayout'
import V1Revisions from './V1Revisions'
import styles from './Revisions.module.scss'
import Banner from '../../components/Banner'
import Revisions from './Revisions'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorDisplay from '../../components/ErrorDisplay'
import useUser from '../../hooks/useUser'

function Page() {
  const searchParams = useSearchParams()
  const [note, setNote] = useState(null)
  const [error, setError] = useState(null)
  const { user, isRefreshing } = useUser()

  const loadNote = async (noteId) => {
    try {
      const noteResult = await api.getNoteById(noteId, null, {
        details: 'writable,forumContent',
        trash: true,
      })
      if (!noteResult) throw new Error(`The note ${noteId} could not be found`)
      setNote(noteResult)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    const noteId = searchParams.get('id')

    if (!noteId) {
      setError('Missing id')
      return
    }
    loadNote(noteId)
  }, [searchParams, isRefreshing])

  if (!note && !error) return <LoadingSpinner />
  if (error) return <ErrorDisplay message={error} />

  return (
    <CommonLayout banner={<Banner>{forumLink(note)}</Banner>}>
      <div className={`${styles.revisions} revisions`}>
        {note.version === 2 ? (
          <Revisions parentNote={note} user={user} />
        ) : (
          <V1Revisions parentNoteId={note.id} user={user} />
        )}
      </div>
    </CommonLayout>
  )
}

export default function RevisionsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Page />
    </Suspense>
  )
}
