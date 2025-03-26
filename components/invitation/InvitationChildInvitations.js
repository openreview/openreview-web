/* globals promptMessage: false */
/* globals promptError: false */

import { useCallback, useState } from 'react'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const InvitationChildInvitations = ({ invitation, accessToken }) => {
  const [totalCount, setTotalCount] = useState(null)

  const loadChildInvitations = async (limit, offset) => {
    const { invitations, count } = await api.get(
      '/invitations',
      {
        super: invitation.id,
        limit,
        offset,
        expired: true,
      },
      { accessToken, version: 1 }
    )

    let translatedInvitations = []
    if (invitations?.length > 0) {
      translatedInvitations = invitations.map((inv) => ({
        id: inv.id,
        title: prettyId(inv.id),
        href: `/invitation/edit?id=${inv.id}`,
      }))
    }
    if (count !== totalCount) {
      setTotalCount(count ?? 0)
    }

    return {
      items: translatedInvitations,
      count: count ?? 0,
    }
  }

  const loadItems = useCallback(loadChildInvitations, [invitation, accessToken])

  return (
    <EditorSection
      title={`Child Invitations ${totalCount ? `(${totalCount})` : ''}`}
      className="subinvitations"
    >
      <PaginatedList
        loadItems={loadItems}
        emptyMessage="No child invitations"
        itemsPerPage={15}
      />
    </EditorSection>
  )
}

export const InvitationChildInvitationsV2 = ({ invitation, accessToken }) => {
  const [totalCount, setTotalCount] = useState(null)

  const loadChildInvitations = async (limit, offset) => {
    const { invitations, count } = await api.get(
      '/invitations',
      {
        invitation: invitation.id,
        limit,
        offset,
        expired: true,
      },
      { accessToken }
    )

    let translatedInvitations = []
    if (invitations?.length > 0) {
      translatedInvitations = invitations.map((inv) => ({
        id: inv.id,
        title: prettyId(inv.id),
        href: `/invitation/info?id=${inv.id}`,
      }))
    }
    if (count !== totalCount) {
      setTotalCount(count ?? 0)
    }

    return {
      items: translatedInvitations,
      count: count ?? 0,
    }
  }

  const loadItems = useCallback(loadChildInvitations, [invitation, accessToken])

  return (
    <EditorSection
      title={`Child Invitations ${totalCount ? `(${totalCount})` : ''}`}
      className="subinvitations"
    >
      <PaginatedList
        loadItems={loadItems}
        emptyMessage="No child invitations"
        itemsPerPage={15}
      />
    </EditorSection>
  )
}

export default InvitationChildInvitations
