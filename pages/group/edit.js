/* globals Webfield: false */

import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import GroupEditor from '../../components/group/GroupEditor'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import { isSuperUser } from '../../lib/auth'

export default function GroupEdit({ appContext }) {
  const { accessToken, userLoading, user } = useLoginRedirect()
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(null)

  const router = useRouter()
  const query = useQuery()
  const { setBannerHidden, clientJsLoading } = appContext

  const loadGroup = async (id) => {
    try {
      const { groups } = await api.get('/groups', { id }, { accessToken })
      if (groups?.length > 0) {
        if (groups[0].details?.writable) {
          setGroup(groups[0])
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
    if (userLoading || !query) return

    setBannerHidden(true)

    if (!query.id) {
      setError({ statusCode: 400, message: 'Missing required parameter id' })
      return
    }

    loadGroup(query.id)
  }, [userLoading, query])

  useEffect(() => {
    if (!group || clientJsLoading) return

    const editModeBannerDelay = document.querySelector(
      '#flash-message-container.alert-success'
    )
      ? 2500
      : 0
    setTimeout(() => Webfield.editModeBanner(group.id, 'edit'), editModeBannerDelay)

    // eslint-disable-next-line consistent-return
    return () => {
      // Hide edit mode banner
      if (document.querySelector('#flash-message-container .profile-flash-message')) {
        document.getElementById('flash-message-container').style.display = 'none'
      }
    }
  }, [clientJsLoading, group])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <Head>
        <title key="title">{`Edit ${
          group ? prettyId(group.id) : 'Group'
        } | OpenReview`}</title>
      </Head>

      <div id="header">
        <h1>{prettyId(query?.id)}</h1>
      </div>

      {(clientJsLoading || !group) && <LoadingSpinner />}

      <GroupEditor
        group={group}
        isSuperUser={isSuperUser(user)}
        accessToken={accessToken}
        reloadGroup={() => loadGroup(group.id)}
      />
    </>
  )
}

GroupEdit.bodyClass = 'group'
