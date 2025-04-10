import React from 'react'
import InvitationGeneral, { InvitationGeneralV2 } from './InvitationGeneral'
import InvitationReply, {
  InvitationReplyWithPreview,
  InvitationReplyV2,
} from './InvitationReply'
import InvitationCode, { InvitationCodeV2 } from './InvitationCode'
import InvitationChildInvitations, {
  InvitationChildInvitationsV2,
} from './InvitationChildInvitations'
import { isSuperUser } from '../../lib/auth'
import InvitationProcessFunctionsV2 from './InvitationProcessFunctions'
import ContentProcessFunctions from './ContentProcessFunctions'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'

const InvitationEditor = ({ invitation, user, accessToken, loadInvitation }) => {
  const profileId = user?.profile?.id
  const showProcessEditor = isSuperUser(user)

  if (!invitation) return null

  return (
    <div>
      <InvitationGeneral
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
      />
      <InvitationReplyWithPreview
        key={`${invitation.id}-edit`}
        invitation={invitation}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
      />
      <InvitationReply
        key={`${invitation.id}-replyForumViews`}
        invitation={invitation}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        replyField="replyForumViews"
      />
      <InvitationChildInvitations invitation={invitation} />
      <InvitationCode
        invitation={invitation}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        codeType="web"
      />
      {showProcessEditor && (
        <InvitationCode
          invitation={invitation}
          accessToken={accessToken}
          loadInvitation={loadInvitation}
          codeType="process"
        />
      )}
      {showProcessEditor && (
        <InvitationCode
          invitation={invitation}
          accessToken={accessToken}
          loadInvitation={loadInvitation}
          codeType="preprocess"
        />
      )}
    </div>
  )
}

export const InvitationEditorV2 = ({
  invitation,
  isMetaInvitation,
  user,
  accessToken,
  loadInvitation,
}) => {
  const profileId = user?.profile?.id

  const getReplyFieldByInvitationType = () => {
    if (invitation.edge) return 'edge'
    if (invitation.tag) return 'tag'
    if (invitation.message) return 'message'
    return 'edit'
  }

  const invitationTabsConfig = [
    {
      id: 'invitationGeneral',
      label: 'Invitation Info',
      sections: ['invitationGeneral'],
      default: true,
    },
    ...(isMetaInvitation
      ? [
          {
            id: 'invitationReplies',
            label: 'Replies',
            sections: ['invitationContentReply'],
          },
        ]
      : [
          {
            id: 'childInvitations',
            label: 'Child Invitations',
            sections: ['invitationChildInvitations'],
          },
          {
            id: 'invitationReplies',
            label: 'Replies',
            sections: [
              'invitationReply',
              'invitationReplyForumViews',
              'invitationContentReply',
            ],
          },
        ]),
    {
      id: 'contentProcessFunctions',
      label: 'Content Process Functions',
      sections: ['contentProcessFunctions'],
    },
    {
      id: 'processFunctions',
      label: 'Process Functions',
      sections: ['invitationProcessFunctions'],
    },
    {
      id: 'invitationCode',
      label: 'Code',
      sections: ['invitationCode'],
    },
  ]

  const renderSection = (sectionName) => {
    switch (sectionName) {
      case 'invitationGeneral':
        return (
          <InvitationGeneralV2
            key={sectionName}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            isMetaInvitation={isMetaInvitation}
          />
        )
      case 'invitationChildInvitations':
        return <InvitationChildInvitationsV2 key={sectionName} invitation={invitation} />
      case 'invitationReply':
        return (
          <InvitationReplyV2
            key={`${invitation.id}-${sectionName}`}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            replyField={getReplyFieldByInvitationType()}
          />
        )
      case 'invitationReplyForumViews':
        return (
          <InvitationReplyV2
            key={`${invitation.id}-${sectionName}`}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            replyField="replyForumViews"
          />
        )
      case 'invitationContentReply':
        return (
          <InvitationReplyV2
            key={`${invitation.id}-${sectionName}`}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            replyField="content"
            isMetaInvitation={isMetaInvitation}
          />
        )
      case 'contentProcessFunctions':
        return (
          <ContentProcessFunctions
            key={sectionName}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            isMetaInvitation={isMetaInvitation}
          />
        )
      case 'invitationProcessFunctions':
        return (
          <InvitationProcessFunctionsV2
            key={sectionName}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            isMetaInvitation={isMetaInvitation}
          />
        )
      case 'invitationCode':
        return (
          <InvitationCodeV2
            key={sectionName}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            codeType="web"
            isMetaInvitation={isMetaInvitation}
          />
        )
      default:
        return null
    }
  }

  if (!invitation) return null

  return (
    <div className={`invitationEditorTabsContainer${invitation.ddate ? ' deleted' : ''}`}>
      <Tabs>
        <TabList>
          {invitationTabsConfig.map((tabConfig) => (
            <Tab key={tabConfig.id} id={tabConfig.id} active={tabConfig.default}>
              {tabConfig.label}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {invitationTabsConfig.map((tabConfig) => (
            <TabPanel key={tabConfig.id} id={tabConfig.id}>
              {tabConfig.sections.map((section) => renderSection(section))}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </div>
  )
}

export default InvitationEditor
