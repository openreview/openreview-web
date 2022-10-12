import Note, { NoteV2 } from '../Note'
import PaginatedList from '../PaginatedList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'

export default function SubmissionsList({ venueId, query, apiVersion, options = {} }) {
  const { accessToken, userLoading } = useUser()

  const paperDisplayOptions = {
    pdfLink: true,
    replyCount: true,
    showContents: true,
    collapse: true,
    showTags: false,
  }
  const opts = {
    enableSearch: false,
    pageSize: 25,
    ...options,
  }

  const loadNotes = async (limit, offset) => {
    const { notes, count } = await api.get(
      '/notes',
      { ...query, details: 'replyCount,invitation,original', limit, offset },
      { accessToken, version: apiVersion }
    )
    return {
      items: notes,
      count: count ?? 0,
    }
  }

  const searchNotes = async (term, limit, offset) => {
    const { notes, count } = await api.get(
      '/notes/search',
      {
        ...query,
        term,
        type: 'terms',
        content: 'all',
        source: 'forum',
        group: venueId,
        limit,
        offset,
      },
      { accessToken, version: apiVersion }
    )
    return {
      items: notes,
      count: count ?? 0,
    }
  }

  function NoteListItem({ item }) {
    if (apiVersion === 2) {
      return <NoteV2 note={item} options={paperDisplayOptions} />
    }
    return <Note note={item} options={paperDisplayOptions} />
  }

  if (userLoading) return null

  return (
    <PaginatedList
      loadItems={loadNotes}
      searchItems={opts.enableSearch && searchNotes}
      ListItem={NoteListItem}
      itemsPerPage={opts.pageSize}
      className="submissions-list"
    />
  )
}
