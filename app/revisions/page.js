import { Suspense } from 'react'
import { headers } from 'next/headers'
import api from '../../lib/api-client'
import { forumLink } from '../../lib/banner-links'
import serverAuth from '../auth'
import CommonLayout from '../CommonLayout'
import V1Revisions from './V1Revisions'
import styles from './Revisions.module.scss'
import Banner from '../../components/Banner'
import Revisions from './Revisions'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorDisplay from '../../components/ErrorDisplay'

export const metadata = {
  title: 'Revisions | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page({ searchParams }) {
  const { id: noteId } = await searchParams
  const { user, token: accessToken } = await serverAuth()
  if (!noteId) return <ErrorDisplay message="Missing id" />

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  let note
  try {
    note = await api.getNoteById(
      noteId,
      accessToken,
      {
        details: 'writable,forumContent',
        trash: true,
      },
      null,
      remoteIpAddress
    )
    if (!note) throw new Error(`The note ${noteId} could not be found`)
  } catch (error) {
    return <ErrorDisplay message={error.message} />
  }

  const loadEditsP =
    note.version === 2
      ? api
          .get(
            '/notes/edits',
            {
              'note.id': noteId,
              sort: 'tcdate',
              details: 'writable,presentation,invitation',
              trash: true,
            },
            { accessToken, remoteIpAddress }
          )
          .then((response) => ({
            revisions: (response.edits ?? []).map((edit) => [edit, edit.details.invitation]),
          }))
          .catch((error) => {
            console.log('Error in loadEditsP', {
              page: 'revisions',
              user: user.id,
              apiError: error,
              apiRequest: {
                endpoint: '/notes/edits',
                params: {
                  'note.id': noteId,
                  sort: 'tcdate',
                  details: 'writable,presentation,invitation',
                  trash: true,
                },
              },
            })
            return { errorMessage: error.message }
          })
      : Promise.resolve(null)

  return (
    <CommonLayout banner={<Banner>{forumLink(note)}</Banner>}>
      <div className={`${styles.revisions} revisions`}>
        {note.version === 2 ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Revisions parentNote={note} loadEditsP={loadEditsP} accessToken={accessToken} />
          </Suspense>
        ) : (
          <V1Revisions parentNoteId={note.id} user={user} accessToken={accessToken} />
        )}
      </div>
    </CommonLayout>
  )
}
