/* globals promptMessage: false */
/* globals promptError: false */

import React from 'react'
import InvitationGeneral, { InvitationGeneralV2 } from './InvitationGeneral'
import InvitationReply, { InvitationReplyV2 } from './InvitationReply'
import InvitationCode, { InvitationCodeV2 } from './InvitationCode'
import InvitationChildInvitations, {
  InvitationChildInvitationsV2,
} from './InvitationChildInvitations'
import { isSuperUser } from '../../lib/auth'

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
      <>
        <InvitationReply
          key={`${invitation.id}-edit`}
          invitation={invitation}
          accessToken={accessToken}
          loadInvitation={loadInvitation}
          replyField="reply"
        />
        <InvitationReply
          key={`${invitation.id}-replyForumViews`}
          invitation={invitation}
          accessToken={accessToken}
          loadInvitation={loadInvitation}
          replyField="replyForumViews"
        />
        <InvitationChildInvitations invitation={invitation} />
      </>
      <InvitationCode
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        codeType="web"
      />
      {showProcessEditor && (
        <InvitationCode
          invitation={invitation}
          profileId={profileId}
          accessToken={accessToken}
          loadInvitation={loadInvitation}
          codeType="process"
        />
      )}
      {showProcessEditor && (
        <InvitationCode
          invitation={invitation}
          profileId={profileId}
          accessToken={accessToken}
          loadInvitation={loadInvitation}
          codeType="preprocess"
        />
      )}
    </div>
  )
}

export const InvitationEditorV2 = (
  invitation,
  isMetaInvitation,
  user,
  accessToken,
  loadInvitation
) => {
  const profileId = user?.profile?.id

  if (!invitation) return null

  return (
    <div>
      <InvitationGeneralV2
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        isMetaInvitation={isMetaInvitation}
      />
      {!isMetaInvitation && (
        <>
          <InvitationReplyV2
            key={`${invitation.id}-edit`}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            replyField={invitation.edge ? 'edge' : 'edit'}
          />
          <InvitationReplyV2
            key={`${invitation.id}-replyForumViews`}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            replyField="replyForumViews"
          />
          <InvitationChildInvitationsV2 invitation={invitation} />
        </>
      )}
      <InvitationCodeV2
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        codeType="web"
        isMetaInvitation={isMetaInvitation}
      />
      <InvitationCodeV2
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        codeType="process"
        isMetaInvitation={isMetaInvitation}
      />
      <InvitationCodeV2
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        codeType="preprocess"
        isMetaInvitation={isMetaInvitation}
      />
    </div>
  )
}

export default InvitationEditor
