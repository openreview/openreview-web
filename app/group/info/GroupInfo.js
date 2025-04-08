'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import EditBanner from '../../../components/EditBanner'
import { groupModeToggle } from '../../../lib/banner-links'
import CommonLayout from '../../CommonLayout'
import styles from '../Group.module.scss'
import { prettyId } from '../../../lib/utils'
import GroupGeneralInfo from '../../../components/group/info/GroupGeneralInfo'
import GroupMembersInfo from '../../../components/group/info/GroupMembersInfo'
import GroupSignedNotes from '../../../components/group/GroupSignedNotes'
import GroupChildGroups from '../../../components/group/GroupChildGroups'
import GroupRelatedInvitations from '../../../components/group/GroupRelatedInvitations'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function GroupInfo({ id, query }) {
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(null)
  const { accessToken, isRefreshing } = useUser()
  const router = useRouter()

  const loadGroup = async () => {
    try {
      const { groups } = await api.get('/groups', { id }, { accessToken })
      if (groups?.length > 0) {
        setGroup(groups[0])
      } else {
        throw new Error('Group not found')
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          router.replace(`/login?redirect=/group/info?${encodeURIComponent(stringify(query))}`)
          return
        }
        setError("You don't have permission to read this group")
      }
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    loadGroup()
  }, [id, isRefreshing])

  if (error) return <ErrorDisplay message={error} />
  if (!group)
    return (
      <CommonLayout>
        <LoadingSpinner />
      </CommonLayout>
    )

  const editBanner = group?.details?.writable ? (
    <EditBanner>{groupModeToggle('info', group.id)}</EditBanner>
  ) : null

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(group.id)}</h1>
        </div>
        <div>
          <GroupGeneralInfo group={group} />

          <GroupMembersInfo group={group} />

          <GroupSignedNotes group={group} accessToken={accessToken} />

          <GroupChildGroups groupId={group.id} accessToken={accessToken} />

          <GroupRelatedInvitations group={group} accessToken={accessToken} />
        </div>
      </div>
    </CommonLayout>
  )
}
