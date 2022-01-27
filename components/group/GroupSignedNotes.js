/* globals promptError: false */

import { useCallback, useState } from 'react'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'
import api from '../../lib/api-client'
import { getGroupVersion, prettyInvitationId } from '../../lib/utils'

const GroupSignedNotes = ({ groupId, accessToken }) => {
  const [totalCount, setTotalCount] = useState(null)
  const version = getGroupVersion(groupId)

  const processNote = (note) => {
    const invitationId = version === 2 ? note.invitations[0] : note.invitation
    const title = version === 2 ? note.content?.title?.value : note.content?.title
    const user = version === 2 ? note.content?.user?.value : note.content?.user
    return {
      id: note.id,
      title: `${prettyInvitationId(invitationId)}: ${title ?? note.forum}${
        user ? ` - ${user}` : ''
      }`,
      href: `/forum?id=${note.forum}${note.forum === note.id ? '' : `&noteId=${note.id}`}`,
    }
  }

  const loadNotes = async (limit, offset) => {
    // TODO: how signatures is passed to api may change
    const { notes, count } = await api.get(
      '/notes',
      {
        'signatures[]': [groupId],
        limit,
        offset,
      },
      { accessToken, version }
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

  const loadItems = useCallback(loadNotes, [groupId, accessToken])

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
