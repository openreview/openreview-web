/* globals promptMessage: false */
/* globals promptError: false */

import { nanoid } from 'nanoid'
import React from 'react'
import InvitationGeneral from './InvitationGeneral'
import InvitationReply from './InvitationReply'
import InvitationCode from './InvitationCode'
import InvitationChildInvitations from './InvitationChildInvitations'
import { isSuperUser } from '../../lib/auth'

const InvitationEditor = ({
  invitation, user, accessToken, loadInvitation,
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
      />
      <InvitationReply
        key={nanoid()}
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        // eslint-disable-next-line no-nested-ternary
        replyField={invitation.apiVersion === 1 ? 'reply' : (invitation.edge ? 'edge' : 'edit')}
      />
      <InvitationReply
        key={nanoid()}
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        replyField="replyForumViews"
      />
      <InvitationChildInvitations
        invitation={invitation}
      />
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
