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
import { isSuperUser } from '../../lib/auth'

const GroupInfo = ({ appContext }) => {
  const { accessToken, userLoading, user } = useUser()
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const router = useRouter()
  const { setBannerHidden, setEditBanner } = appContext

  const loadGroup = async (id) => {
    try {
      const { groups } = await api.get('/groups', { id, details: 'writable' }, { accessToken })
      if (groups?.length > 0) {
        if (groups[0].details?.writable) {
          // required to preview web
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
        } else {
          setGroup(groups[0])
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

    setBannerHidden(true)

    loadGroup(router.query.id)
  }, [router.isReady, router.query, userLoading, accessToken])

  useEffect(() => {
    if (!group) return

    // Show edit mode banner
    if (group.details?.writable) {
      setEditBanner(groupModeToggle('info', group.id, isSuperUser(user)))
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
