/* globals $: false */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from './LoadingSpinner'
import Edit from './Edit/Edit'
import PaginationLinks from './PaginationLinks'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'

import styles from '../styles/components/EditHistory.module.scss'

function EmptyMessage({ id }) {
  return <p className="empty-message">No revision history available for {prettyId(id)}.</p>
}

export default function EditHistory({ group, invitation, accessToken, setError, editId }) {
  const [edits, setEdits] = useState(null)
  const [count, setCount] = useState(null)
  const [editLookupComplete, setEditLookupComplete] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 25

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
            limit: pageSize,
            offset: (page - 1) * pageSize,
            trash: true,
          },
          { accessToken }
        )
        if (apiRes.edits?.length > 0) {
          setEdits(
            apiRes.edits.map((edit) => ({
              ...edit,
              invitations: [edit.invitation.id],
            }))
          )
        } else {
          setEdits([])
          setEditLookupComplete(true)
        }
        setCount(apiRes.count ?? 0)
      } catch (apiError) {
        setError(apiError.message)
      }
    }

    loadEdits()
  }, [group, invitation, accessToken, page])

  useEffect(() => {
    const findEditId = async () => {
      if (edits.find((p) => p.id === editId)) {
        setEditLookupComplete(true)
      } else if ((page + 1) * pageSize > count) {
        setPage(1)
        setEditLookupComplete(true)
      } else {
        setPage((prevPage) => prevPage + 1)
      }
    }
    if (!editId || editLookupComplete || !edits?.length > 0) return
    findEditId()
  }, [edits])

  const renderEdits = () => {
    if (!edits) return <LoadingSpinner inline />
    if (edits.length === 0) return <EmptyMessage id={group?.id ?? invitation?.id} />

    return edits.map((edit) => {
      if (edit.id === editId && editLookupComplete)
        return (
          <motion.div
            key={edit.id}
            animate={{
              rotate: [0, -1, 1, -1, 1, 0],
            }}
            transition={{ duration: 0.25, ease: 'linear' }}
            onAnimationStart={() => {
              $(`#${editId}`)[0].scrollIntoView()
            }}
          >
            <Edit
              key={edit.id}
              edit={edit}
              type={group ? 'group' : 'invitation'}
              className={edit.ddate ? 'edit-trashed' : ''}
              showContents
            />
          </motion.div>
        )
      return (
        <Edit
          key={edit.id}
          edit={edit}
          type={group ? 'group' : 'invitation'}
          className={edit.ddate ? 'edit-trashed' : ''}
          showContents
        />
      )
    })
  }

  if (!group && !invitation) return null

  if ((group && !group.invitations) || (invitation && invitation.apiVersion === 1)) {
    return (
      <div>
        <EmptyMessage id={group?.id ?? invitation?.id} />
      </div>
    )
  }

  if (!editLookupComplete) return <LoadingSpinner />

  return (
    <div className="row">
      <div className={`submissions-list col-xs-12 col-sm-9 ${styles.container}`}>
        {renderEdits()}
      </div>

      <div className="col-xs-12">
        <PaginationLinks
          currentPage={page}
          setCurrentPage={setPage}
          itemsPerPage={pageSize}
          totalCount={count}
        />
      </div>
    </div>
  )
}
