/* globals promptError: false */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getGroupVersion, prettyId } from '../../lib/utils'
import api from '../../lib/api-client'
import PaginationLinks from '../PaginationLinks'

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

  const getTitle = () => `Related Invitations ${totalCount ? `(${totalCount})` : ''}`

  useEffect(() => {
    loadRelatedInvitations()
  }, [])

  if (!relatedInvitations.length) return null
  return (
    <section>
      <h4>{getTitle()}</h4>
      <ul className="list-unstyled">
        {relatedInvitations.map(invitation => (
          <RelatedInvitationRow
            key={invitation.id}
            relatedInvitation={invitation}
            version={groupVersion}
          />
        ))}
      </ul>
      <PaginationLinks
        setCurrentPage={(pageNumber) => {
          setCurrentPage(pageNumber)
          loadRelatedInvitations(15, (pageNumber - 1) * 15)
        }}
        totalCount={totalCount}
        itemsPerPage={15}
        currentPage={currentPage}
        options={{ noScroll: true }}
      />
    </section>
  )
}

export default GroupRelatedInvitations
