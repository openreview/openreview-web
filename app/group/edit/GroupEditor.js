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
import CommonLayout from '../../CommonLayout'
import styles from '../Group.module.scss'
import { prettyId } from '../../../lib/utils'
import EditBanner from '../../../components/EditBanner'
import { groupModeToggle } from '../../../lib/banner-links'

export default function GroupEditor({ loadGroupP, profileId, accessToken, isSuperUser }) {
  const { group, errorMessage } = use(loadGroupP)
  if (errorMessage) throw new Error(errorMessage)

  const router = useRouter()
  const reloadGroup = () => router.refresh()
  const editBanner = <EditBanner>{groupModeToggle('edit', group.id)}</EditBanner>

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(group.id)}</h1>
        </div>
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
      </div>
    </CommonLayout>
  )
}
