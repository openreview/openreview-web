'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import CommonLayout from '../../CommonLayout'
import styles from '../Group.module.scss'
import { prettyId } from '../../../lib/utils'
import EditBanner from '../../../components/EditBanner'
import { groupModeToggle } from '../../../lib/banner-links'
import useUser from '../../../hooks/useUser'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ErrorDisplay from '../../../components/ErrorDisplay'
import api from '../../../lib/api-client'
import GroupWithInvitation from './GroupWithInvitation'
import GroupAdmin from '../admin/GroupAdmin'

export default function GroupEditor({ id, query }) {
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(null)
  const { user, accessToken, isRefreshing } = useUser()
  const router = useRouter()

  const loadGroup = async () => {
    try {
      const { groups } = await api.get('/groups', { id, details: 'writable' }, { accessToken })
      if (!groups?.length) throw new Error('Group not found')
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
        setGroup(group)
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

  if (!group.details.domain?.content?.request_form_invitation)
    return <GroupAdmin id={id} query={query} />

  const editBanner = <EditBanner>{groupModeToggle('edit', group.id)}</EditBanner>
  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(group.id)}</h1>
        </div>
        <div className="groupEditorTabsContainer">
          <GroupWithInvitation
            group={group}
            reloadGroup={() => loadGroup(group.id)}
            accessToken={accessToken}
          />
        </div>
      </div>
    </CommonLayout>
  )
}
