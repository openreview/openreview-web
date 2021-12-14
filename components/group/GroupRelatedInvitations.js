import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getGroupVersion, prettyId } from '../../lib/utils'
import api from '../../lib/api-client'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'

const RelatedInvitationRow = ({ item }) => (
    <Link href={`/invitation/edit?id=${item.id}`}>
      <a>{prettyId(item.id)}</a>
    </Link>
)

const GroupRelatedInvitations = ({ groupId, accessToken }) => {
  const [totalCount, setTotalCount] = useState(null)
  const groupVersion = getGroupVersion(groupId)

  const loadRelatedInvitations = async (limit = 15, offset = 0) => {
    const result = await api.get(
      '/invitations',
      {
        regex: `${groupId}/-/.*`,
        expired: true,
        type: 'all',
        limit,
        offset,
      },
      { accessToken, version: groupVersion },
    )
    setTotalCount(result.count)
    return {
      items: result.invitations,
      count: result.count,
    }
  }

  useEffect(() => {
    loadRelatedInvitations()
  }, [])

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
