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
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../../../components/Tabs'
import WorkFlowInvitations from '../../../components/group/WorkflowInvitations'

export default function GroupEditor({ loadGroupP, profileId, accessToken, isSuperUser }) {
  const { group, errorMessage } = use(loadGroupP)
  if (errorMessage) throw new Error(errorMessage)
  const router = useRouter()
  const reloadGroup = () => router.refresh()

  const groupTabsConfig = [
    {
      id: 'groupInfo',
      label: 'Group Info',
      sections: [
        'groupGeneral',
        'groupMembers',
        'groupContent',
        'groupContentScripts',
        'groupUICode',
      ],
      default: true,
    },
    { id: 'signedNotes', label: 'Signed Notes', sections: ['groupSignedNotes'] },
    { id: 'childGroups', label: 'Child Groups', sections: ['groupChildGroups'] },
    {
      id: 'relatedInvitations',
      label: 'Related Invitations',
      sections: ['groupRelatedInvitations'],
    },
    ...(group.id === group.domain
      ? [
          {
            id: 'workflowInvitations',
            label: 'Workflow Step Timeline',
            sections: ['workflowInvitations'],
            default: true,
          },
        ]
      : []),
  ]

  const renderSection = (sectionName) => {
    switch (sectionName) {
      case 'groupGeneral':
        return (
          <GroupGeneral
            key={sectionName}
            group={group}
            profileId={profileId}
            isSuperUser={isSuperUser}
            accessToken={accessToken}
            reloadGroup={reloadGroup}
          />
        )
      case 'groupMembers':
        return (
          <GroupMembers
            key={sectionName}
            group={group}
            accessToken={accessToken}
            reloadGroup={reloadGroup}
          />
        )
      case 'groupContent':
        return (
          group.invitations && (
            <GroupContent
              key={sectionName}
              group={group}
              profileId={profileId}
              accessToken={accessToken}
              reloadGroup={reloadGroup}
            />
          )
        )
      case 'groupContentScripts':
        return (
          group.invitations && (
            <GroupContentScripts
              key={sectionName}
              group={group}
              profileId={profileId}
              accessToken={accessToken}
              reloadGroup={reloadGroup}
            />
          )
        )
      case 'groupSignedNotes':
        return <GroupSignedNotes key={sectionName} group={group} accessToken={accessToken} />
      case 'groupChildGroups':
        return (
          <GroupChildGroups key={sectionName} groupId={group.id} accessToken={accessToken} />
        )
      case 'groupRelatedInvitations':
        return (
          <GroupRelatedInvitations key={sectionName} group={group} accessToken={accessToken} />
        )
      case 'workflowInvitations':
        return (
          <WorkFlowInvitations key={sectionName} group={group} accessToken={accessToken} />
        )
      case 'groupUICode':
        return (
          <GroupUICode
            key={sectionName}
            group={group}
            profileId={profileId}
            accessToken={accessToken}
            reloadGroup={reloadGroup}
          />
        )
      default:
        return null
    }
  }

  const editBanner = <EditBanner>{groupModeToggle('edit', group.id)}</EditBanner>

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(group.id)}</h1>
        </div>
        <div className="groupEditorTabsContainer">
          <Tabs>
            <TabList>
              {groupTabsConfig.map((tabConfig) => (
                <Tab key={tabConfig.id} id={tabConfig.id} active={tabConfig.default}>
                  {tabConfig.label}
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              {groupTabsConfig.map((tabConfig) => (
                <TabPanel key={tabConfig.id} id={tabConfig.id}>
                  {tabConfig.sections.map((section) => renderSection(section))}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </div>
      </div>
    </CommonLayout>
  )
}
