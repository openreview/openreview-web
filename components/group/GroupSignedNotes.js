/* globals promptError: false */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getGroupVersion, prettyInvitationId } from '../../lib/utils'
import api from '../../lib/api-client'
import PaginationLinks from '../PaginationLinks'

const SignedNotesRow = ({ signedNote, version }) => {
  const invitationId = version === 2 ? signedNote.invitations[0] : signedNote.invitation
  const title = version === 2 ? signedNote.content?.title?.value : signedNote.content?.title
  const user = version === 2 ? signedNote.content?.user?.value : signedNote.content?.user
  return (
    <li>
      <Link
        href={`/forum?id=${signedNote.forum}${
          signedNote.forum === signedNote.id ? '' : `&noteId=${signedNote.id}`
        }`}
      >
        <a>
          {`${prettyInvitationId(invitationId)}: ${title ?? signedNote.forum}${
            user ? ` - ${user}` : ''
          }`}
        </a>
      </Link>
    </li>
  )
}

const GroupSignedNotes = ({ groupId, accessToken }) => {
  const [signedNotes, setSignedNotes] = useState([])
  const [totalCount, setTotalCount] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const groupVersion = getGroupVersion(groupId)

  const loadNotes = async (limit = 15, offset = 0) => {
    try {
      // TODO: how signatures is passed to api may change
      const result = await api.get(
        '/notes',
        { 'signatures[]': [groupId], limit, offset },
        { accessToken, version: groupVersion },
      )
      setTotalCount(result.count)
      setSignedNotes(result.notes)
    } catch (error) {
      promptError(error.message)
    }
  }

  const getTitle = () => `Signed Notes ${totalCount ? `(${totalCount})` : ''}`

  useEffect(() => {
    loadNotes()
  }, [])

  if (!signedNotes.length) return null
  return (
    <section>
      <h4>{getTitle()}</h4>
      <ul className="list-unstyled">
        {signedNotes.map(signedNote => (
          <SignedNotesRow
            key={signedNote.id}
            signedNote={signedNote}
            version={groupVersion}
          />
        ))}
      </ul>
      <PaginationLinks
        setCurrentPage={(pageNumber) => {
          setCurrentPage(pageNumber)
          loadNotes(15, (pageNumber - 1) * 15)
        }}
        totalCount={totalCount}
        itemsPerPage={15}
        currentPage={currentPage}
        options={{ noScroll: true }}
      />
    </section>
  )
}

export default GroupSignedNotes
