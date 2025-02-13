import { Suspense } from 'react'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import ProfileMergeList from './ProfileMergeList'
import api from '../../../../lib/api-client'

const profileMergeDecisionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge_Decision`
const profileMergeInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge`

export default async function ProfileMergeTab({ accessToken }) {
  const profileMergeNotesP = api.get(
    '/notes',
    {
      invitation: profileMergeInvitationId,
    },
    { accessToken }
  )
  const decisionResultsP = api.getAll(
    '/notes/edits',
    {
      invitation: profileMergeDecisionInvitationId,
    },
    { accessToken, resultsKey: 'edits' }
  )
  const processLogsP = api.getAll(
    '/logs/process',
    { invitation: profileMergeDecisionInvitationId },
    { accessToken, resultsKey: 'logs' }
  )

  const profileMergeRequestsP = Promise.all([
    profileMergeNotesP,
    decisionResultsP,
    processLogsP,
  ]).then(([profileMergeNotesResults, decisionResults, processLogs]) => {
    const sortedResult = [
      ...profileMergeNotesResults.notes.filter((p) => p.content.status.value === 'Pending'),
      ...profileMergeNotesResults.notes.filter((p) => p.content.status.value !== 'Pending'),
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
      <ProfileMergeList
        accessToken={accessToken}
        profileMergeRequestsP={profileMergeRequestsP}
      />
    </Suspense>
  )
}
