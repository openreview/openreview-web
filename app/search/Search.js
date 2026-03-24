import { truncate } from 'lodash'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setBannerContent } from '../../bannerSlice'
import ErrorAlert from '../../components/ErrorAlert'
import LoadingSpinner from '../../components/LoadingSpinner'
import NoteList from '../../components/NoteList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'

const displayOptions = {
  pdfLink: true,
  htmlLink: true,
  showContents: false,
  emptyMessage: '',
}
const limit = 20

export default function Search({ searchQuery, sourceOptions }) {
  const [notes, setNotes] = useState(null)
  const [counts, setCounts] = useState({})
  const [offset, setOffset] = useState(0)
  const [endOfResults, setEndOfResults] = useState(false)
  const [error, setError] = useState(null)
  const { isRefreshing } = useUser()
  const dispatch = useDispatch()

  const loadSearchResults = async (query) => {
    try {
      const v1ResultsP =
        offset <= (counts.v1 ?? 0)
          ? api.get(
              '/notes/search',
              {
                term: query.term,
                type: 'terms',
                content: query.content || 'all',
                group: query.group || 'all',
                source: Object.keys(sourceOptions).includes(query.source)
                  ? query.source
                  : 'all',
                offset,
                limit,
              },
              { version: 1 }
            )
          : Promise.resolve({ notes: [] })

      const v2ResultsP =
        offset <= (counts.v2 ?? 0)
          ? api.get('/notes/search', {
              term: query.term,
              type: 'terms',
              content: query.content || 'all',
              group: query.group || 'all',
              source: Object.keys(sourceOptions).includes(query.source) ? query.source : 'all',
              offset,
              limit,
            })
          : Promise.resolve({ notes: [] })

      const [v1Results, v2Results] = await Promise.all([v1ResultsP, v2ResultsP])
      const searchUnavailable = v1Results.searchUnavailable || v2Results.searchUnavailable
      dispatch(
        setBannerContent(
          searchUnavailable
            ? {
                type: 'error',
                value:
                  'OpenReview is experiencing degraded performance in search functionality. Please try again later.',
              }
            : { type: null, value: null }
        )
      )

      if (!v1Results?.notes?.length && !v2Results?.notes?.length) {
        if (offset === 0) {
          // initial load with no results
          setNotes([])
        } else {
          setEndOfResults(true)
        }
        return
      }
      if (offset === 0) {
        setCounts({
          v1: v1Results.count,
          v2: v2Results.count,
        })
        setNotes([...v2Results.notes, ...v1Results.notes])
        return
      }
      setNotes([...(notes ?? []), ...v2Results.notes, ...v1Results.notes])
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    setNotes(null)
    setOffset(0)
    setEndOfResults(false)
    setCounts({})
    setError(null)
    loadSearchResults(searchQuery)
  }, [searchQuery, isRefreshing])

  useEffect(() => {
    loadSearchResults(searchQuery)
  }, [offset])

  if (error) return <ErrorAlert error={error} />
  if (!notes) return <LoadingSpinner />

  return (
    <>
      <h3>
        Results for &quot;
        {truncate(searchQuery.term, { length: 200, separator: /,? +/ })}
        &quot;
      </h3>
      <hr className="small" />
      <NoteList notes={notes} displayOptions={displayOptions} />
      {notes.length > 0 ? (
        <div className="text-center mt-4">
          <button
            type="button"
            className="btn btn-xs btn-default"
            onClick={() => {
              if (endOfResults) {
                window.scrollTo(0, 0)
                return
              }
              setOffset((existingOffset) => existingOffset + limit)
            }}
          >
            {endOfResults ? (
              'You have reached the end of search results'
            ) : (
              <span>View More Results &rarr;</span>
            )}
          </button>
        </div>
      ) : (
        <p className="empty-message">No results found for your search query.</p>
      )}
    </>
  )
}
