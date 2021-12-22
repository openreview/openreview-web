import { useState } from 'react'
import Link from 'next/link'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'
import api from '../../lib/api-client'
import { getGroupVersion, prettyId } from '../../lib/utils'

const RelatedInvitationRow = ({ item }) => (
  <Link href={`/invitation/edit?id=${item.id}`}>
    <a>{prettyId(item.id)}</a>
  </Link>
)

const GroupRelatedInvitations = ({ groupId, accessToken }) => {
  const [totalCount, setTotalCount] = useState(null)
  const version = getGroupVersion(groupId)

  const loadRelatedInvitations = async (limit, offset) => {
    const result = await api.get('/invitations', {
      regex: `${groupId}/-/.*`,
      expired: true,
      type: 'all',
      limit,
      offset,
    }, { accessToken, version })

    if (result.count !== totalCount) {
      setTotalCount(result.count ?? 0)
    }
    return {
      items: result.invitations,
      count: result.count,
    }
  }

  return (
    <EditorSection title={`Related Invitations ${totalCount ? `(${totalCount})` : ''}`} className="invitations">
      <PaginatedList
        ListItem={RelatedInvitationRow}
        loadItems={loadRelatedInvitations}
        emptyMessage="No related invitations"
      />
    </EditorSection>
  )
}

export default GroupRelatedInvitations
