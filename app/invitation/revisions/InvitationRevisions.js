'use client'

import { use, useEffect, useState } from 'react'
import { prettyId } from '../../../lib/utils'
import CommonLayout from '../../CommonLayout'
import EditBanner from '../../../components/EditBanner'
import { invitationModeToggle } from '../../../lib/banner-links'
import styles from '../Invitation.module.scss'
import EditHistory from '../../../components/EditHistory'

export default function InvitationRevisions({ loadInvitationP, accessToken, isSuperUser }) {
  const { invitation, errorMessage } = use(loadInvitationP)
  if (errorMessage) throw new Error(errorMessage)

  const [error, setError] = useState(null)

  useEffect(() => {
    if (!error) return
    throw new Error(error.message)
  }, [error])

  const editBanner = (
    <EditBanner>{invitationModeToggle('revisions', invitation.id)}</EditBanner>
  )

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(invitation.id)} Invitation Edit History</h1>
        </div>
        <EditHistory
          invitation={invitation}
          accessToken={accessToken}
          isSuperUser={isSuperUser}
          setError={setError}
        />
      </div>
    </CommonLayout>
  )
}
