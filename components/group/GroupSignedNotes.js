/* globals promptError: false */

import { useCallback, useState } from 'react'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'
import api from '../../lib/api-client'
import { prettyInvitationId } from '../../lib/utils'

const GroupSignedNotes = ({ group }) => {
  const groupId = group.id
  const isV1Group = !group.domain
  const [totalCount, setTotalCount] = useState(null)

  const processNote = (note) => {
    const invitationId = note.invitations?.[0] ?? note.invitation
    const title = note.content?.title?.value ?? note.content?.title
    const user = note.content?.user?.value ?? note.content?.user
    return {
      id: note.id,
      title: `${prettyInvitationId(invitationId)}: ${title ?? note.forum}${
        user ? ` - ${user}` : ''
      }`,
      href: `/forum?id=${note.forum}${note.forum === note.id ? '' : `&noteId=${note.id}`}`,
    }
  }

  const loadNotes = async (limit, offset) => {
    const { notes, count } = await api.get(
      '/notes',
      {
        'signatures[]': [groupId],
        limit,
        offset,
      },
      { ...(isV1Group && { version: 1 }) }
    )

    let translatedNotes = []
    if (notes?.length > 0) {
      translatedNotes = notes.map(processNote)
    }
    if (count !== totalCount) {
      setTotalCount(count ?? 0)
    }

    return {
      items: translatedNotes,
      count: count ?? 0,
    }
  }

  const loadItems = useCallback(loadNotes, [groupId])

  return (
    <EditorSection
      title={`Signed Notes ${totalCount ? `(${totalCount})` : ''}`}
      className="notes"
    >
      <PaginatedList loadItems={loadItems} emptyMessage="No signed notes" />
    </EditorSection>
  )
}

export default GroupSignedNotes
