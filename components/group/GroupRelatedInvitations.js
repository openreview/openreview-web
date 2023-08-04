import { useCallback, useState } from 'react'
import Link from 'next/link'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const RelatedInvitationRow = ({ item }) => (
  <Link href={`/invitation/edit?id=${item.id}`}>
    {prettyId(item.id)}
  </Link>
)

const GroupRelatedInvitations = ({ groupId, accessToken }) => {
  const [totalCount, setTotalCount] = useState(null)

  const loadRelatedInvitations = async (limit, offset) => {
    const result = await api.getCombined(
      '/invitations',
      {
        regex: `${groupId}/-/.*`,
        expired: true,
        type: 'all',
        limit,
        offset,
      },
      {
        prefix: `${groupId}/-/.*`,
        expired: true,
        type: 'all',
        limit,
        offset,
      },
      { accessToken }
    )

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
