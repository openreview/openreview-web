import { useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { inflect } from '../../lib/utils'

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
      const otherNoteVersions = result.notes.filter((p) => p.id !== note.id)
      setOtherVersions(otherNoteVersions)
    } catch (_) {
      /* empty */
    }
  }

  useEffect(() => {
    if (!note?.content?.venue || isRefreshing) return
    loadOtherVersions()
  }, [note, isRefreshing])

  if (!otherVersions?.length) return null

  return (
    <div className="btn-group">
      <button
        type="button"
        className="btn btn-xs dropdown-toggle"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        {otherVersions.length} Other {inflect(otherVersions.length, 'Version', 'Versions')}{' '}
        <span className="caret" />
      </button>
      <ul className="dropdown-menu">
        {otherVersions?.map((otherVersionNote) => (
          <li key={otherVersionNote.id} data-toggle="tooltip" data-placement="top">
            <a href={`/forum?id=${otherVersionNote.id}`}>
              {otherVersionNote.content.venue.value}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default OtherVersions
