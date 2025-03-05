import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import EditHistory from '../../components/EditHistory'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import { isSuperUser } from '../../lib/auth'
import { groupModeToggle } from '../../lib/banner-links'
import useUser from '../../hooks/useUser'

export default function GroupRevisions({ appContext }) {
  const { accessToken, userLoading, user } = useUser()
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(null)

  const router = useRouter()
  const { setBannerHidden, setEditBanner } = appContext

  const loadGroup = async (id) => {
    try {
      const { groups } = await api.get('/groups', { id }, { accessToken })
      if (groups?.length > 0) {
        if (groups[0].details?.writable) {
          setGroup(groups[0])
        } else if (!accessToken) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
        } else {
          // User is a reader, not a writer of the group, so redirect to info mode
          router.replace(`/group/info?id=${id}`)
        }
      } else {
        setError({ statusCode: 404, message: 'Group not found' })
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
        } else {
          setError({
            statusCode: 403,
            message: "You don't have permission to read this group",
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

    loadGroup(router.query.id)
  }, [router.isReady, router.query, userLoading, accessToken])

  useEffect(() => {
    if (!group) return

    // Show edit mode banner
    setBannerHidden(true)
    setEditBanner(groupModeToggle('revisions', group.id))
  }, [group])

  useEffect(() => {
    if (!error) return

    setBannerHidden(false)
    setEditBanner(null)
  }, [error])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <Head>
        <title key="title">{`${prettyId(router.query.id)} Group Edit History | OpenReview`}</title>
      </Head>

      <div id="header">
        <h1>{prettyId(router.query.id)} Group Edit History</h1>
      </div>

      {group ? (
        <EditHistory
          group={group}
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

GroupRevisions.bodyClass = 'group'
