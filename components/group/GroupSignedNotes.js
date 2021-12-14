/* globals promptError: false */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getGroupVersion, prettyInvitationId } from '../../lib/utils'
import api from '../../lib/api-client'
import EditorSection from '../EditorSection'
import PaginatedList from '../PaginatedList'

const SignedNotesRow = ({ signedNote, version }) => {
  const invitationId = version === 2 ? signedNote.invitations[0] : signedNote.invitation
  const title = version === 2 ? signedNote.content?.title?.value : signedNote.content?.title
  const user = version === 2 ? signedNote.content?.user?.value : signedNote.content?.user
  return (
    <Link
      href={`/forum?id=${signedNote.forum}${signedNote.forum === signedNote.id ? '' : `&noteId=${signedNote.id}`}`}
    >
      <a>
        {`${prettyInvitationId(invitationId)}: ${title ?? signedNote.forum}${user ? ` - ${user}` : ''}`}
      </a>
    </Link>
  )
}

const GroupSignedNotes = ({ groupId, accessToken }) => {
  const [totalCount, setTotalCount] = useState(null)
  const groupVersion = getGroupVersion(groupId)

  const loadNotes = async (limit = 15, offset = 0) => {
    // TODO: how signatures is passed to api may change
    const result = await api.get(
      '/notes',
      { 'signatures[]': [groupId], limit, offset },
      { accessToken, version: groupVersion },
    )
    setTotalCount(result.count)
    return {
      items: result.notes,
      count: result.count,
    }
  }

  const renderSignedNote = ({ item }) => (
    <SignedNotesRow
      signedNote={item}
      version={groupVersion}
    />
  )

  useEffect(() => {
    loadNotes()
  }, [])

  return (
    <EditorSection title={`Signed Notes ${totalCount ? `(${totalCount})` : ''}`} className="notes">
      <PaginatedList
        ListItem={renderSignedNote}
        loadItems={loadNotes}
        emptyMessage="No signed notes"
      />
    </EditorSection>
  )
}

export default GroupSignedNotes
