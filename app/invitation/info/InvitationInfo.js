'use client'

import { useEffect, useState } from 'react'
import { stringify } from 'query-string'
import { useRouter } from 'next/navigation'
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
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'

const getReplyFieldByInvitationType = (invitation) => {
  if (!invitation) return 'edit'
  if (invitation.edge) return 'edge'
  if (invitation.tag) return 'tag'
  if (invitation.message) return 'message'
  return 'edit'
}

export default function InvitationInfo({ id, query }) {
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState(null)
  const { user, accessToken, isRefreshing } = useUser()
  const router = useRouter()

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

  const loadInvitation = async () => {
    try {
      const invitationObj = await api.getInvitationById(id, accessToken, null, null)
      if (invitationObj) {
        setInvitation({
          ...invitationObj,
          web: null,
          process: null,
          preprocess: null,
        })
      } else {
        setError('Invitation not found')
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          router.replace(
            `/login?redirect=/invitation/info?${encodeURIComponent(stringify(query))}}`
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
