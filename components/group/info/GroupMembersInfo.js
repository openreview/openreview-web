import EditorSection from '../../EditorSection'
import PaginatedList from '../../PaginatedList'
import { urlFromGroupId } from '../../../lib/utils'

const GroupMembersInfo = ({ group }) => {
  const loadMembers = (limit, offset) => ({
    items: group.members.slice(offset, offset + limit).map(member => ({
      id: member,
      title: member,
      href: urlFromGroupId(member, true),
    })),
    count: group.members.length,
  })

  const memberCount = group.members?.length > 0 ? `(${group.members.length})` : ''

  return (
    <EditorSection title={`Group Members ${memberCount}`} className="members" >
      <PaginatedList
        loadItems={loadMembers}
        emptyMessage="No members to display"
      />
    </EditorSection>
  )
}

export default GroupMembersInfo
