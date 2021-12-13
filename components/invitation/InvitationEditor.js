/* globals promptError,promptMessage,moment: false */
import { nanoid } from 'nanoid'
import React from 'react'
import { prettyId } from '../../lib/utils'
import { isSuperUser } from '../../lib/auth'
import InvitationGeneral from './InvitationGeneral'
import InvitationReply from './InvitationReply'
import InvitationCode from './InvitationCode'
import InvitationChildInvitations from './InvitationChildInvitations'

const InvitationEditor = ({
  invitation, user, accessToken, loadInvitation,
}) => {
  const profileId = user?.profile?.id
  const showProcessEditor = invitation?.apiVersion === 2 || isSuperUser(user)
  if (!invitation) return null
  return (
    <>
      <div id="header">
        <h1>{prettyId(invitation.id)}</h1>
      </div>
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
        // eslint-disable-next-line no-nested-ternary
        replyField="replyForumViews"
      />
      <InvitationCode
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        codeType="web"
      />
      {
        showProcessEditor
        && (
          <>
            <InvitationCode
              invitation={invitation}
              profileId={profileId}
              accessToken={accessToken}
              loadInvitation={loadInvitation}
              codeType="process"
            />
            <InvitationCode
              invitation={invitation}
              profileId={profileId}
              accessToken={accessToken}
              loadInvitation={loadInvitation}
              codeType="preprocess"
            />

          </>
        )
      }
      <InvitationChildInvitations invitation={invitation} />
    </>
  )
}

export default InvitationEditor
