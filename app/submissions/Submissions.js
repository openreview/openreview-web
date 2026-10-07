import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { Suspense } from 'react'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import NoteList from '../../components/NoteList'
import PaginationLinks from '../../components/PaginationLinks'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import serverAuth from '../auth'

const displayOptions = {
  pdfLink: false,
  htmlLink: false,
  showContents: false,
  emptyMessage: 'No submissions found.',
}

export default async function Submissions({ groupId, invitationId, page }) {
  const { token, clearanceToken } = await serverAuth()
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')
  const notesPerPage = 25
  const currentPage = Math.max(parseInt(page, 10) || 1, 1)

  let notes, count
  try {
    ;({ notes, count } = await api.get(
      '/notes',
      {
        invitation: invitationId,
        limit: notesPerPage,
        offset: notesPerPage * (currentPage - 1),
      },
      {
        accessToken: token,
        remoteIpAddress,
        clearanceToken,
      }
    ))
  } catch (error) {
    if (error.name === 'ChallengeRequiredError') {
      redirect(
        `/challenge?redirect=${encodeURIComponent(`/submissions?${stringify({ venue: groupId, page: currentPage }, { sort: false })}`)}`
      )
    }
    return <ErrorDisplay message={error.message} withLayout={false} />
  }

  return (
    <>
      <header className="clearfix">
        <h1>{prettyId(groupId)} Submissions</h1>
        <hr />
      </header>
      <Suspense fallback={<LoadingSpinner />}>
        <div className="notes">
          <NoteList notes={notes} displayOptions={displayOptions} />
        </div>
        <PaginationLinks
          currentPage={currentPage}
          itemsPerPage={notesPerPage}
          totalCount={count}
          baseUrl="/submissions"
          queryParams={{ venue: groupId }}
        />
      </Suspense>
    </>
  )
}
