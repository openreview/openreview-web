import Link from 'next/link'
import { useState } from 'react'
import { urlFromGroupId } from '../../../lib/utils'
import EditorSection from '../../EditorSection'
import PaginatedList from '../../PaginatedList'

const GroupMembersInfo = ({ group }) => {
  const hasMembers = group.members?.length > 0
  const [membersToDisplay, setMembersToDisplay] = useState(hasMembers ? group.members.slice(0, 15) : [])
  const [currentPage, setCurrentPage] = useState(1)

  const loadMembers = (limit, offset) => {
    setMembersToDisplay(group.members.slice(offset, offset + limit))
  }

  return (
    <EditorSection title={hasMembers ? `Group Members (${group.members.length})` : 'Group Members'} classes="members" >
      {hasMembers ? (
        <PaginatedList
          items={membersToDisplay}
          renderItem={member => (
            <li key={member}>
              <Link href={urlFromGroupId(member, true)}>
                <a>{member}</a>
              </Link>
            </li>)}
          totalCount={group.members.length}
          setCurrentPage={setCurrentPage}
          loadItems={loadMembers}
          currentPage={currentPage}
        />
      ) : <p className="empty-message">No members to display</p>}
    </EditorSection>
  )
}

export default GroupMembersInfo
