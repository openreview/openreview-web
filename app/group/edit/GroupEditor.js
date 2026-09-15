'use client'

import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import { useEffect, useState } from 'react'
import Banner from '../../../components/Banner'
import EditBanner from '../../../components/EditBanner'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import { groupModeToggle, referrerLink } from '../../../lib/banner-links'
import { prettyId } from '../../../lib/utils'
import CommonLayout from '../../CommonLayout'
import GroupAdmin from '../admin/GroupAdmin'
import GroupWithInvitation from './GroupWithInvitation'

import styles from '../Group.module.scss'

export default function GroupEditor({ id, query }) {
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(null)
  const { user, isRefreshing } = useUser()
  const router = useRouter()

  const loadGroup = async () => {
    try {
      const { groups } = await api.get('/groups', { id, details: 'writable' })
      if (!groups?.length) throw new Error('Group not found')
      const group = groups[0]
      if (group.details?.writable) {
        // Get venue group to pass to webfield component
        if (group.domain && group.domain !== group.id) {
          const domainResult = await api.get('/groups', { id: group.domain })
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
        if (!user) {
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
  // A page that sent the user here (the venue's workflow configuration) gets a way back.
  const banner = query.referrer ? <Banner>{referrerLink(query.referrer)}</Banner> : null
  return (
    <CommonLayout banner={banner} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(group.id)}</h1>
        </div>
        <div className="groupEditorTabsContainer">
          <GroupWithInvitation group={group} reloadGroup={() => loadGroup(group.id)} />
        </div>
      </div>
    </CommonLayout>
  )
}
