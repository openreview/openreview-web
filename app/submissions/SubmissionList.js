'use client'

import { use, useEffect, useState } from 'react'
import NoteList from '../../components/NoteList'
import PaginationLinks from '../../components/PaginationLinks'
import api from '../../lib/api-client'
import { useSelector } from 'react-redux'

export default function SubmissionList({ getFirstPageNotesP, notesPerPage, invitationId }) {
  const { notes: firstPageNotes, count } = use(getFirstPageNotesP)
  const { token } = useSelector((state) => state.root)
  const [currentPage, setCurrentPage] = useState(1)
  const [notes, setNotes] = useState(firstPageNotes)

  const displayOptions = {
    pdfLink: false,
    htmlLink: false,
    showContents: false,
    emptyMessage: 'No submissions found.',
  }

  const getNotes = async (page) => {
    const response = await api.get(
      '/notes',
      {
        invitation: invitationId,
        limit: notesPerPage,
        offset: notesPerPage * (page - 1),
      },
      {
        accessToken: token,
      }
    )
    setNotes(response.notes)
  }

  useEffect(() => {
    if (currentPage === 1) {
      setNotes(firstPageNotes)
      return
    }
    getNotes(currentPage)
  }, [currentPage])

  return (
    <>
      <div className="notes">
        <NoteList notes={notes} displayOptions={displayOptions} />
      </div>
      <PaginationLinks
        currentPage={currentPage}
        itemsPerPage={notesPerPage}
        totalCount={count}
        setCurrentPage={setCurrentPage}
      />
    </>
  )
}
