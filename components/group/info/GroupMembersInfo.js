import EditorSection from '../../EditorSection'
import PaginatedList from '../../PaginatedList'
import { urlFromGroupId } from '../../../lib/utils'

const GroupMembersInfo = ({ group }) => {
  const loadMembers = (limit, offset) => ({
    items: group.members.slice(offset, offset + limit).map((member) => ({
      id: member,
      title: member,
      href: urlFromGroupId(member, false),
    })),
    count: group.members.length,
  })

  const searchMembers = (term, limit, offset) => {
    const termLower = term.toLowerCase()
    const filteredMembers = group.members.filter((member) => {
      const memberLower = member.toLowerCase()
      return (
        memberLower.includes(termLower) || memberLower.replace(/_|-/g, ' ').includes(termLower)
      )
    })
    return {
      items: filteredMembers.slice(offset, offset + limit).map((member) => ({
        id: member,
        title: member,
        href: urlFromGroupId(member, false),
      })),
      count: filteredMembers.length,
    }
  }

  const memberCount = group.members?.length ?? 0

  return (
    <EditorSection
      title={`Group Members ${memberCount > 0 ? ` (${memberCount})` : ''}`}
      className="members"
    >
      <PaginatedList
        loadItems={loadMembers}
        searchItems={memberCount > 1 ? searchMembers : null}
        emptyMessage="No members to display"
        searchPlaceholder="Search members by username"
        itemsPerPage={20}
      />
    </EditorSection>
  )
}

export default GroupMembersInfo
