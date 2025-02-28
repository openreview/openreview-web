import { stringify } from 'query-string'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import serverAuth from '../../auth'
import V1Compare from './V1Compare'
import Compare from './Compare'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import styles from './Compare.module.scss'
import CommonLayout from '../../CommonLayout'
import ErrorDisplay from '../../../components/ErrorDisplay'

export const metadata = {
  title: 'Compare Revisions | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page({ searchParams }) {
  const { token: accessToken, user } = await serverAuth()
  const query = await searchParams
  const { id, left, right, version } = query
  if (!accessToken) redirect(`/login?redirect=/revisions/compare?${stringify(query)}`)
  if (!(id && left && right)) return <ErrorDisplay message="Missing required parameter" />

  const loadEditsP = api
    .get(
      '/pdf/compare',
      {
        noteId: id,
        leftId: left,
        rightId: right,
      },
      { accessToken, version: 2 }
    )
    .then((result) => {
      const { leftNote, rightNote, viewerUrl } = result
      return { references: [leftNote, rightNote], viewerUrl }
    })
    .catch((apiError) =>
      api
        .get('/notes/edits', { 'note.id': id, trash: true }, { accessToken })
        .then((editsResponse) => {
          if (editsResponse.edits?.length <= 1) throw new Error('Reference not found')
          const leftEdit = editsResponse.edits.find((edit) => edit.id === query.left)
          const rightEdit = editsResponse.edits.find((edit) => edit.id === query.right)
          if (leftEdit && rightEdit) {
            return { references: [leftEdit, rightEdit] }
          }
          return { errorMessage: 'Reference not found' }
        })
        .catch((error) => {
          console.log('Error in loadEditsP', {
            page: 'revisions/compare',
            user: user.id,
            apiError: error,
            apiRequest: {
              endpoint: '/notes/edits',
              params: { 'note.id': id, trash: true },
            },
          })
          return { errorMessage: error.message }
        })
    )

  return (
    <CommonLayout>
      <div className={styles.compare}>
        <header>
          <h1>Revision Comparison</h1>
          <div className="button-container">
            <Link href={`/revisions?id=${id}`} className="btn btn-primary">
              Show Revisions List
            </Link>
          </div>
        </header>
        {/* eslint-disable-next-line eqeqeq */}
        {version == 2 ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Compare loadEditsP={loadEditsP} />
          </Suspense>
        ) : (
          <V1Compare query={query} accessToken={accessToken} />
        )}
      </div>
    </CommonLayout>
  )
}
