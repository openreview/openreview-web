/* globals promptError,promptMessage: false */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { prettyId } from '../../lib/utils'
import api from '../../lib/api-client'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'

const InvitationChildInvitations = ({ invitation, accessToken }) => {
  const isV1Invitation = invitation.apiVersion === 1
  const [totalCount, setTotalCount] = useState(null)

  const ChildInvitationRow = ({ item: childInvitation }) => (
    <li>
      <Link href={`/invitation/edit?id=${childInvitation.id}`}>
        <a>
          {prettyId(childInvitation.id)}
        </a>
      </Link>
    </li>
  )

  const loadChildInvitations = async (limit = 15, offset = 0) => {
    const result = await api.get('/invitations', {
      super: invitation.id,
      limit,
      offset,
    }, { accessToken, version: isV1Invitation ? 1 : 2 })
    setTotalCount(result.count)
    return {
      items: result.invitations,
      count: result.count,
    }
  }

  useEffect(() => {
    loadChildInvitations()
  }, [invitation])

  return (
    <EditorSection title={`Child Invitations ${totalCount ? `(${totalCount})` : ''}`} classes="subinvitations">
      <PaginatedList
        ListItem={ChildInvitationRow}
        loadItems={loadChildInvitations}
        emptyMessage="No child invitation"

      />
    </EditorSection>
  )
}

export default InvitationChildInvitations
