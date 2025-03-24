import { Suspense } from 'react'
import { headers } from 'next/headers'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import ProfileMergeList from './ProfileMergeList'
import api from '../../../../lib/api-client'

const profileMergeDecisionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge_Decision`
const profileMergeInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge`

export default async function ProfileMergeTab({ accessToken }) {
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const profileMergeNotesP = api.get(
    '/notes',
    {
      invitation: profileMergeInvitationId,
    },
    { accessToken, remoteIpAddress }
  )
  const decisionResultsP = api.getAll(
    '/notes/edits',
    {
      invitation: profileMergeDecisionInvitationId,
    },
    { accessToken, resultsKey: 'edits', remoteIpAddress }
  )
  const processLogsP = api.getAll(
    '/logs/process',
    { invitation: profileMergeDecisionInvitationId },
    { accessToken, resultsKey: 'logs', remoteIpAddress }
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
          ? `${process.env.API_V2_URL}/logs/process?id=${decisionEdit.id}`
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
