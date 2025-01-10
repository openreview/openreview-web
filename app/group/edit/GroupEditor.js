'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import GroupGeneral from '../../../components/group/GroupGeneral'
import GroupMembers from '../../../components/group/GroupMembers'
import GroupContent from '../../../components/group/GroupContent'
import GroupContentScripts from '../../../components/group/GroupContentScripts'
import GroupSignedNotes from '../../../components/group/GroupSignedNotes'
import GroupChildGroups from '../../../components/group/GroupChildGroups'
import GroupRelatedInvitations from '../../../components/group/GroupRelatedInvitations'
import GroupUICode from '../../../components/group/GroupUICode'

export default function GroupEditor({ loadGroupP, profileId, accessToken, isSuperUser }) {
  const group = use(loadGroupP)
  const router = useRouter()
  const reloadGroup = () => router.refresh()
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
      {group.invitations && (
        <GroupContentScripts
          key={`${group.id}-content-scripts`}
          group={group}
          profileId={profileId}
          accessToken={accessToken}
          reloadGroup={reloadGroup}
        />
      )}
      <GroupSignedNotes group={group} accessToken={accessToken} />
      <GroupChildGroups groupId={group.id} accessToken={accessToken} />
      <GroupRelatedInvitations group={group} accessToken={accessToken} />
      <GroupUICode
        group={group}
        profileId={profileId}
        accessToken={accessToken}
        reloadGroup={reloadGroup}
      />
    </div>
  )
}
