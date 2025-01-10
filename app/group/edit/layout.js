'use client'

import { useSearchParams } from 'next/navigation'
import CommonLayout from '../../CommonLayout'
import { prettyId } from '../../../lib/utils'
import { groupModeToggle } from '../../../lib/banner-links'
import styles from '../Group.module.scss'
import EditBanner from '../../../components/EditBanner'

export default function Layout({ children }) {
  const query = useSearchParams()
  const editBanner = <EditBanner>{groupModeToggle('edit', query.get('id'))}</EditBanner>
  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.group}>
        <div id="header">
          <h1>{prettyId(query.get('id'))}</h1>
        </div>
        {children}
      </div>
    </CommonLayout>
  )
}
