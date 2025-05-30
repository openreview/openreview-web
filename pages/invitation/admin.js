import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ErrorDisplay from '../../components/ErrorDisplay'
import InvitationAdmin, {
  InvitationAdminV2,
} from '../../components/invitation/InvitationAdmin'
import LoadingSpinner from '../../components/LoadingSpinner'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { invitationModeToggle } from '../../lib/banner-links'
import { prettyId } from '../../lib/utils'
import { isSuperUser } from '../../lib/auth'

const InvitationEdit = ({ appContext }) => {
  const router = useRouter()
  const { user, accessToken, userLoading } = useUser()
  const { setBannerHidden, setEditBanner } = appContext

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
    } else if (invitation.edit?.edge) {
      type = '(Invitation of Edge)'
    } else if (invitation.edit?.tag) {
      type = '(Invitation of Tag)'
    }

    return `${prettyId(invitation?.id)} ${type}`
  }

  // Try loading invitation from API v2 first and if not found load from v1
  const loadInvitation = async (invitationId) => {
    try {
      const invitationObj = await api.getInvitationById(
        invitationId,
        accessToken,
        { details: 'writable', expired: true, trash: true },
        { details: 'writable', expired: true }
      )
      if (invitationObj) {
        if (invitationObj.details?.writable) {
          setInvitation(invitationObj)
        } else if (!accessToken) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
        } else {
          // User is a reader, not a writer of the invitation, so redirect to edit mode
          router.replace(`/invitation/edit?id=${invitationObj.id}`)
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
      } else {
        setError({ statusCode: apiError.status, message: apiError.message })
      }
    }
  }

  useEffect(() => {
    if (!router.isReady || userLoading) return

    if (!router.query.id) {
      setError({ statusCode: 400, message: 'Missing required parameter id' })
      return
    }

    if (!isSuperUser(user)) {
      setError({ statusCode: 403, message: 'Forbidden. Access to this page is restricted.' })
      return
    }

    loadInvitation(router.query.id)
  }, [router.isReady, router.query, userLoading, accessToken])

  useEffect(() => {
    if (!invitation) return

    // Show edit mode banner
    setBannerHidden(true)
    setEditBanner(invitationModeToggle('admin', invitation.id))
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
        <title key="title">{`Edit ${prettyId(router.query.id)} Invitation | OpenReview`}</title>
      </Head>

      <div id="header">
        <h1>{getHeaderText()}</h1>
      </div>

      {!invitation && <LoadingSpinner />}

      {invitation?.apiVersion === 1 ? (
        <InvitationAdmin
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
      )}
    </>
  )
}

InvitationEdit.bodyClass = 'invitation'

export default InvitationEdit
