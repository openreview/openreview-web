import { useCallback, useState } from 'react'
import Link from 'next/link'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const RelatedInvitationRow = ({ item }) => (
  <Link href={`/invitation/edit?id=${item.id}`}>{prettyId(item.id)}</Link>
)

const GroupRelatedInvitations = ({ group, accessToken }) => {
  const groupId = group.id
  const isV1Group = !group.domain
  const submissionName = group.details?.domain?.content?.submission_name?.value

  const [totalCount, setTotalCount] = useState(null)

  const loadRelatedInvitations = async (limit, offset) => {
    const queryParam = isV1Group
      ? {
          regex: `${groupId}/-/.*`,
          expired: true,
          type: 'all',
          limit,
          offset,
        }
      : {
          prefix: groupId.includes(submissionName) ? `${groupId}/.*` : `${groupId}/-/.*`,
          expired: true,
          trash: true,
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

  const loadItems = useCallback(loadRelatedInvitations, [groupId, accessToken])

  return (
    <EditorSection
      title={`Related Invitations ${totalCount ? `(${totalCount})` : ''}`}
      className="invitations"
    >
      <PaginatedList
        ListItem={RelatedInvitationRow}
        loadItems={loadItems}
        emptyMessage="No related invitations"
      />
    </EditorSection>
  )
}

export default GroupRelatedInvitations
