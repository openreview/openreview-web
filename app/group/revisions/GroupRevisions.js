'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import { prettyId } from '../../../lib/utils'
import CommonLayout from '../../CommonLayout'
import EditBanner from '../../../components/EditBanner'
import { groupModeToggle } from '../../../lib/banner-links'
import styles from '../Group.module.scss'
import EditHistory from '../../../components/EditHistory'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'

export default function GroupRevisions({ id, query }) {
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(null)
  const { accessToken, isRefreshing } = useUser()
  const router = useRouter()

  const loadGroup = async () => {
    try {
      const { groups } = await api.get('/groups', { id }, { accessToken })
      if (groups?.length > 0) {
        if (groups[0].details?.writable) {
          setGroup(groups[0])
        } else if (!accessToken) {
          router.replace(
            `/login?redirect=/group/revisions?${encodeURIComponent(stringify(query))}`
          )
        } else {
          // User is a reader, not a writer of the group, so redirect to edit mode
          router.replace(`/group/edit?id=${id}`)
        }
      } else {
        setError('Group not found')
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
  }, [id, isRefreshing])

  if (error) return <ErrorDisplay message={error} />
  if (!group)
    return (
      <CommonLayout>
        <LoadingSpinner />
      </CommonLayout>
    )

  const editBanner = <EditBanner>{groupModeToggle('revisions', group.id)}</EditBanner>

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(group.id)} Group Edit History</h1>
        </div>
        <EditHistory
          group={group}
          accessToken={accessToken}
          setError={setError}
          editId={query.editId}
        />
      </div>
    </CommonLayout>
  )
}
