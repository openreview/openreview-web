import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import GroupEditor from '../../components/group/GroupEditor'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import { isSuperUser } from '../../lib/auth'
import { groupModeToggle } from '../../lib/banner-links'
import useUser from '../../hooks/useUser'

export default function GroupEdit({ appContext }) {
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
          // Get venue group to pass to pass to webfield component
          let domainGroup = null
          if (groups[0].domain && groups[0].domain !== groups[0].id) {
            try {
              const apiRes = await api.get(
                '/groups',
                { id: groups[0].domain },
                { accessToken }
              )
              domainGroup = apiRes.groups?.length > 0 ? apiRes.groups[0] : null
            } catch (e) {
              domainGroup = null
            }
          } else if (groups[0].domain) {
            domainGroup = groups[0]
          }
          const groupToSet = {
            ...groups[0],
            details: { ...groups[0].details, domain: domainGroup },
          }
          setGroup(groupToSet)
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

    if (!isSuperUser(user)) {
      setError({ statusCode: 403, message: 'Forbidden. Access to this page is restricted.' })
      return
    }

    loadGroup(router.query.id)
  }, [router.isReady, router.query, userLoading, accessToken])

  useEffect(() => {
    if (!group) return

    // Show edit mode banner
    setBannerHidden(true)
    setEditBanner(groupModeToggle('edit', group.id))
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
        <title key="title">{`Edit ${prettyId(router.query.id)} Group | OpenReview`}</title>
      </Head>

      <div id="header">
        <h1>{prettyId(router.query.id)}</h1>
      </div>

      {!group && <LoadingSpinner />}

      <GroupEditor
        group={group}
        profileId={user?.profile?.id}
        accessToken={accessToken}
        isSuperUser={isSuperUser(user)}
        reloadGroup={() => loadGroup(group.id)}
      />
    </>
  )
}

GroupEdit.bodyClass = 'group'
