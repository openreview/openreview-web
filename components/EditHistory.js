import { useEffect, useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import Edit from './Edit/Edit'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'

import styles from '../styles/components/EditHistory.module.scss'

function EmptyMessage({ id }) {
  return (
    <p className="empty-message">No revision history available for {prettyId(id)}.</p>
  )
}

export default function EditHistory({ group, invitation, accessToken, setError }) {
  const [edits, setEdits] = useState(null)
  const [count, setCount] = useState(null)

  useEffect(() => {
    const loadEdits = async () => {
      const groupOrInvitation = group ? 'group' : 'invitation'
      const queryParam = `${groupOrInvitation}.id`
      try {
        const apiRes = await api.get(
          `/${groupOrInvitation}s/edits`,
          {
            [queryParam]: group?.id ?? invitation?.id,
            sort: 'tcdate',
            details: 'writable,presentation',
            trash: true,
          },
          { accessToken, version: 2 }
        )
        if (apiRes.edits?.length > 0) {
          setEdits(apiRes.edits.map((edit) => ({
            ...edit,
            invitations: [edit.invitation.id]
          })))
        } else {
          setEdits([])
        }
        setCount(apiRes.count ?? 0)
      } catch (apiError) {
        setError({ statusCode: apiError.status, message: apiError.message })
      }
    }

    loadEdits()
  }, [group, invitation, accessToken])

  if (!group && !invitation) return null

  if ((group && !group.invitations?.length > 0) || (invitation && invitation.apiVersion === 1)) {
    return (
      <div>
        <EmptyMessage id={group?.id ?? invitation?.id} />
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
            type={group ? 'group' : 'invitation'}
            options={{
              showContents: true,
              extraClasses: edit.ddate ? 'edit-trashed' : '',
            }}
          />
        )) : (
          <EmptyMessage id={group?.id ?? invitation?.id} />
        )}
      </div>
    </div>
  )
}
