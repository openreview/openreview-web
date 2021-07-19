/* eslint-disable global-require */
/* globals Webfield: false */
/* globals moment: false */

import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebfieldContainer from '../../components/WebfieldContainer'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { isSuperUser } from '../../lib/auth'
import { prettyId } from '../../lib/utils'

// Page Styles
import '../../styles/pages/invitation.less'

const InvitationEdit = ({ appContext }) => {
  const query = useQuery()
  const router = useRouter()
  const { user, accessToken, userLoading } = useLoginRedirect()
  const { setBannerHidden, clientJsLoading } = appContext

  const [error, setError] = useState(null)
  const [invitation, setInvitation] = useState(null)
  const containerRef = useRef(null)

  const getInvitation = async (id, apiVersion) => {
    if (apiVersion === 2 && !process.env.API_V2_URL) return null

    try {
      const { invitations } = await api.get('/invitations', { id }, { accessToken, version: apiVersion })
      return invitations?.length > 0 ? invitations[0] : null
    } catch (apiError) {
      if (apiError.name === 'Not Found' || apiError.name === 'NotFoundError') {
        return null
      }
      throw apiError
    }
  }

  const setInvitationOrRedirect = (invitationObj, apiVersion) => {
    if (invitationObj.details?.writable) {
      setInvitation({
        ...invitationObj, web: null, process: null, preprocess: null, apiVersion,
      })
    } else {
      // User is a reader, not a writer of the invitation, so redirect to info mode
      router.replace(`/invitation/info?id=${invitationObj.id}`)
    }
  }

  // Try loading invitation from v1 API first and if not found load from v2
  const loadInvitation = async (invitationId) => {
    let invitationObj
    try {
      invitationObj = await getInvitation(invitationId, 1)
      if (invitationObj) {
        setInvitationOrRedirect(invitationObj, 1)
      } else {
        invitationObj = await getInvitation(invitationId, 2)
        if (invitationObj) {
          setInvitationOrRedirect(invitationObj, 2)
        } else {
          setError({ statusCode: 404, message: 'Invitation not found' })
        }
      }
    } catch (apiError) {
      if (apiError.name === 'forbidden' || apiError.name === 'ForbiddenError') {
        setError({ statusCode: 403, message: 'You don\'t have permission to read this invitation' })
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
    if (!invitation || !containerRef || clientJsLoading) return

    window.moment = require('moment')
    require('moment-timezone')
    window.datetimepicker = require('../../client/bootstrap-datetimepicker-4.17.47.min')

    Webfield.editModeBanner(invitation.id, 'edit')
    Webfield.ui.invitationEditor(invitation, {
      container: containerRef.current,
      userId: user.profile.id,
      showProcessEditor: isSuperUser(user),
      apiVersion: invitation.apiVersion,
    })

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
        <title key="title">{`Edit ${invitation ? prettyId(invitation.id) : 'Invitation'} | OpenReview`}</title>
      </Head>

      {(clientJsLoading || !invitation) && (
        <LoadingSpinner />
      )}

      <WebfieldContainer id="invitation-container">
        <div id="header">
          <h1>{prettyId(query?.id)}</h1>
        </div>

        <div id="notes" ref={containerRef} />
      </WebfieldContainer>
    </>
  )
}

InvitationEdit.bodyClass = 'invitation'

export default InvitationEdit
