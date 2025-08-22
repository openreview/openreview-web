'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import { prettyId } from '../../../lib/utils'
import CommonLayout from '../../CommonLayout'
import EditBanner from '../../../components/EditBanner'
import { invitationModeToggle } from '../../../lib/banner-links'
import styles from '../Invitation.module.scss'
import EditHistory from '../../../components/EditHistory'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function InvitationRevisions({ id, query }) {
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState(null)
  const { accessToken, isRefreshing } = useUser()
  const router = useRouter()

  const loadInvitation = async () => {
    try {
      const invitationObj = await api.getInvitationById(id, accessToken)
      if (invitationObj) {
        if (invitationObj.details?.writable) {
          setInvitation(invitationObj)
        } else if (!accessToken) {
          router.replace(
            `/login?redirect=/invitation/revisions?${encodeURIComponent(stringify(query))}`
          )
        } else {
          // User is a reader, not a writer of the invitation, so redirect to edit mode
          router.replace(`/invitation/edit?id=${id}`)
        }
      } else {
        setError('Invitation not found')
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          router.replace(
            `/login?redirect=/invitation/revisions?${encodeURIComponent(stringify(query))}`
          )
        } else {
          setError("You don't have permission to read this invitation")
        }
        return
      }
      setError(apiError.message)
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
          setError={setError}
          editId={query.editId}
        />
      </div>
    </CommonLayout>
  )
}
