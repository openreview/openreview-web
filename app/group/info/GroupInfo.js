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
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../../../components/Tabs'

const groupTabsConfig = [
  {
    id: 'groupInfo',
    label: 'Group Info',
    sections: ['groupGeneral', 'groupMembers'],
    default: true,
  },
  { id: 'signedNotes', label: 'Signed Notes', sections: ['groupSignedNotes'] },
  { id: 'childGroups', label: 'Child Groups', sections: ['groupChildGroups'] },
  {
    id: 'relatedInvitations',
    label: 'Related Invitations',
    sections: ['groupRelatedInvitations'],
  },
]

export default function GroupInfo({ loadGroupP, accessToken }) {
  const { group, errorMessage } = use(loadGroupP)
  if (errorMessage) throw new Error(errorMessage)

  const renderSection = (sectionName) => {
    switch (sectionName) {
      case 'groupGeneral':
        return <GroupGeneralInfo group={group} />
      case 'groupMembers':
        return <GroupMembersInfo group={group} />
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
      default:
        return null
    }
  }

  const editBanner = group.details?.writable ? (
    <EditBanner>{groupModeToggle('info', group.id)}</EditBanner>
  ) : null

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(group.id)}</h1>
        </div>
        <div className="groupInfoTabsContainer">
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
