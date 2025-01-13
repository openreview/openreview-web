'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import CommonLayout from '../../CommonLayout'
import styles from '../Invitation.module.scss'
import { prettyId } from '../../../lib/utils'
import EditBanner from '../../../components/EditBanner'
import { invitationModeToggle } from '../../../lib/banner-links'
import InvitationEditorV1, {
  InvitationEditorV2,
} from '../../../components/invitation/InvitationEditor'

export default function InvitationEditor({ loadInvitationP, user, accessToken }) {
  const invitation = use(loadInvitationP)
  const router = useRouter()
  const reloadInvitation = () => router.refresh()
  const isMetaInvitation = invitation?.edit === true

  const editBanner = <EditBanner>{invitationModeToggle('edit', invitation.id)}</EditBanner>
  const getHeaderText = () => {
    if (!invitation) return ''
    let type = ''
    if (isMetaInvitation) {
      type = '(Meta Invitation)'
    } else if (invitation.edit?.invitation) {
      type = '(Invitation of Invitation)'
    } else if (invitation.edit?.note) {
      type = '(Invitation of Note)'
    } else if (invitation.edit?.edge) {
      type = '(Invitation of Edge)'
    } else if (invitation.edit?.tag) {
      type = '(Invitation of Tag)'
    }

    return `${prettyId(invitation?.id)} ${type}`
  }

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.invitation}>
        <div id="header">
          <h1>{getHeaderText()}</h1>
        </div>
        {invitation?.apiVersion === 1 ? (
          <InvitationEditorV1
            invitation={invitation}
            user={user}
            accessToken={accessToken}
            loadInvitation={reloadInvitation}
          />
        ) : (
          <InvitationEditorV2
            invitation={invitation}
            isMetaInvitation={isMetaInvitation}
            user={user}
            accessToken={accessToken}
            loadInvitation={reloadInvitation}
          />
        )}{' '}
      </div>
    </CommonLayout>
  )
}
