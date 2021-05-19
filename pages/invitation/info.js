/* globals Webfield: false */

import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebfieldContainer from '../../components/WebfieldContainer'
import useQuery from '../../hooks/useQuery'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

const InvitationInfo = ({ appContext }) => {
  const query = useQuery()
  const { accessToken, userLoading } = useUser()
  const { setBannerHidden, clientJsLoading } = appContext

  const [error, setError] = useState(null)
  const [invitation, setInvitation] = useState(null)
  const containerRef = useRef(null)

  const loadInvitation = async (invitationId) => {
    try {
      const { invitations } = await api.get('/invitations', { id: invitationId }, { accessToken })
      if (invitations?.length > 0) {
        setInvitation(invitations[0])
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

    Webfield.editModeBanner(invitation.id, 'info')
    Webfield.ui.invitationInfo(invitation, { container: containerRef.current })

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
        <title key="title">{`${invitation ? prettyId(invitation.id) : 'Invitation Info'} | OpenReview`}</title>
      </Head>

      {(clientJsLoading || !invitation) && (
        <LoadingSpinner />
      )}

      <WebfieldContainer id="group-container">
        <div id="header">
          <h1>{prettyId(query?.id)}</h1>
        </div>

        <div id="notes" ref={containerRef} />
      </WebfieldContainer>
    </>
  )
}

InvitationInfo.bodyClass = 'invitation'

export default InvitationInfo
