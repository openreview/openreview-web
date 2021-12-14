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
  const [currentPage, setCurrentPage] = useState(1)
  const [childInvitations, setChildInvitations] = useState([])

  const ChildInvitationRow = ({ childInvitation }) => (
    <li>
      <Link href={`/invitation/edit?id=${childInvitation.id}`}>
        <a>
          {prettyId(childInvitation.id)}
        </a>
      </Link>
    </li>
  )

  const loadChildInvitations = async (limit = 15, offset = 0) => {
    try {
      const result = await api.get('/invitations', {
        super: invitation.id,
        limit,
        offset,
      }, { accessToken, version: isV1Invitation ? 1 : 2 })
      setTotalCount(result.count)
      setChildInvitations(result.invitations)
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
  }

  useEffect(() => {
    loadChildInvitations()
  }, [invitation])

  const renderChildInvitation = childInvitation => <ChildInvitationRow
    key={childInvitation.id}
    childInvitation={childInvitation}
  />

  if (!childInvitations.length) return null
  return (
    <EditorSection title={`Child Invitations ${totalCount ? `(${totalCount})` : ''}`}>
      <PaginatedList
        items={childInvitations}
        renderItem={renderChildInvitation}
        totalCount={totalCount}
        loadItems={loadChildInvitations}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </EditorSection>
  )
}

export default InvitationChildInvitations
