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

const InvitationAdmin = ({ invitation, user, accessToken, loadInvitation }) => {
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

export const InvitationAdminV2 = ({
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

  if (!invitation) return null

  return (
    <div className={invitation.ddate ? 'deleted' : ''}>
      <InvitationGeneralV2
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        isMetaInvitation={isMetaInvitation}
      />
      {!isMetaInvitation && (
        <>
          <InvitationChildInvitationsV2 invitation={invitation} />
          <InvitationReplyV2
            key={`${invitation.id}-edit`}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            replyField={getReplyFieldByInvitationType()}
          />
          <InvitationReplyV2
            key={`${invitation.id}-replyForumViews`}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            replyField="replyForumViews"
          />
        </>
      )}
      <InvitationReplyV2
        key={`${invitation.id}-content`}
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        replyField="content"
        isMetaInvitation={isMetaInvitation}
      />
      <ContentProcessFunctions
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        isMetaInvitation={isMetaInvitation}
      />
      <InvitationProcessFunctionsV2
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        isMetaInvitation={isMetaInvitation}
      />
      <InvitationCodeV2
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        codeType="web"
        isMetaInvitation={isMetaInvitation}
      />
    </div>
  )
}

export default InvitationAdmin
