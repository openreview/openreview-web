/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const InvitationChildInvitations = ({ invitation, accessToken }) => {
  const [totalCount, setTotalCount] = useState(null)

  const loadChildInvitations = async (limit, offset) => {
    const { invitations, count } = await api.get('/invitations', {
      super: invitation.id,
      limit,
      offset,
    }, { accessToken, version: invitation.apiVersion })

    let translatedInvitations = []
    if (invitations?.length > 0) {
      translatedInvitations = invitations.map(inv => ({
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

  useEffect(() => {
    loadChildInvitations(15, 0)
  }, [invitation])

  return (
    <EditorSection title={`Child Invitations ${totalCount ? `(${totalCount})` : ''}`} className="subinvitations">
      <PaginatedList
        loadItems={loadChildInvitations}
        emptyMessage="No child invitations"
        itemsPerPage={15}
      />
    </EditorSection>
  )
}

export default InvitationChildInvitations
