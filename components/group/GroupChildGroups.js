import { useCallback, useState } from 'react'
import { prettyId, urlFromGroupId } from '../../lib/utils'
import api from '../../lib/api-client'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'

const GroupChildGroups = ({ groupId, accessToken }) => {
  const [totalCount, setTotalCount] = useState(0)

  const loadChildGroups = async (limit, offset) => {
    const { groups, count } = await api.get(
      '/groups',
      {
        parent: groupId,
        limit,
        offset,
      },
      { accessToken }
    )

    let translatedGroups = []
    if (groups?.length > 0) {
      translatedGroups = groups.map((group) => ({
        id: group.id,
        title: prettyId(group.id),
        href: urlFromGroupId(group.id, true),
      }))
    }
    if (count !== totalCount) {
      setTotalCount(count ?? 0)
    }

    return {
      items: translatedGroups,
      count: count ?? 0,
    }
  }

  const loadItems = useCallback(loadChildGroups, [groupId, accessToken])

  return (
    <EditorSection
      title={`Child Groups ${totalCount ? `(${totalCount})` : ''}`}
      className="children"
    >
      <PaginatedList loadItems={loadItems} emptyMessage="No child groups" itemsPerPage={15} />
    </EditorSection>
  )
}

export default GroupChildGroups
