import { Suspense } from 'react'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import serverAuth from '../auth'
import SubmissionList from './SubmissionList'
import LoadingSpinner from '../../components/LoadingSpinner'

export default async function Submissions({ groupId, invitationId }) {
  const { token } = await serverAuth()
  const notesPerPage = 25

  const getFirstPageNotesP = api.get(
    '/notes',
    {
      invitation: invitationId,
      limit: notesPerPage,
    },
    {
      accessToken: token,
    }
  )

  return (
    <>
      <header className="clearfix">
        <h1>{prettyId(groupId)} Submissions</h1>
        <hr />
      </header>
      <Suspense fallback={<LoadingSpinner />}>
        <SubmissionList
          getFirstPageNotesP={getFirstPageNotesP}
          notesPerPage={notesPerPage}
          invitationId={invitationId}
        />
      </Suspense>
    </>
  )
}
