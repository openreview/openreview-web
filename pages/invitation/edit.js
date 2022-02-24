/* globals Webfield: false */

import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ErrorDisplay from '../../components/ErrorDisplay'
import InvitationEditor from '../../components/invitation/InvitationEditor'
import LoadingSpinner from '../../components/LoadingSpinner'
import useQuery from '../../hooks/useQuery'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const InvitationEdit = ({ appContext }) => {
  const query = useQuery()
  const router = useRouter()
  const { user, accessToken, userLoading } = useUser()
  const { setBannerHidden, clientJsLoading } = appContext

  const [error, setError] = useState(null)
  const [invitation, setInvitation] = useState(null)

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
    }

    return `${prettyId(invitation?.id)} ${type}`
  }

  // Try loading invitation from v1 API first and if not found load from v2
  const loadInvitation = async (invitationId) => {
    try {
      const invitationObj = await api.getInvitationById(invitationId, accessToken, {
        details: 'writable,writableWith',
        expired: true,
      })
      if (invitationObj) {
        if (invitationObj.details?.writable) {
          setInvitation(invitationObj)
        } else if (!accessToken) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
        } else {
          // User is a reader, not a writer of the invitation, so redirect to info mode
          router.replace(`/invitation/info?id=${invitationObj.id}`)
        }
      } else {
        setError({ statusCode: 404, message: 'Invitation not found' })
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        setError({
          statusCode: 403,
          message: "You don't have permission to read this invitation",
        })
      } else {
        setError({ statusCode: apiError.status, message: apiError.message })
      }
    }
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
    if (!invitation || clientJsLoading) return

    const editModeBannerDelay = document.querySelector(
      '#flash-message-container.alert-success'
    )
      ? 2500
      : 0
    const bannerTimeout = setTimeout(
      () => Webfield.editModeBanner(invitation.id, 'edit'),
      editModeBannerDelay
    )

    // eslint-disable-next-line consistent-return
    return () => {
      clearTimeout(bannerTimeout)
      if (document.querySelector('#flash-message-container .profile-flash-message')) {
        document.getElementById('flash-message-container').style.display = 'none'
      }
    }
  }, [clientJsLoading, invitation])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <Head>
        <title key="title">{`Edit ${
          invitation ? prettyId(invitation.id) : 'Invitation'
        } | OpenReview`}</title>
      </Head>

      <div id="header">
        <h1>{getHeaderText()}</h1>
      </div>

      {(clientJsLoading || !invitation) && <LoadingSpinner />}

      <InvitationEditor
        invitation={invitation}
        isMetaInvitation={isMetaInvitation}
        user={user}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
      />
    </>
  )
}

InvitationEdit.bodyClass = 'invitation'

export default InvitationEdit
