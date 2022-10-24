import GroupGeneral from './GroupGeneral'
import GroupMembers from './GroupMembers'
import GroupSignedNotes from './GroupSignedNotes'
import GroupChildGroups from './GroupChildGroups'
import GroupRelatedInvitations from './GroupRelatedInvitations'
import GroupUICode from './GroupUICode'
import GroupContent from './GroupContent'

const GroupEditor = ({ group, isSuperUser, profileId, accessToken, reloadGroup }) => {
  if (!group) return null

  return (
    <div>
      <GroupGeneral
        group={group}
        profileId={profileId}
        isSuperUser={isSuperUser}
        accessToken={accessToken}
        reloadGroup={reloadGroup}
      />
      <GroupMembers group={group} accessToken={accessToken} reloadGroup={reloadGroup} />
      {group.invitations && (
        <GroupContent
          group={group}
          profileId={profileId}
          accessToken={accessToken}
          reloadGroup={reloadGroup}
        />
      )}
      <GroupSignedNotes groupId={group.id} accessToken={accessToken} />
      <GroupChildGroups groupId={group.id} accessToken={accessToken} />
      <GroupRelatedInvitations groupId={group.id} accessToken={accessToken} />
      <GroupUICode group={group} profileId={profileId} accessToken={accessToken} reloadGroup={reloadGroup} />
    </div>
  )
}

export default GroupEditor
