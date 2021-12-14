import { nanoid } from 'nanoid'
import GroupGeneral from './GroupGeneral'
import GroupMembers from './GroupMembers'
import GroupSignedNotes from './GroupSignedNotes'
import GroupChildGroups from './GroupChildGroups'
import GroupRelatedInvitations from './GroupRelatedInvitations'
import GroupUICode from './GroupUICode'

const GroupEditor = ({
  group, isSuperUser, accessToken, reloadGroup,
}) => {
  if (!group) return null

  return (
    <div>
      <GroupGeneral
        key={`${group.id}-info`}
        group={group}
        isSuperUser={isSuperUser}
        accessToken={accessToken}
        reloadGroup={reloadGroup}
      />
      <GroupMembers
        key={`${group.id}-members`}
        group={group}
        accessToken={accessToken}
      />
      <GroupSignedNotes
        key={`${group.id}-signednotes`}
        groupId={group.id}
        accessToken={accessToken}
      />
      <GroupChildGroups
        key={`${group.id}-childgroups`}
        groupId={group.id}
        accessToken={accessToken}
      />
      <GroupRelatedInvitations
        key={`${group.id}-invitations`}
        groupId={group.id}
        accessToken={accessToken}
      />
      <GroupUICode
        key={nanoid()}
        group={group}
        accessToken={accessToken}
        reloadGroup={reloadGroup}
      />
    </div>
  )
}

export default GroupEditor
