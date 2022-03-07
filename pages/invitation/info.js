/* globals Webfield: false */

import { useEffect, useRef, useState } from 'react'
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
import useQuery from '../../hooks/useQuery'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const InvitationInfo = ({ appContext }) => {
  const { accessToken, userLoading } = useUser()
  const [error, setError] = useState(null)
  const [invitation, setInvitation] = useState(null)
  const query = useQuery()
  const router = useRouter()
  const containerRef = useRef(null)
  const { setBannerHidden, clientJsLoading } = appContext

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
    if (invitation?.apiVersion === 1)
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
    return (
      <>
        <InvitationReplyV2
          invitation={invitation}
          replyField={invitation.edge ? 'edge' : 'edit'}
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
    if (userLoading || !query) return

    setBannerHidden(true)

    if (!query.id) {
      setError({ statusCode: 400, message: 'Missing required parameter id' })
      return
    }

    loadInvitation(query.id)
  }, [userLoading, query])

  useEffect(() => {
    if (!invitation || !containerRef || clientJsLoading) return

    if (invitation.details?.writable) {
      Webfield.editModeBanner(invitation.id, 'default')
    } else if (invitation.web) {
      Webfield.editModeBanner(invitation.id, 'info')
    }

    // eslint-disable-next-line consistent-return
    return () => {
      // Hide edit mode banner
      if (document.querySelector('#flash-message-container .profile-flash-message')) {
        document.getElementById('flash-message-container').style.display = 'none'
      }
    }
  }, [clientJsLoading, containerRef, invitation])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <Head>
        <title key="title">{`${
          invitation ? prettyId(invitation.id) : 'Invitation Info'
        } | OpenReview`}</title>
      </Head>

      <div id="header">
        <h1>{prettyId(invitation?.id)}</h1>
      </div>

      {(clientJsLoading || !invitation) && <LoadingSpinner />}

      {invitation && (
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
      )}
    </>
  )
}

InvitationInfo.bodyClass = 'invitation'

export default InvitationInfo
