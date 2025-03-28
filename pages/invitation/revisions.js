import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import EditHistory from '../../components/EditHistory'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import { isSuperUser } from '../../lib/auth'
import { invitationModeToggle } from '../../lib/banner-links'
import useUser from '../../hooks/useUser'

export default function InvitationRevisions({ appContext }) {
  const { accessToken, userLoading, user } = useUser()
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState(null)

  const router = useRouter()
  const { setBannerHidden, setEditBanner } = appContext

  const loadInvitation = async (id) => {
    try {
      const { invitations } = await api.get('/invitations', { id }, { accessToken })
      if (invitations?.length > 0) {
        if (invitations[0].details?.writable) {
          setInvitation(invitations[0])
        } else if (!accessToken) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
        } else {
          // User is a reader, not a writer of the invitation, so redirect to info mode
          router.replace(`/invitation/info?id=${id}`)
        }
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
        return
      }
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  useEffect(() => {
    if (!router.isReady || userLoading) return

    if (!router.query.id) {
      setError({ statusCode: 400, message: 'Missing required parameter id' })
      return
    }

    loadInvitation(router.query.id)
  }, [router.isReady, router.query, userLoading, accessToken])

  useEffect(() => {
    if (!invitation) return

    // Show edit mode banner
    setBannerHidden(true)
    setEditBanner(invitationModeToggle('revisions', invitation.id))
  }, [invitation])

  useEffect(() => {
    if (!error) return

    setBannerHidden(false)
    setEditBanner(null)
  }, [error])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <Head>
        <title key="title">
          {`${prettyId(router.query.id)} Invitation Edit History | OpenReview`}
        </title>
      </Head>

      <div id="header">
        <h1>{prettyId(router.query.id)} Invitation Edit History</h1>
      </div>

      {invitation ? (
        <EditHistory
          invitation={invitation}
          accessToken={accessToken}
          isSuperUser={isSuperUser(user)}
          setError={setError}
        />
      ) : (
        <LoadingSpinner />
      )}
    </>
  )
}

InvitationRevisions.bodyClass = 'invitation'
