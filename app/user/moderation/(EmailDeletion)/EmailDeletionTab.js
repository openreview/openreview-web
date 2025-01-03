import { Suspense } from 'react'
import api from '../../../../lib/api-client'
import EmailDeletionList from './EmailDeletionList'
import LoadingSpinner from '../../../../components/LoadingSpinner'

const emailRemovalInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Email_Removal`

export default async function EmailDeletionTab({ accessToken }) {
  const notesResultP = api.getAll(
    '/notes',
    { invitation: emailRemovalInvitationId, sort: 'tcdate' },
    { accessToken }
  )
  const editResultsP = api.getAll(
    '/notes/edits',
    { invitation: emailRemovalInvitationId },
    { accessToken, resultsKey: 'edits' }
  )
  const processLogsP = api.getAll(
    '/logs/process',
    { invitation: emailRemovalInvitationId },
    { accessToken, resultsKey: 'logs' }
  )

  const emailDeletionNotesP = Promise.all([notesResultP, editResultsP, processLogsP]).then(
    ([notes, edits, processLogs]) => {
      const notesWithStatus = notes.map((p) => {
        const edit = edits.find((q) => q.note.id === p.id)
        return {
          ...p,
          processLogStatus: processLogs.find((q) => q.id === edit?.id)?.status ?? 'running',
        }
      })
      return notesWithStatus
    }
  )

  return (
    <>
      <div className="email-deletion-container">
        <Suspense fallback={<LoadingSpinner />}>
          <EmailDeletionList
            emailDeletionNotesP={emailDeletionNotesP}
            emailRemovalInvitationId={emailRemovalInvitationId}
            accessToken={accessToken}
          />
        </Suspense>
      </div>
    </>
  )
}
