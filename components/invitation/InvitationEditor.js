/* globals promptMessage: false */
/* globals promptError: false */

import React from 'react'
import InvitationGeneral from './InvitationGeneral'
import InvitationReply, { InvitationReplyWithPreview } from './InvitationReply'
import InvitationCode from './InvitationCode'
import InvitationChildInvitations from './InvitationChildInvitations'
import { isSuperUser } from '../../lib/auth'

const InvitationEditor = ({
  invitation,
  isMetaInvitation,
  user,
  accessToken,
  loadInvitation,
}) => {
  const profileId = user?.profile?.id
  const showProcessEditor = invitation?.apiVersion === 2 || isSuperUser(user)

  if (!invitation) return null

  return (
    <div>
      <InvitationGeneral
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        isMetaInvitation={isMetaInvitation}
      />
      {!isMetaInvitation && (
        <>
          {invitation.apiVersion === 1 ? (
            <InvitationReplyWithPreview
              key={`${invitation.id}-edit`}
              invitation={invitation}
              accessToken={accessToken}
              loadInvitation={loadInvitation}
            />
          ) : (
            <InvitationReply
              key={`${invitation.id}-edit`}
              invitation={invitation}
              profileId={profileId}
              accessToken={accessToken}
              loadInvitation={loadInvitation}
              replyField={invitation.edge ? 'edge' : 'edit'}
            />
          )}
          <InvitationReply
            key={`${invitation.id}-replyForumViews`}
            invitation={invitation}
            profileId={profileId}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
            replyField="replyForumViews"
          />
          <InvitationChildInvitations invitation={invitation} />
        </>
      )}
      <InvitationCode
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        codeType="web"
        isMetaInvitation={isMetaInvitation}
      />
      {showProcessEditor && (
        <InvitationCode
          invitation={invitation}
          profileId={profileId}
          accessToken={accessToken}
          loadInvitation={loadInvitation}
          codeType="process"
          isMetaInvitation={isMetaInvitation}
        />
      )}
      {showProcessEditor && (
        <InvitationCode
          invitation={invitation}
          profileId={profileId}
          accessToken={accessToken}
          loadInvitation={loadInvitation}
          codeType="preprocess"
          isMetaInvitation={isMetaInvitation}
        />
      )}
    </div>
  )
}

export default InvitationEditor
