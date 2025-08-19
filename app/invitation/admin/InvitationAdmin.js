'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import CommonLayout from '../../CommonLayout'
import styles from '../Invitation.module.scss'
import { prettyId } from '../../../lib/utils'
import EditBanner from '../../../components/EditBanner'
import { invitationModeToggle } from '../../../lib/banner-links'
import InvitationAdminV1, {
  InvitationAdminV2,
} from '../../../components/invitation/InvitationAdmin'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function InvitationAdmin({ id, query }) {
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState(null)
  const { user, accessToken, isRefreshing } = useUser()
  const router = useRouter()
  const isMetaInvitation = invitation?.edit === true

  const getHeaderText = () => {
    if (!invitation) return ''
    let type = ''
    if (isMetaInvitation) {
      type = '(Meta Invitation)'
    } else if (invitation.edit?.invitation) {
      type = '(Invitation of Invitation)'
    } else if (invitation.edit?.note) {
      type = '(Invitation of Note)'
    } else if (invitation.edge) {
      type = '(Invitation of Edge)'
    } else if (invitation.tag) {
      type = '(Invitation of Tag)'
    }

    return `${prettyId(invitation?.id)} ${type}`
  }

  const loadInvitation = async () => {
    try {
      const invitationObj = await api.getInvitationById(
        id,
        accessToken,
        { details: 'writable', expired: true, trash: true },
        { details: 'writable', expired: true }
      )
      if (invitationObj) {
        if (invitationObj.details?.writable) {
          setInvitation(invitationObj)
        } else if (!accessToken) {
          router.replace(
            `/login?redirect=/invitation/edit?${encodeURIComponent(stringify(query))}`
          )
        } else {
          // User is a reader, not a writer of the invitation, so redirect to info mode
          router.replace(`/invitation/info?id=${id}`)
        }
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

  const editBanner = <EditBanner>{invitationModeToggle('edit', invitation.id)}</EditBanner>
  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.invitation}>
        <div id="header">
          <h1>{getHeaderText()}</h1>
        </div>
        {invitation?.apiVersion === 1 ? (
          <InvitationAdminV1
            invitation={invitation}
            user={user}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
          />
        ) : (
          <InvitationAdminV2
            invitation={invitation}
            isMetaInvitation={isMetaInvitation}
            user={user}
            accessToken={accessToken}
            loadInvitation={loadInvitation}
          />
        )}{' '}
      </div>
    </CommonLayout>
  )
}
