'use client'

import { use } from 'react'
import EditBanner from '../../../components/EditBanner'
import { groupModeToggle } from '../../../lib/banner-links'
import CommonLayout from '../../CommonLayout'
import styles from '../Group.module.scss'
import { prettyId } from '../../../lib/utils'
import GroupGeneralInfo from '../../../components/group/info/GroupGeneralInfo'
import GroupMembersInfo from '../../../components/group/info/GroupMembersInfo'
import GroupSignedNotes from '../../../components/group/GroupSignedNotes'
import GroupChildGroups from '../../../components/group/GroupChildGroups'
import GroupRelatedInvitations from '../../../components/group/GroupRelatedInvitations'

export default function GroupInfo({ loadGroupP, accessToken }) {
  const { group, errorMessage } = use(loadGroupP)
  if (errorMessage) throw new Error(errorMessage)

  const editBanner = group.details?.writable ? (
    <EditBanner>{groupModeToggle('info', group.id)}</EditBanner>
  ) : null

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(group.id)}</h1>
        </div>
        <div>
          <GroupGeneralInfo group={group} />

          <GroupMembersInfo group={group} />

          <GroupSignedNotes group={group} accessToken={accessToken} />

          <GroupChildGroups groupId={group.id} accessToken={accessToken} />

          <GroupRelatedInvitations group={group} accessToken={accessToken} />
        </div>
      </div>
    </CommonLayout>
  )
}
