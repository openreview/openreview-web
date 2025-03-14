import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import { groupModeToggle } from '../../lib/banner-links'
import GroupWithInvitation from '../../components/group/info/GroupWithInvitation'

const GroupInfo = ({ appContext }) => {
  const { accessToken, userLoading } = useUser()
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const router = useRouter()
  const { setBannerHidden, setEditBanner } = appContext

  const loadGroup = async (id) => {
    try {
      const { groups } = await api.get(
        '/groups',
        { id, details: 'writable,presentation' },
        { accessToken }
      )
      if (groups?.length > 0) {
        setGroup(groups[0])
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

    setBannerHidden(true)

    loadGroup(router.query.id)
  }, [router.isReady, router.query, userLoading, accessToken])

  useEffect(() => {
    if (!group) return

    // Show edit mode banner
    if (group.details?.writable) {
      setEditBanner(groupModeToggle('info', group.id))
    }
  }, [group])

  useEffect(() => {
    if (!error) return

    setBannerHidden(false)
  }, [error])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <Head>
        <title key="title">{`${prettyId(router.query.id)} Group Info | OpenReview`}</title>
      </Head>

      <div id="header">
        <h1>{prettyId(router.query.id)}</h1>
      </div>

      {group ? (
        <div className="groupInfoTabsContainer">
          <GroupWithInvitation group={group} reloadGroup={() => loadGroup(group.id)} />
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </>
  )
}
GroupInfo.bodyClass = 'group'

export default GroupInfo
