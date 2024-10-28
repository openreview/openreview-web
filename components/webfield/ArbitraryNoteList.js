/* globals promptError: false */

import { useEffect, useState } from 'react'
import LoadingSpinner from '../LoadingSpinner'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import NoteList from '../NoteList'

const ArbitraryNoteList = ({ noteIds, setHidden }) => {
  const [allNotes, setAllNotes] = useState(null)
  const { accessToken } = useUser()

  const loadNotes = async () => {
    try {
      const result = await api.getAll(
        '/notes',
        { ids: noteIds.slice(0, 500), details: 'replyCount' },
        { accessToken }
      )
      if (result.length === 0) setHidden(true)
      setAllNotes(result)
    } catch (error) {
      promptError(error.message)
      setHidden(true)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [noteIds])

  if (!allNotes) return <LoadingSpinner />
  return (
    <NoteList
      notes={allNotes}
      displayOptions={{
        showContents: true,
        showPrivateIcon: true,
        collapse: false,
        replyCount: true,
        extraClasses: 'arbitrary-note-list',
      }}
    />
  )
}

export default ArbitraryNoteList
