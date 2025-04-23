'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import GroupGeneral from '../../../components/group/GroupGeneral'
import GroupMembers from '../../../components/group/GroupMembers'
import GroupContent from '../../../components/group/GroupContent'
import GroupContentScripts from '../../../components/group/GroupContentScripts'
import GroupSignedNotes from '../../../components/group/GroupSignedNotes'
import GroupChildGroups from '../../../components/group/GroupChildGroups'
import GroupRelatedInvitations from '../../../components/group/GroupRelatedInvitations'
import GroupUICode from '../../../components/group/GroupUICode'
import CommonLayout from '../../CommonLayout'
import styles from '../Group.module.scss'
import { prettyId } from '../../../lib/utils'
import EditBanner from '../../../components/EditBanner'
import { groupModeToggle } from '../../../lib/banner-links'
import useUser from '../../../hooks/useUser'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ErrorDisplay from '../../../components/ErrorDisplay'
import api from '../../../lib/api-client'
import { isSuperUser } from '../../../lib/clientAuth'

export default function GroupEditor({ id, query }) {
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(null)
  const { user, accessToken, isRefreshing } = useUser()
  const router = useRouter()
  const profileId = user?.profile?.id

  const loadGroup = async () => {
    try {
      const { groups } = await api.get('/groups', { id }, { accessToken })
      if (!groups?.length) throw new Error('Group not found')
      // eslint-disable-next-line no-shadow
      const group = groups[0]
      if (group.details?.writable) {
        // Get venue group to pass to webfield component
        if (group.domain && group.domain !== group.id) {
          const domainResult = await api.get('/groups', { id: group.domain }, { accessToken })
          const domainGroup = domainResult.groups?.length > 0 ? domainResult.groups[0] : null
          setGroup({
            ...group,
            details: { ...group.details, domain: domainGroup },
          })
          return
        }
        if (group.domain) {
          setGroup({
            ...group,
            details: { ...group.details, domain: group },
          })
          return
        }
        setGroup(group)
      } else {
        const redirectPath = accessToken
          ? `/group/info?id=${id}`
          : `/login?redirect=/group/edit?${encodeURIComponent(stringify(query))}`
        router.replace(redirectPath)
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          router.replace(`/login?redirect=${encodeURIComponent(stringify(query))}`)
        } else {
          setError("You don't have permission to read this group")
        }
        return
      }
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    loadGroup()
  }, [isRefreshing, id])

  if (error) return <ErrorDisplay message={error} />
  if (!group)
    return (
      <CommonLayout>
        <LoadingSpinner />
      </CommonLayout>
    )

  const editBanner = <EditBanner>{groupModeToggle('edit', group.id)}</EditBanner>
  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(group.id)}</h1>
        </div>
        <div>
          <GroupGeneral
            group={group}
            profileId={profileId}
            isSuperUser={isSuperUser(user)}
            accessToken={accessToken}
            reloadGroup={loadGroup}
          />
          <GroupMembers group={group} accessToken={accessToken} reloadGroup={loadGroup} />
          {group.invitations && (
            <GroupContent
              group={group}
              profileId={profileId}
              accessToken={accessToken}
              reloadGroup={loadGroup}
            />
          )}
          {group.invitations && (
            <GroupContentScripts
              key={`${group.id}-content-scripts`}
              group={group}
              profileId={profileId}
              accessToken={accessToken}
              reloadGroup={loadGroup}
            />
          )}
          <GroupSignedNotes group={group} accessToken={accessToken} />
          <GroupChildGroups groupId={group.id} accessToken={accessToken} />
          <GroupRelatedInvitations group={group} accessToken={accessToken} />
          <GroupUICode
            group={group}
            profileId={profileId}
            accessToken={accessToken}
            reloadGroup={loadGroup}
          />
        </div>
      </div>
    </CommonLayout>
  )
}
