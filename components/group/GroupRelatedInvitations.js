/* globals promptError: false */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getGroupVersion, prettyId } from '../../lib/utils'
import api from '../../lib/api-client'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'

const RelatedInvitationRow = ({ relatedInvitation }) => (
  <li>
    <Link href={`/invitation/edit?id=${relatedInvitation.id}`}>
      <a>{prettyId(relatedInvitation.id)}</a>
    </Link>
  </li>
)

const GroupRelatedInvitations = ({ groupId, accessToken }) => {
  const [relatedInvitations, setRelatedInvitations] = useState([])
  const [totalCount, setTotalCount] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const groupVersion = getGroupVersion(groupId)

  const loadRelatedInvitations = async (limit = 15, offset = 0) => {
    try {
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
      setRelatedInvitations(result.invitations)
    } catch (error) {
      promptError(error.message)
    }
  }

  const renderRelatedInvitation = invitation => <RelatedInvitationRow
    key={invitation.id}
    relatedInvitation={invitation}
    version={groupVersion}
  />

  useEffect(() => {
    loadRelatedInvitations()
  }, [])

  if (!relatedInvitations.length) return null
  return (
    <EditorSection title={`Related Invitations ${totalCount ? `(${totalCount})` : ''}`}>
      <PaginatedList
        items={relatedInvitations}
        renderItem={renderRelatedInvitation}
        totalCount={totalCount}
        loadItems={loadRelatedInvitations}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </EditorSection>
  )
}

export default GroupRelatedInvitations
