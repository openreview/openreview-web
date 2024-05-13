import { useCallback, useState } from 'react'
import Link from 'next/link'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const WorflowInvitationRow = ({ item }) => (
  <Link href={`/invitation/edit?id=${item.id}`}>{prettyId(item.id)}</Link>
)

const WorkFlowInvitations = ({ group, accessToken }) => {
  const groupId = group.id
  const isV1Group = !group.domain
  const submissionName = group.content?.submission_name?.value

  const [totalCount, setTotalCount] = useState(null)

  const loadWorkflowInvitations = async (limit, offset) => {
    const queryParam =
     {
      prefix: `${groupId}/-/${submissionName}/.*`,
      expired: true,
      type: 'all',
      limit,
      offset,
    }

    const result = await api.get('/invitations', queryParam, {
      accessToken,
      ...(isV1Group && { version: 1 }),
    })

    if (result.count !== totalCount) {
      setTotalCount(result.count ?? 0)
    }
    return {
      items: result.invitations,
      count: result.count,
    }
  }

  const loadItems = useCallback(loadWorkflowInvitations, [groupId, accessToken])

  return (
    <EditorSection
      title={`Workflow Invitations (2)`}
      className="workflow"
    >
      <Link href={`/invitation/edit?id=${groupId}/-/${submissionName}`}>{prettyId(`${groupId}/-/${submissionName}`)}</Link>
      <ul>
        <li>{prettyId(`Deadlines`)} <Link href={`/invitation/edit?id=${groupId}/-/${submissionName}/Deadlines`}><u>{`Edit`}</u></Link></li>
        <li>{prettyId(`Submission_Form`)} <Link href={`/invitation/edit?id=${groupId}/-/${submissionName}/Submission_Form`}><u>{`Edit`}</u></Link></li>
        <li>{prettyId(`Notifications`)} <Link href={`/invitation/edit?id=${groupId}/-/${submissionName}/Notifications`}><u>{`Edit`}</u></Link></li>
      </ul>
      <Link href={`/invitation/edit?id=${groupId}/-/Post_${submissionName}`}>{prettyId(`${groupId}/-/Post_${submissionName}`)}</Link>

      {/* <dir>
      <PaginatedList
        ListItem={WorflowInvitationRow}
        loadItems={loadItems}
        emptyMessage="No workflow invitations"
      />
      </dir> */}
    </EditorSection>
  )
}

export default WorkFlowInvitations
