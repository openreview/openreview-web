import GroupGeneral from './GroupGeneral'
import GroupMembers from './GroupMembers'
import GroupSignedNotes from './GroupSignedNotes'
import GroupChildGroups from './GroupChildGroups'
import GroupRelatedInvitations from './GroupRelatedInvitations'
import GroupUICode from './GroupUICode'

const GroupEditor = ({ group, isSuperUser, accessToken, reloadGroup }) => {
  if (!group) return null

  return (
    <div>
      <GroupGeneral
        group={group}
        isSuperUser={isSuperUser}
        accessToken={accessToken}
        reloadGroup={reloadGroup}
      />
      <GroupMembers group={group} accessToken={accessToken} />
      <GroupSignedNotes groupId={group.id} accessToken={accessToken} />
      <GroupChildGroups groupId={group.id} accessToken={accessToken} />
      <GroupRelatedInvitations groupId={group.id} accessToken={accessToken} />
      <GroupUICode
        group={group}
        fieldName="web"
        accessToken={accessToken}
        reloadGroup={reloadGroup}
      />
      <GroupUICode
        group={group}
        fieldName="webComponent"
        accessToken={accessToken}
        reloadGroup={reloadGroup}
      />
    </div>
  )
}

export default GroupEditor
