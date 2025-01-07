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

export const metadata = {
  title: 'Compare Revisions | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page({ searchParams }) {
  const { token: accessToken } = await serverAuth()
  const query = await searchParams
  const { id, left, right, pdf, version } = query
  if (!accessToken) redirect(`/login?redirect=/revisions/compare?${stringify(query)}`)
  if (!(id && left && right)) throw new Error('Missing required parameter')

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
          throw new Error('Reference not found')
        })
    )

  return (
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
  )
}
