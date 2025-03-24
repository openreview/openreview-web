'use client'

import { use } from 'react'
import EditorSection from '../../../components/EditorSection'
import {
  InvitationGeneralView,
  InvitationGeneralViewV2,
} from '../../../components/invitation/InvitationGeneral'
import InvitationReply, {
  InvitationReplyV2,
} from '../../../components/invitation/InvitationReply'
import CommonLayout from '../../CommonLayout'
import styles from '../Invitation.module.scss'
import { prettyId } from '../../../lib/utils'
import { invitationModeToggle } from '../../../lib/banner-links'
import EditBanner from '../../../components/EditBanner'

const getReplyFieldByInvitationType = (invitation) => {
  if (!invitation) return 'edit'
  if (invitation.edge) return 'edge'
  if (invitation.tag) return 'tag'
  if (invitation.message) return 'message'
  return 'edit'
}

export default function InvitationInfo({ loadInvitationP }) {
  const { invitation, errorMessage } = use(loadInvitationP)
  if (errorMessage) throw new Error(errorMessage)

  const renderInvtationReply = () => {
    if (invitation?.edit === true) return null

    if (invitation?.apiVersion === 1) {
      return (
        <>
          <InvitationReply invitation={invitation} replyField="reply" readOnly={true} />

          <InvitationReply
            invitation={invitation}
            replyField="replyForumViews"
            readOnly={true}
          />
        </>
      )
    }
    return (
      <>
        <InvitationReplyV2
          invitation={invitation}
          replyField={getReplyFieldByInvitationType(invitation)}
          readOnly={true}
        />

        <InvitationReplyV2
          invitation={invitation}
          replyField="replyForumViews"
          readOnly={true}
        />
      </>
    )
  }

  const editBanner = invitation.details?.writable ? (
    <EditBanner>{invitationModeToggle('info', invitation.id)}</EditBanner>
  ) : null

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.invitation}>
        <div id="header">
          <h1>{prettyId(invitation.id)}</h1>
        </div>
        <div>
          <EditorSection title="General Info" className="general">
            {invitation?.apiVersion === 1 ? (
              <InvitationGeneralView invitation={invitation} showEditButton={false} />
            ) : (
              <InvitationGeneralViewV2 invitation={invitation} showEditButton={false} />
            )}
          </EditorSection>

          {renderInvtationReply()}
        </div>
      </div>
    </CommonLayout>
  )
}
