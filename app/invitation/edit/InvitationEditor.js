'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import CommonLayout from '../../CommonLayout'
import styles from '../Invitation.module.scss'
import { prettyId } from '../../../lib/utils'
import EditBanner from '../../../components/EditBanner'
import { invitationModeToggle } from '../../../lib/banner-links'
import InvitationWithInvitation from '../../../components/invitation/InvitationWithInvitation'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'
import InvitationAdmin from '../admin/InvitationAdmin'

export default function InvitationEditor({ id, query }) {
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState(null)
  const { accessToken, isRefreshing } = useUser()
  const router = useRouter()

  const loadInvitation = async () => {
    try {
      const invitationObj = await api.getInvitationById(id, accessToken)
      const domainResult = invitationObj
        ? await api
            .get('/groups', { id: invitationObj.domain }, { accessToken })
            .catch(() => {})
        : null
      const domainGroup = domainResult?.groups?.length > 0 ? domainResult.groups[0] : null
      if (invitationObj) {
        setInvitation({ ...invitationObj, domain: domainGroup })
      } else {
        setError('Invitation not found')
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          router.replace(
            `/login?redirect=/invitation/edit?${encodeURIComponent(stringify(query))}`
          )
        } else {
          setError("You don't have permission to read this invitation")
        }
      } else {
        setError(apiError.message)
      }
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    loadInvitation()
  }, [id, isRefreshing])

  if (error) return <ErrorDisplay message={error} />
  if (!invitation)
    return (
      <CommonLayout>
        <LoadingSpinner />
      </CommonLayout>
    )
  if (!invitation.domain?.content?.request_form_invitation)
    return <InvitationAdmin id={id} query={query} />

  const editBanner = <EditBanner>{invitationModeToggle('edit', invitation.id)}</EditBanner>
  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.invitation}>
        <div id="header">
          <h1>{prettyId(invitation?.id)}</h1>
        </div>
        <div className="invitationEditorTabsContainer">
          <InvitationWithInvitation
            invitation={invitation}
            reloadInvitation={() => loadInvitation(invitation.id)}
          />
        </div>
      </div>
    </CommonLayout>
  )
}
