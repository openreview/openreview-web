/* globals promptMessage: false */
/* globals promptError: false */

import React from 'react'
import InvitationGeneral from './InvitationGeneral'
import InvitationReply, { InvitationReplyWithPreview } from './InvitationReply'
import InvitationCode from './InvitationCode'
import InvitationChildInvitations from './InvitationChildInvitations'
import { isSuperUser } from '../../lib/auth'
import Tabs from '../Tabs'

const InvitationEditor = ({ invitation, user, accessToken, loadInvitation }) => {
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
      />
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

export default InvitationEditor
