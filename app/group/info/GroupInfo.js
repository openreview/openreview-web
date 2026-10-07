'use client'

import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import { useEffect, useState } from 'react'
import EditBanner from '../../../components/EditBanner'
import ErrorDisplay from '../../../components/ErrorDisplay'
import GroupChildGroups from '../../../components/group/GroupChildGroups'
import GroupRelatedInvitations from '../../../components/group/GroupRelatedInvitations'
import GroupSignedNotes from '../../../components/group/GroupSignedNotes'
import GroupGeneralInfo from '../../../components/group/info/GroupGeneralInfo'
import GroupMembersInfo from '../../../components/group/info/GroupMembersInfo'
import LoadingSpinner from '../../../components/LoadingSpinner'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import { groupModeToggle } from '../../../lib/banner-links'
import { prettyId } from '../../../lib/utils'
import CommonLayout from '../../CommonLayout'

import styles from '../Group.module.scss'

export default function GroupInfo({ id, query }) {
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(null)
  const { user, isRefreshing } = useUser()
  const router = useRouter()

  const loadGroup = async () => {
    try {
      const { groups } = await api.get('/groups', { id })
      if (groups?.length > 0) {
        setGroup(groups[0])
      } else {
        throw new Error('Group not found')
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        if (!user) {
          router.replace(`/login?redirect=/group/info?${encodeURIComponent(stringify(query))}`)
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

          <GroupSignedNotes group={group} />

          <GroupChildGroups groupId={group.id} />

          {user && <GroupRelatedInvitations group={group} />}
        </div>
      </div>
    </CommonLayout>
  )
}
