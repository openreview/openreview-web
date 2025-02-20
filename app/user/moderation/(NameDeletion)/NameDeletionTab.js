import { Suspense } from 'react'
import api from '../../../../lib/api-client'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import NameDeletionList from './NameDeletionList'

const nameDeletionDecisionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal_Decision`

export default async function NameDeletionTab({ accessToken }) {
  const nameRemovalNotesP = api.get(
    '/notes',
    {
      invitation: `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal`,
    },
    { accessToken }
  )
  const decisionResultsP = api.getAll(
    '/notes/edits',
    {
      invitation: nameDeletionDecisionInvitationId,
    },
    { accessToken, resultsKey: 'edits' }
  )
  const processLogsP = api.getAll(
    '/logs/process',
    { invitation: nameDeletionDecisionInvitationId },
    { accessToken, resultsKey: 'logs' }
  )

  const nameDeletionNotesP = Promise.all([
    nameRemovalNotesP,
    decisionResultsP,
    processLogsP,
  ]).then(([nameRemovalNotes, decisionResults, processLogs]) => {
    const sortedResult = [
      ...nameRemovalNotes.notes.filter((p) => p.content.status.value === 'Pending'),
      ...nameRemovalNotes.notes.filter((p) => p.content.status.value !== 'Pending'),
    ].map((p) => {
      const decisionEdit = decisionResults.find((q) => q.note.id === p.id)
      let processLogStatus = 'N/A'
      if (p.content.status.value !== 'Pending')
        processLogStatus =
          processLogs.find((q) => q.id === decisionEdit.id)?.status ?? 'running'
      return {
        ...p,
        processLogStatus,
        processLogUrl: decisionEdit
          ? `${process.env.API_URL}/logs/process?id=${decisionEdit.id}`
          : null,
      }
    })
    return sortedResult
  })

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NameDeletionList
        nameDeletionNotesP={nameDeletionNotesP}
        accessToken={accessToken}
        nameDeletionDecisionInvitationId={nameDeletionDecisionInvitationId}
      />
    </Suspense>
  )
}
