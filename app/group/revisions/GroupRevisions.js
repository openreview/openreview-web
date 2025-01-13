'use client'

import { use, useEffect, useState } from 'react'
import { prettyId } from '../../../lib/utils'
import CommonLayout from '../../CommonLayout'
import EditBanner from '../../../components/EditBanner'
import { groupModeToggle } from '../../../lib/banner-links'
import styles from '../Group.module.scss'
import EditHistory from '../../../components/EditHistory'

export default function GroupRevisions({ loadGroupP, accessToken, isSuperUser }) {
  const group = use(loadGroupP)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!error) return
    throw new Error(error.message)
  }, [error])

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
          isSuperUser={isSuperUser}
          setError={setError}
        />
      </div>
    </CommonLayout>
  )
}
