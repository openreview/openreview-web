import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import EditorSection from '../../components/EditorSection'
import {
  InvitationGeneralView,
  InvitationGeneralViewV2,
} from '../../components/invitation/InvitationGeneral'
import InvitationReply, {
  InvitationReplyV2,
} from '../../components/invitation/InvitationReply'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import { invitationModeToggle } from '../../lib/banner-links'

const InvitationInfo = ({ appContext }) => {
  const { accessToken, userLoading } = useUser()
  const [error, setError] = useState(null)
  const [invitation, setInvitation] = useState(null)
  const router = useRouter()
  const { setBannerHidden, setEditBanner } = appContext

  // eslint-disable-next-line no-shadow
  const getReplyFieldByInvitationType = (invitation) => {
    if (!invitation) return 'edit'
    if (invitation.edge) return 'edge'
    if (invitation.tag) return 'tag'
    if (invitation.message) return 'message'
    return 'edit'
  }

  // Try loading invitation from v1 API first and if not found load from v2
  const loadInvitation = async (invitationId) => {
    try {
      const invitationObj = await api.getInvitationById(invitationId, accessToken)
      if (invitationObj) {
        setInvitation({
          ...invitationObj,
          web: null,
          process: null,
          preprocess: null,
        })
      } else {
        setError({ statusCode: 404, message: 'Invitation not found' })
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
        } else {
          setError({
            statusCode: 403,
            message: "You don't have permission to read this invitation",
          })
        }
      } else {
        setError({ statusCode: apiError.status, message: apiError.message })
      }
    }
  }

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

  useEffect(() => {
    if (!router.isReady || userLoading) return

    if (!router.query.id) {
      setError({ statusCode: 400, message: 'Missing required parameter id' })
      return
    }

    setBannerHidden(true)

    loadInvitation(router.query.id)
  }, [router.isReady, router.query, userLoading, accessToken])

  useEffect(() => {
    if (!invitation) return

    // Show edit mode banner
    if (invitation.details?.writable) {
      setEditBanner(invitationModeToggle('info', invitation.id))
    }
  }, [invitation])

  useEffect(() => {
    if (!error) return

    setBannerHidden(false)
  }, [error])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <Head>
        <title key="title">{`${prettyId(
          router.query.id
        )} Invitation Info | OpenReview`}</title>
      </Head>

      <div id="header">
        <h1>{prettyId(invitation?.id)}</h1>
      </div>

      {invitation ? (
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
      ) : (
        <LoadingSpinner />
      )}
    </>
  )
}

InvitationInfo.bodyClass = 'invitation'

export default InvitationInfo
