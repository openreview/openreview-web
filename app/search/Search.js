import { useEffect, useState } from 'react'
import { truncate } from 'lodash'
import NoteList from '../../components/NoteList'
import PaginationLinks from '../../components/PaginationLinks'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import LoadingSpinner from '../../components/LoadingSpinner'
import { inflect } from '../../lib/utils'
import ErrorAlert from '../../components/ErrorAlert'

const displayOptions = {
  pdfLink: true,
  htmlLink: true,
  showContents: false,
  emptyMessage: '',
}
const pageSize = 25

export default function Search({ searchQuery, sourceOptions }) {
  const [allNotes, setAllNotes] = useState(null)
  const [notes, setNotes] = useState([])
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [error, setError] = useState(null)
  const { accessToken, isRefreshing } = useUser()

  const loadSearchResults = async (query) => {
    try {
      const result = await api.getCombined(
        '/notes/search',
        {
          term: query.term,
          type: 'terms',
          content: query.content || 'all',
          group: query.group || 'all',
          source: Object.keys(sourceOptions).includes(query.source) ? query.source : 'all',
          sort: 'tmdate:desc',
          limit: 1000,
        },
        null,
        { accessToken, resultsKey: 'notes' }
      )
      setAllNotes(result.notes)
      setCount(result.count > 1000 ? 1000 : result.count)
      setNotes(result.notes.slice(0, pageSize))
      setPage(1)
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    if (!allNotes) return
    setNotes(allNotes.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize))
  }, [page])

  useEffect(() => {
    if (isRefreshing) return
    loadSearchResults(searchQuery)
  }, [searchQuery, isRefreshing])

  if (error) return <ErrorAlert error={error} />
  if (!allNotes) return <LoadingSpinner />

  return (
    <>
      <h3>
        {inflect(count, 'result', 'results', true)} found for &quot;
        {truncate(searchQuery.term, { length: 200, separator: /,? +/ })}
        &quot;
      </h3>
      <hr className="small" />
      <NoteList notes={notes} displayOptions={displayOptions} />
      <PaginationLinks
        currentPage={page}
        itemsPerPage={pageSize}
        totalCount={count}
        setCurrentPage={setPage}
      />
    </>
  )
}
