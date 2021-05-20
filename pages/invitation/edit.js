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

  const loadInvitation = async (invitationId) => {
    try {
      const { invitations } = await api.get('/invitations', { id: invitationId }, { accessToken })
      if (invitations?.length > 0) {
        if (invitations[0].details?.writable) {
          setInvitation({ ...invitations[0], web: null })
        } else {
          // User is a reader, not a writer of the group, so redirect to info mode
          router.replace(`/invitation/info?id=${invitationId}`)
        }
      } else {
        setError({ statusCode: 404, message: 'Group not found' })
      }
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
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
    Webfield.ui.invitationEditor(invitation, { container: containerRef.current, showProcessEditor: isSuperUser(user) })

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
