import GroupGeneral from './GroupGeneral'
import GroupMembers from './GroupMembers'
import GroupSignedNotes from './GroupSignedNotes'
import GroupChildGroups from './GroupChildGroups'
import GroupRelatedInvitations from './GroupRelatedInvitations'
import GroupUICode from './GroupUICode'
import GroupContent from './GroupContent'
import GroupContentScripts from './GroupContentScripts'
import WorkFlowInvitations from './WorkflowInvitations'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'

const GroupEditor = ({ group, isSuperUser, profileId, accessToken, reloadGroup }) => {
  if (!group) return null
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
    {
      id: 'workflowInvitations',
      label: 'Workflow Step Timeline',
      sections: ['workflowInvitations'],
    },
  ]
  const renderSection = (sectionName) => {
    switch (sectionName) {
      case 'groupGeneral':
        return (
          <GroupGeneral
            group={group}
            profileId={profileId}
            isSuperUser={isSuperUser}
            accessToken={accessToken}
            reloadGroup={reloadGroup}
          />
        )
      case 'groupMembers':
        return (
          <GroupMembers group={group} accessToken={accessToken} reloadGroup={reloadGroup} />
        )
      case 'groupContent':
        return (
          group.invitations && (
            <GroupContent
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
              key={`${group.id}-content-scripts`}
              group={group}
              profileId={profileId}
              accessToken={accessToken}
              reloadGroup={reloadGroup}
            />
          )
        )
      case 'groupSignedNotes':
        return <GroupSignedNotes group={group} accessToken={accessToken} />
      case 'groupChildGroups':
        return <GroupChildGroups groupId={group.id} accessToken={accessToken} />
      case 'groupRelatedInvitations':
        return <GroupRelatedInvitations group={group} accessToken={accessToken} />
      case 'workflowInvitations':
        return <WorkFlowInvitations group={group} accessToken={accessToken} />
      case 'groupUICode':
        return (
          <GroupUICode
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
  return (
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
  )
}

export default GroupEditor
