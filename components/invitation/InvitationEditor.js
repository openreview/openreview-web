/* globals promptMessage: false */
/* globals promptError: false */

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
import InvitationContentEditor from '../InvitationContentEditor'

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
  let contentFields = null
  let isNested = false

  const getReplyFieldByInvitationType = () => {
    if (invitation.edge) return 'edge'
    if (invitation.tag) return 'tag'
    if (invitation.message) return 'message'
    return 'edit'
  }

  if (!invitation) return null

  const nestedContent = invitation.edit.invitation?.edit?.note?.content
  contentFields = invitation.edit.note?.content ?? nestedContent
  isNested = !!nestedContent

  console.log(invitation)

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

      {(invitation?.edit?.note?.content ||
       invitation?.edit?.invitation?.edit?.note.content) && (
        <InvitationContentEditor
        contentFields={contentFields} // Pass the actual content fields
        isNested={isNested} // Set based on the context
        onContentChange={(newContent) => {
          // Handle content change
          console.log('Content changed:', newContent)
        }}
      />
      )}
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

export default InvitationEditor
