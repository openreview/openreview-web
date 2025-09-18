import { useEffect, useState } from 'react'
import { orderBy } from 'lodash'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { inflect, prettyId } from '../../lib/utils'

const OtherVersions = ({ note }) => {
  const { accessToken, isRefreshing } = useUser()
  const [otherVersions, setOtherVersions] = useState(null)

  const loadOtherVersions = async () => {
    try {
      const result = await api.get(
        '/notes',
        {
          paperhash: note.content.paperhash.value,
        },
        { accessToken }
      )

      const otherNoteVersions = orderBy(
        result.notes.filter((p) => p.id !== note.id && p.content?.venue?.value),
        'pdate',
        'desc'
      )
      setOtherVersions(otherNoteVersions)
    } catch (_) {
      /* empty */
    }
  }

  useEffect(() => {
    if (!note?.content?.paperhash?.value || isRefreshing) return
    loadOtherVersions()
  }, [note?.id, isRefreshing])

  if (!otherVersions?.length) return null

  return (
    <div className="forum-other-versions">
      <span className="mr-2">
        View other {inflect(otherVersions.length, 'version', 'versions', true)}:
      </span>
      {otherVersions.map((otherVersionNote, index) => (
        <a
          key={otherVersionNote.id}
          href={`/forum?id=${otherVersionNote.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{prettyId(otherVersionNote.content.venue.value)}</span>
          {index < otherVersions.length - 1 && <span>{', '}</span>}
        </a>
      ))}
    </div>
  )
}

export default OtherVersions
