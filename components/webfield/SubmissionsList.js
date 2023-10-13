import { useState, useEffect, useCallback } from 'react'
import Note, { NoteV2 } from '../Note'
import PaginatedList from '../PaginatedList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'

const defaultDisplayOptions = {
  pdfLink: true,
  replyCount: true,
  showContents: true,
  collapse: true,
  showTags: false,
  showEdges: false,
}

export default function SubmissionsList({
  venueId,
  query,
  ListItem,
  shouldReload,
  updateCount,
  filterNotes,
  pageSize,
  enableSearch,
  useCredentials,
  paperDisplayOptions,
}) {
  const { accessToken, userLoading } = useUser()

  const [combinedDisplayOptions, setCombinedDisplayOptions] = useState(defaultDisplayOptions)
  const details = 'replyCount,presentation'

  const loadNotes = useCallback(
    async (limit, offset) => {
      const { notes, count } = await api.get(
        '/notes',
        { details, ...query, limit, offset, domain: venueId },
        { accessToken, version: 2, useCredentials: useCredentials ?? true }
      )
      if (typeof updateCount === 'function') {
        updateCount(count ?? 0)
      }
      return {
        items: typeof filterNotes === 'function' ? notes.filter(filterNotes) : notes,
        count: count ?? 0,
      }
    },
    [accessToken, query, 2, useCredentials]
  )

  const searchNotes = useCallback(
    async (term, limit, offset) => {
      const { notes, count } = await api.get(
        '/notes/search',
        {
          ...(query['content.venue'] && { venue: query['content.venue'] }),
          ...(query['content.venueid'] && { venueid: query['content.venueid'] }),
          term,
          type: 'terms',
          content: 'all',
          source: 'forum',
          group: venueId,
          limit,
          offset,
        },
        { accessToken, version: 2, useCredentials: useCredentials ?? true }
      )
      return {
        items: notes,
        count: count ?? 0,
      }
    },
    [accessToken, query, 2, useCredentials]
  )

  function NoteListItem({ item }) {
    return <NoteV2 note={item} options={combinedDisplayOptions} />
  }

  useEffect(() => {
    if (paperDisplayOptions) {
      setCombinedDisplayOptions({ ...defaultDisplayOptions, ...paperDisplayOptions })
    }
  }, [paperDisplayOptions])

  if (userLoading) return null

  return (
    <PaginatedList
      loadItems={loadNotes}
      searchItems={enableSearch && searchNotes}
      ListItem={ListItem ?? NoteListItem}
      itemsPerPage={pageSize ?? 25}
      shouldReload={shouldReload}
      className="submissions-list"
    />
  )
}
