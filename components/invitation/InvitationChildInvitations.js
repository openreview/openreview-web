/* globals promptMessage: false */
/* globals promptError: false */

import { useCallback, useEffect, useState } from 'react'
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
        [invitation.apiVersion === 2 ? 'invitation' : 'super']: invitation.id,
        limit,
        offset,
        expired: true,
      },
      { accessToken, version: invitation.apiVersion }
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

export default InvitationChildInvitations
