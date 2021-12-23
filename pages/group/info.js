/* globals Webfield: false */

import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import useQuery from '../../hooks/useQuery'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import GroupGeneralInfo from '../../components/group/info/GroupGeneralInfo'
import GroupMembersInfo from '../../components/group/info/GroupMembersInfo'
import GroupSignedNotes from '../../components/group/GroupSignedNotes'
import GroupChildGroups from '../../components/group/GroupChildGroups'
import GroupRelatedInvitations from '../../components/group/GroupRelatedInvitations'

const GroupInfo = ({ appContext }) => {
  const { accessToken, userLoading } = useUser()
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const query = useQuery()
  const router = useRouter()
  const containerRef = useRef(null)
  const { setBannerHidden, clientJsLoading } = appContext

  const loadGroup = async (id) => {
    try {
      const { groups } = await api.get('/groups', { id }, { accessToken })
      if (groups?.length > 0) {
        setGroup({ ...groups[0], web: null })
      } else {
        setError({ statusCode: 404, message: 'Group not found' })
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
        } else {
          setError({ statusCode: 403, message: 'You don\'t have permission to read this group' })
        }
        return
      }
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  useEffect(() => {
    if (!group || !containerRef || clientJsLoading) return

    if (group.details?.writable) {
      Webfield.editModeBanner(group.id, 'default')
    } else if (group.web) {
      Webfield.editModeBanner(group.id, 'info')
    }

    // eslint-disable-next-line consistent-return
    return () => {
      // Hide edit mode banner
      if (document.querySelector('#flash-message-container .profile-flash-message')) {
        document.getElementById('flash-message-container').style.display = 'none'
      }
    }
  }, [clientJsLoading, containerRef, group])

  useEffect(() => {
    if (userLoading || !query) return

    setBannerHidden(true)

    if (!query.id) {
      setError({ statusCode: 400, message: 'Missing required parameter id' })
      return
    }

    loadGroup(query.id)
  }, [userLoading, query])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />
  return (
    <>
      <Head>
        <title key="title">{`${group ? prettyId(group.id) : 'Group Info'} | OpenReview`}</title>
      </Head>

      <div id="header">
        <h1>{prettyId(query?.id)}</h1>
      </div>

      {(clientJsLoading || !group) && (
        <LoadingSpinner />
      )}

      {group && (
        <div>
          <GroupGeneralInfo group={group} />
          <GroupMembersInfo group={group} />
          <GroupSignedNotes
            groupId={group.id}
            accessToken={accessToken}
          />
          <GroupChildGroups
            groupId={group.id}
            accessToken={accessToken}
          />
          <GroupRelatedInvitations
            groupId={group.id}
            accessToken={accessToken}
          />
        </div>
      )}
    </>
  )
}
GroupInfo.bodyClass = 'group'

export default GroupInfo
