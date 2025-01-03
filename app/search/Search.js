'use client'

import { use, useEffect, useState } from 'react'
import NoteList from '../../components/NoteList'
import PaginationLinks from '../../components/PaginationLinks'

const displayOptions = {
  pdfLink: true,
  htmlLink: true,
  showContents: false,
  emptyMessage: '',
}
const pageSize = 25

export default function Search({ loadSearchResultsP }) {
  const { notes: apiNotes, count: apiCount } = use(loadSearchResultsP)

  const count = apiCount > 1000 ? 1000 : apiCount
  const allNotes = apiNotes.slice(0, 1000)
  const [notes, setNotes] = useState(allNotes.slice(0, pageSize))
  const [page, setPage] = useState(1)

  useEffect(() => {
    setNotes(allNotes.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize))
  }, [page])

  useEffect(() => {
    setPage(1)
    setNotes(allNotes.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize))
  }, [loadSearchResultsP])

  return (
    <>
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
