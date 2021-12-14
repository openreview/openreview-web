import Link from 'next/link'
import { urlFromGroupId } from '../../../lib/utils'
import EditorSection from '../../EditorSection'
import PaginatedList from '../../PaginatedList'

const GroupMembersInfo = ({ group }) => {
  const hasMembers = group.members?.length > 0

  const loadMembers = (limit, offset) => ({
    items: group.members.slice(offset, offset + limit),
    count: group.members.length,
  })

  return (
    <EditorSection title={hasMembers ? `Group Members (${group.members.length})` : 'Group Members'} className="members" >
      <PaginatedList
        loadItems={loadMembers}
        ListItem={({ item }) => <Link href={urlFromGroupId(item, true)}>
          <a>{item}</a>
        </Link>}
        emptyMessage="No members to display"
      />
    </EditorSection>
  )
}

export default GroupMembersInfo
