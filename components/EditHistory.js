import { useEffect, useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import Edit from './Edit/Edit'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'

import styles from '../styles/components/EditHistory.module.scss'

function EmptyMessage({ groupId }) {
  return (
    <p className="empty-message">No revision history available for {prettyId(groupId)}.</p>
  )
}

export default function EditHistory({ group, accessToken, setError }) {
  const [edits, setEdits] = useState(null)
  const [count, setCount] = useState(null)

  useEffect(() => {
    const loadEdits = async () => {
      try {
        const apiRes = await api.get(
          '/groups/edits',
          {
            'group.id': group.id,
            sort: 'tcdate',
            details: 'writable,presentation',
            trash: true,
          },
          { accessToken, version: 2 }
        )
        setEdits(apiRes.edits ?? [])
        setCount(apiRes.count ?? 0)
      } catch (apiError) {
        setError(apiError)
      }
    }

    loadEdits()
  }, [group.id])

  if (!group) return null

  if (!group.invitations?.length > 0) {
    return (
      <div>
        <EmptyMessage groupId={group.id} />
      </div>
    )
  }

  return (
    <div className="row">
      <div className={`submissions-list col-xs-12 col-sm-9 ${styles.container}`}>
        {!edits && (
          <LoadingSpinner inline />
        )}

        {edits?.length > 0 ? edits.map((edit) => (
          <Edit
            key={edit.id}
            edit={edit}
            type="group"
            options={{
              showContents: true,
              extraClasses: edit.ddate ? 'edit-trashed' : '',
            }}
          />
        )) : (
          <EmptyMessage groupId={group.id} />
        )}
      </div>
    </div>
  )
}
