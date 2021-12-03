/* globals promptMessage,promptError: false */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getGroupVersion, prettyId, urlFromGroupId } from '../../lib/utils'
import PaginationLinks from '../PaginationLinks'
import api from '../../lib/api-client'
import EditorSection from '../EditorSection'

const ChildGroupRow = ({ childGroup }) => (
  <li>
    <Link href={urlFromGroupId(childGroup.id, true)}>
      <a>
        {prettyId(childGroup.id)}
      </a>
    </Link>
  </li>
)

const GroupChildGroups = ({ groupId, accessToken }) => {
  const [childGroups, setChildGroups] = useState([])
  const [totalCount, setTotalCount] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const groupVersion = getGroupVersion(groupId)

  const loadChildGroups = async (limit = 15, offset = 0) => {
    try {
      const result = await api.get('/groups', { regex: `${groupId}/[^/]+$`, limit, offset }, { accessToken, version: groupVersion })
      setTotalCount(result.count)
      setChildGroups(result.groups)
    } catch (error) {
      promptError(error.message)
    }
  }

  const getTitle = () => `Child Groups ${totalCount ? `(${totalCount})` : ''}`

  useEffect(() => {
    loadChildGroups()
  }, [])

  if (!childGroups.length) return null
  return (
    <EditorSection getTitle={getTitle}>
      <ul className="list-unstyled">
        {childGroups.map(childGroup => (
          <ChildGroupRow
            key={childGroup.id}
            childGroup={childGroup}
            version={groupVersion}
          />
        ))}
      </ul>
      <PaginationLinks
        setCurrentPage={(pageNumber) => { setCurrentPage(pageNumber); loadChildGroups(15, (pageNumber - 1) * 15) }}
        totalCount={totalCount}
        itemsPerPage={15}
        currentPage={currentPage}
        options={{ noScroll: true }}
      />
    </EditorSection>
  )
}

export default GroupChildGroups
