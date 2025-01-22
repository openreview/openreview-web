'use client'

import { use } from 'react'
import EdgeBrowser from '../../../components/browser/EdgeBrowser'

export default function Browse({
  loadAllInvitationsP,
  version,
  maxColumns,
  showCounter,
  user,
  accessToken,
}) {
  const { invitations, errorMessage } = use(loadAllInvitationsP)
  if (errorMessage) throw new Error(errorMessage)

  return (
    <EdgeBrowser
      version={version}
      startInvitation={invitations.startInvitation}
      traverseInvitations={invitations.traverseInvitations}
      editInvitations={invitations.editInvitations}
      browseInvitations={invitations.browseInvitations}
      hideInvitations={invitations.hideInvitations}
      maxColumns={maxColumns}
      showCounter={showCounter}
      userInfo={{ userId: user?.id, accessToken }}
    />
  )
}
